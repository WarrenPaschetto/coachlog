import { Suspense } from "react";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function DashboardPage() {
    return (
        <Suspense fallback={<DashboardLoading />}>
            <DashboardContent />
        </Suspense>
    );
}

async function DashboardContent() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const { data: clients, error } = await supabase
        .from("clients")
        .select("id, first_name, last_name, goals, created_at")
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error loading clients:", error);
    }

    return (
        <main className="mx-auto max-w-5xl p-6">
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">CoachLog Lite</h1>
                    <p className="text-muted-foreground">
                        Track clients, sessions, progress, and notes.
                    </p>
                </div>

                <Button asChild>
                    <Link href="/clients/new">Add Client</Link>
                </Button>
            </div>

            <section className="grid gap-4 md:grid-cols-2">
                {clients && clients.length > 0 ? (
                    clients.map((client) => (
                        <Card key={client.id}>
                            <CardHeader>
                                <CardTitle>
                                    {client.first_name} {client.last_name}
                                </CardTitle>
                            </CardHeader>

                            <CardContent className="space-y-4">
                                {client.goals ? (
                                    <p className="text-sm text-muted-foreground">
                                        Goal: {client.goals}
                                    </p>
                                ) : (
                                    <p className="text-sm text-muted-foreground">
                                        No goals added yet.
                                    </p>
                                )}

                                <Button variant="outline" asChild>
                                    <Link href={`/clients/${client.id}`}>Open Client</Link>
                                </Button>
                            </CardContent>
                        </Card>
                    ))
                ) : (
                    <Card className="md:col-span-2">
                        <CardHeader>
                            <CardTitle>No clients yet</CardTitle>
                        </CardHeader>

                        <CardContent>
                            <p className="mb-4 text-muted-foreground">
                                Add your first client to start logging workouts.
                            </p>

                            <Button asChild>
                                <Link href="/clients/new">Add First Client</Link>
                            </Button>
                        </CardContent>
                    </Card>
                )}
            </section>
        </main>
    );
}

function DashboardLoading() {
    return (
        <main className="mx-auto max-w-5xl p-6">
            <div className="mb-8">
                <div className="h-8 w-48 rounded bg-muted" />
                <div className="mt-3 h-4 w-80 rounded bg-muted" />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
                <div className="h-40 rounded-lg border bg-card" />
                <div className="h-40 rounded-lg border bg-card" />
            </div>
        </main>
    );
}