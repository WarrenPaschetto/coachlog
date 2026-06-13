import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type ClientPageProps = {
    params: Promise<{
        clientId: string;
    }>;
};

type RecentSession = {
    id: string;
    session_date: string;
    title: string | null;
    general_notes: string | null;
    pain_flags: string | null;
    next_session_plan: string | null;
};

export default function ClientPage({ params }: ClientPageProps) {
    return (
        <Suspense fallback={<ClientPageLoading />}>
            <ClientPageContent params={params} />
        </Suspense>
    );
}

async function ClientPageContent({ params }: ClientPageProps) {
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

    if (clientError) {
        console.error("Error loading client:", clientError);
        notFound();
    }

    if (!client) {
        notFound();
    }

    const { data: recentSessions, error: sessionsError } = await supabase
        .from("sessions")
        .select(
            "id, session_date, title, general_notes, pain_flags, next_session_plan"
        )
        .eq("client_id", client.id)
        .eq("coach_id", user.id)
        .order("session_date", { ascending: false })
        .limit(5);

    if (sessionsError) {
        console.error("Error loading recent sessions:", sessionsError);
    }

    return (
        <main className="mx-auto max-w-4xl p-6">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <Link href="/dashboard" className="text-sm text-muted-foreground">
                        ← Back to dashboard
                    </Link>

                    <h1 className="mt-2 text-3xl font-bold">
                        {client.first_name} {client.last_name}
                    </h1>

                    <p className="text-muted-foreground">Client profile</p>
                </div>

                <Button asChild>
                    <Link href={`/clients/${client.id}/sessions/new`}>
                        Start Session
                    </Link>
                </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Goals</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap text-sm">
                            {client.goals || "No goals added yet."}
                        </p>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Injuries / Pain Flags</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap text-sm">
                            {client.injuries || "No injuries or pain flags added yet."}
                        </p>
                    </CardContent>
                </Card>

                <Card className="md:col-span-2">
                    <CardHeader>
                        <CardTitle>Coach Notes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="whitespace-pre-wrap text-sm">
                            {client.notes || "No notes added yet."}
                        </p>
                    </CardContent>
                </Card>

                <RecentSessionsSection
                    recentSessions={recentSessions ?? []}
                    clientId={client.id}
                />
            </div>
        </main>
    );
}

function RecentSessionsSection({
    recentSessions,
    clientId,
}: {
    recentSessions: RecentSession[];
    clientId: string;
}) {
    return (
        <Card className="md:col-span-2">
            <CardHeader className="flex flex-row items-center justify-between gap-4">
                <div>
                    <CardTitle>Recent Sessions</CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Last 5 logged workouts for this client.
                    </p>
                </div>

                <Button asChild size="sm">
                    <Link href={`/clients/${clientId}/sessions/new`}>Log Session</Link>
                </Button>
            </CardHeader>

            <CardContent>
                {recentSessions.length > 0 ? (
                    <div className="space-y-4">
                        {recentSessions.map((session) => (
                            <RecentSessionCard key={session.id} session={session} />
                        ))}
                    </div>
                ) : (
                    <div className="rounded-lg border border-dashed p-6">
                        <p className="text-sm text-muted-foreground">
                            No sessions logged yet.
                        </p>
                        <p className="mt-1 text-sm text-muted-foreground">
                            Start the first session to begin building this client&apos;s
                            training history.
                        </p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function RecentSessionCard({ session }: { session: RecentSession }) {
    const date = new Date(session.session_date).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

    return (
        <div className="rounded-lg border p-4">
            <div className="mb-3 flex items-start justify-between gap-4">
                <div>
                    <h3 className="font-medium">
                        {session.title || "Training Session"}
                    </h3>
                    <p className="text-sm text-muted-foreground">{date}</p>
                </div>
            </div>

            <div className="space-y-3 text-sm">
                {session.general_notes ? (
                    <div>
                        <p className="font-medium">General Notes</p>
                        <p className="whitespace-pre-wrap text-muted-foreground">
                            {session.general_notes}
                        </p>
                    </div>
                ) : null}

                {session.pain_flags ? (
                    <div>
                        <p className="font-medium">Pain Flags</p>
                        <p className="whitespace-pre-wrap text-muted-foreground">
                            {session.pain_flags}
                        </p>
                    </div>
                ) : null}

                {session.next_session_plan ? (
                    <div>
                        <p className="font-medium">Next-Session Plan</p>
                        <p className="whitespace-pre-wrap text-muted-foreground">
                            {session.next_session_plan}
                        </p>
                    </div>
                ) : null}

                {!session.general_notes &&
                    !session.pain_flags &&
                    !session.next_session_plan ? (
                    <p className="text-muted-foreground">No notes added.</p>
                ) : null}
            </div>
        </div>
    );
}

function ClientPageLoading() {
    return (
        <main className="mx-auto max-w-4xl p-6">
            <div className="mb-8">
                <div className="h-4 w-32 rounded bg-muted" />
                <div className="mt-4 h-8 w-64 rounded bg-muted" />
                <div className="mt-3 h-4 w-40 rounded bg-muted" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="h-40 rounded-lg border bg-card" />
                <div className="h-40 rounded-lg border bg-card" />
                <div className="h-40 rounded-lg border bg-card md:col-span-2" />
                <div className="h-64 rounded-lg border bg-card md:col-span-2" />
            </div>
        </main>
    );
}