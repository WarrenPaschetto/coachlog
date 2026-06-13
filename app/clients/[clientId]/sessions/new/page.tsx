import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SessionLoggerForm } from "@/components/sessions/SessionLoggerForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type NewSessionPageProps = {
    params: Promise<{
        clientId: string;
    }>;
};

type PreviousSet = {
    id: string;
    set_number: number;
    reps: number | null;
    weight: number | null;
    rpe: number | null;
    notes: string | null;
};

type PreviousExercise = {
    id: string;
    exercise_name: string;
    exercise_order: number;
    notes: string | null;
    sets: PreviousSet[];
};

type PreviousSession = {
    id: string;
    session_date: string;
    title: string | null;
    general_notes: string | null;
    pain_flags: string | null;
    next_session_plan: string | null;
    exercises: PreviousExercise[];
};

async function createSessionAction(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const clientId = String(formData.get("client_id") || "");
    const title = String(formData.get("title") || "").trim();
    const generalNotes = String(formData.get("general_notes") || "").trim();
    const painFlags = String(formData.get("pain_flags") || "").trim();
    const nextSessionPlan = String(formData.get("next_session_plan") || "").trim();
    const exercisesJson = String(formData.get("exercises_json") || "[]");

    if (!clientId) {
        throw new Error("Client ID is required.");
    }

    const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("id")
        .eq("id", clientId)
        .eq("coach_id", user.id)
        .maybeSingle();

    if (clientError || !client) {
        throw new Error("Client not found.");
    }

    let exercises: {
        exercise_name: string;
        notes: string;
        sets: {
            reps: string;
            weight: string;
            rpe: string;
            notes: string;
        }[];
    }[] = [];

    try {
        exercises = JSON.parse(exercisesJson);
    } catch {
        throw new Error("Invalid exercise data.");
    }

    const cleanedExercises = exercises
        .map((exercise) => ({
            exercise_name: exercise.exercise_name.trim(),
            notes: exercise.notes.trim(),
            sets: exercise.sets
                .map((set) => ({
                    reps: set.reps.trim(),
                    weight: set.weight.trim(),
                    rpe: set.rpe.trim(),
                    notes: set.notes.trim(),
                }))
                .filter(
                    (set) =>
                        set.reps !== "" ||
                        set.weight !== "" ||
                        set.rpe !== "" ||
                        set.notes !== ""
                ),
        }))
        .filter((exercise) => exercise.exercise_name !== "");

    if (cleanedExercises.length === 0) {
        throw new Error("Add at least one exercise.");
    }

    const { data: session, error: sessionError } = await supabase
        .from("sessions")
        .insert({
            coach_id: user.id,
            client_id: clientId,
            title: title || "Training Session",
            general_notes: generalNotes || null,
            pain_flags: painFlags || null,
            next_session_plan: nextSessionPlan || null,
        })
        .select("id")
        .single();

    if (sessionError || !session) {
        console.error("Error creating session:", sessionError);
        throw new Error("Could not create session.");
    }

    for (const [exerciseIndex, exercise] of cleanedExercises.entries()) {
        const { data: sessionExercise, error: exerciseError } = await supabase
            .from("session_exercises")
            .insert({
                coach_id: user.id,
                session_id: session.id,
                exercise_name: exercise.exercise_name,
                exercise_order: exerciseIndex,
                notes: exercise.notes || null,
            })
            .select("id")
            .single();

        if (exerciseError || !sessionExercise) {
            console.error("Error creating exercise:", exerciseError);
            throw new Error("Could not create exercise.");
        }

        const setsToInsert = exercise.sets.map((set, setIndex) => ({
            coach_id: user.id,
            session_exercise_id: sessionExercise.id,
            set_number: setIndex + 1,
            reps: set.reps ? Number(set.reps) : null,
            weight: set.weight ? Number(set.weight) : null,
            rpe: set.rpe ? Number(set.rpe) : null,
            notes: set.notes || null,
        }));

        if (setsToInsert.length > 0) {
            const { error: setsError } = await supabase
                .from("exercise_sets")
                .insert(setsToInsert);

            if (setsError) {
                console.error("Error creating sets:", setsError);
                throw new Error("Could not create sets.");
            }
        }
    }

    redirect(`/clients/${clientId}`);
}

export default function NewSessionPage({ params }: NewSessionPageProps) {
    return (
        <Suspense fallback={<NewSessionLoading />}>
            <NewSessionContent params={params} />
        </Suspense>
    );
}

