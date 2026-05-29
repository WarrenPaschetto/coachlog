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

export default async function ClientPage({ params }: ClientPageProps) {
    const { clientId } = await params;

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const { data: client, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", clientId)
        .single();

    if (error || !client) {
        notFound();
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
            </div>
        </main>
    );
}