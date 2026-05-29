import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

async function createClientAction(formData: FormData) {
    "use server";

    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    const firstName = String(formData.get("first_name") || "").trim();
    const lastName = String(formData.get("last_name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const phone = String(formData.get("phone") || "").trim();
    const goals = String(formData.get("goals") || "").trim();
    const injuries = String(formData.get("injuries") || "").trim();
    const notes = String(formData.get("notes") || "").trim();

    if (!firstName) {
        throw new Error("First name is required.");
    }

    const { error } = await supabase.from("clients").insert({
        coach_id: user.id,
        first_name: firstName,
        last_name: lastName || null,
        email: email || null,
        phone: phone || null,
        goals: goals || null,
        injuries: injuries || null,
        notes: notes || null,
    });

    if (error) {
        console.error("Error creating client:", error);
        throw new Error("Could not create client.");
    }

    redirect("/dashboard");
}

export default async function NewClientPage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    return (
        <main className="mx-auto max-w-2xl p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold">Add Client</h1>
                <p className="text-muted-foreground">
                    Create a client profile for workout logging and progress tracking.
                </p>
            </div>

            <form action={createClientAction} className="space-y-6">
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="first_name">First Name *</Label>
                        <Input id="first_name" name="first_name" required />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="last_name">Last Name</Label>
                        <Input id="last_name" name="last_name" />
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input id="email" name="email" type="email" />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="phone">Phone</Label>
                        <Input id="phone" name="phone" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="goals">Goals</Label>
                    <Textarea
                        id="goals"
                        name="goals"
                        placeholder="Lose body fat, build strength, improve conditioning..."
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="injuries">Injuries / Pain Flags</Label>
                    <Textarea
                        id="injuries"
                        name="injuries"
                        placeholder="Low back pain, shoulder history, knee limitations..."
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes">Coach Notes</Label>
                    <Textarea
                        id="notes"
                        name="notes"
                        placeholder="Preferences, scheduling notes, personality, motivation style..."
                    />
                </div>

                <div className="flex gap-3">
                    <Button type="submit">Save Client</Button>
                    <Button variant="outline" asChild>
                        <a href="/dashboard">Cancel</a>
                    </Button>
                </div>
            </form>
        </main>
    );
}