async function NewSessionContent({ params }: NewSessionPageProps) {
    const { clientId } = await params;

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const { data: client, error: clientError } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .eq("coach_id", user.id)
        .maybeSingle();

    if (clientError || !client) {
        notFound();
    }

    const { data: lastSession } = await supabase
        .from("sessions")
        .select("*")
        .eq("client_id", clientId)
        .eq("coach_id", user.id)
        .order("session_date", { ascending: false })
        .limit(1)
        .maybeSingle();

    let previousSession: PreviousSession | null = null;

    if (lastSession) {
        const { data: previousExercises } = await supabase
            .from("session_exercises")
            .select("*")
            .eq("session_id", lastSession.id)
            .eq("coach_id", user.id)
            .order("exercise_order", { ascending: true });

        const exerciseIds = previousExercises?.map((exercise) => exercise.id) ?? [];

        const { data: previousSets } =
            exerciseIds.length > 0
                ? await supabase
                    .from("exercise_sets")
                    .select("*")
                    .in("session_exercise_id", exerciseIds)
                    .eq("coach_id", user.id)
                    .order("set_number", { ascending: true })
                : { data: [] };

        previousSession = {
            id: lastSession.id,
            session_date: lastSession.session_date,
            title: lastSession.title,
            general_notes: lastSession.general_notes,
            pain_flags: lastSession.pain_flags,
            next_session_plan: lastSession.next_session_plan,
            exercises:
                previousExercises?.map((exercise) => ({
                    id: exercise.id,
                    exercise_name: exercise.exercise_name,
                    exercise_order: exercise.exercise_order,
                    notes: exercise.notes,
                    sets:
                        previousSets?.filter(
                            (set) => set.session_exercise_id === exercise.id
                        ) ?? [],
                })) ?? [],
        };
    }

    return (
        <main className="mx-auto max-w-6xl p-6">
            <div className="mb-8">
                <Link
                    href={`/clients/${client.id}`}
                    className="text-sm text-muted-foreground"
                >
                    ← Back to {client.first_name}
                </Link>

                <h1 className="mt-2 text-3xl font-bold">
                    New Session — {client.first_name} {client.last_name}
                </h1>

                <p className="text-muted-foreground">
                    Log exercises, sets, reps, weights, RPE, notes, and next-session plan.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                <SessionLoggerForm
                    clientId={client.id}
                    createSessionAction={createSessionAction}
                />

                <PreviousSessionCard previousSession={previousSession} />
            </div>
        </main>
    );
}

function PreviousSessionCard({
    previousSession,
}: {
    previousSession: PreviousSession | null;
}) {
    if (!previousSession) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Previous Session</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-sm text-muted-foreground">
                        No previous sessions yet. This will be the client&apos;s first
                        logged workout.
                    </p>
                </CardContent>
            </Card>
        );
    }

    const date = new Date(previousSession.session_date).toLocaleDateString();

    return (
        <Card className="h-fit">
            <CardHeader>
                <CardTitle>Previous Session</CardTitle>
                <p className="text-sm text-muted-foreground">{date}</p>
            </CardHeader>

            <CardContent className="space-y-5">
                {previousSession.exercises.length > 0 ? (
                    previousSession.exercises.map((exercise) => (
                        <div key={exercise.id} className="space-y-2">
                            <h3 className="font-medium">{exercise.exercise_name}</h3>

                            {exercise.sets.length > 0 ? (
                                <div className="space-y-1 text-sm text-muted-foreground">
                                    {exercise.sets.map((set) => (
                                        <p key={set.id}>
                                            Set {set.set_number}:{" "}
                                            {set.weight !== null ? `${set.weight} lb` : "—"} x{" "}
                                            {set.reps !== null ? set.reps : "—"}
                                            {set.rpe !== null ? ` @ RPE ${set.rpe}` : ""}
                                            {set.notes ? ` — ${set.notes}` : ""}
                                        </p>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-muted-foreground">
                                    No sets recorded.
                                </p>
                            )}

                            {exercise.notes ? (
                                <p className="text-sm text-muted-foreground">
                                    Notes: {exercise.notes}
                                </p>
                            ) : null}
                        </div>
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground">
                        No exercises recorded.
                    </p>
                )}

                {previousSession.pain_flags ? (
                    <div>
                        <h3 className="font-medium">Pain Flags</h3>
                        <p className="text-sm text-muted-foreground">
                            {previousSession.pain_flags}
                        </p>
                    </div>
                ) : null}

                {previousSession.next_session_plan ? (
                    <div>
                        <h3 className="font-medium">Next-Session Plan</h3>
                        <p className="text-sm text-muted-foreground">
                            {previousSession.next_session_plan}
                        </p>
                    </div>
                ) : null}
            </CardContent>
        </Card>
    );
}

function NewSessionLoading() {
    return (
        <main className="mx-auto max-w-6xl p-6">
            <div className="mb-8">
                <div className="h-4 w-40 rounded bg-muted" />
                <div className="mt-4 h-8 w-72 rounded bg-muted" />
                <div className="mt-3 h-4 w-96 rounded bg-muted" />
            </div>

            <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
                <div className="h-96 rounded-lg border bg-card" />
                <div className="h-96 rounded-lg border bg-card" />
            </div>
        </main>
    );
}