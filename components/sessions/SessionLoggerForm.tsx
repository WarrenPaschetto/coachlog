"use client";

import { useMemo, useState } from "react";
import { Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type SetEntry = {
    id: string;
    reps: string;
    weight: string;
    rpe: string;
    notes: string;
};

type ExerciseEntry = {
    id: string;
    exercise_name: string;
    notes: string;
    sets: SetEntry[];
};

type SessionLoggerFormProps = {
    clientId: string;
    createSessionAction: (formData: FormData) => void;
};

function createId() {
    return crypto.randomUUID();
}

function createEmptySet(): SetEntry {
    return {
        id: createId(),
        reps: "",
        weight: "",
        rpe: "",
        notes: "",
    };
}

function createEmptyExercise(): ExerciseEntry {
    return {
        id: createId(),
        exercise_name: "",
        notes: "",
        sets: [createEmptySet()],
    };
}

export function SessionLoggerForm({
    clientId,
    createSessionAction,
}: SessionLoggerFormProps) {
    const [exercises, setExercises] = useState<ExerciseEntry[]>([
        createEmptyExercise(),
    ]);

    const exercisesJson = useMemo(() => JSON.stringify(exercises), [exercises]);

    function addExercise() {
        setExercises((current) => [...current, createEmptyExercise()]);
    }

    function removeExercise(exerciseId: string) {
        setExercises((current) => {
            if (current.length === 1) {
                return current;
            }

            return current.filter((exercise) => exercise.id !== exerciseId);
        });
    }

    function updateExercise(
        exerciseId: string,
        field: "exercise_name" | "notes",
        value: string
    ) {
        setExercises((current) =>
            current.map((exercise) =>
                exercise.id === exerciseId
                    ? {
                        ...exercise,
                        [field]: value,
                    }
                    : exercise
            )
        );
    }

    function addSet(exerciseId: string) {
        setExercises((current) =>
            current.map((exercise) =>
                exercise.id === exerciseId
                    ? {
                        ...exercise,
                        sets: [...exercise.sets, createEmptySet()],
                    }
                    : exercise
            )
        );
    }

    function removeSet(exerciseId: string, setId: string) {
        setExercises((current) =>
            current.map((exercise) => {
                if (exercise.id !== exerciseId) {
                    return exercise;
                }

                if (exercise.sets.length === 1) {
                    return exercise;
                }

                return {
                    ...exercise,
                    sets: exercise.sets.filter((set) => set.id !== setId),
                };
            })
        );
    }

    function updateSet(
        exerciseId: string,
        setId: string,
        field: "reps" | "weight" | "rpe" | "notes",
        value: string
    ) {
        setExercises((current) =>
            current.map((exercise) => {
                if (exercise.id !== exerciseId) {
                    return exercise;
                }

                return {
                    ...exercise,
                    sets: exercise.sets.map((set) =>
                        set.id === setId
                            ? {
                                ...set,
                                [field]: value,
                            }
                            : set
                    ),
                };
            })
        );
    }

    return (
        <form action={createSessionAction} className="space-y-6">
            <input type="hidden" name="client_id" value={clientId} />
            <input type="hidden" name="exercises_json" value={exercisesJson} />

            <Card>
                <CardHeader>
                    <CardTitle>Session Details</CardTitle>
                </CardHeader>

                <CardContent className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="title">Session Title</Label>
                        <Input
                            id="title"
                            name="title"
                            placeholder="Full Body Strength, Upper Body, Conditioning..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="general_notes">General Notes</Label>
                        <Textarea
                            id="general_notes"
                            name="general_notes"
                            placeholder="Energy level, motivation, warm-up notes, coaching observations..."
                        />
                    </div>
                </CardContent>
            </Card>

            {exercises.map((exercise, exerciseIndex) => (
                <Card key={exercise.id}>
                    <CardHeader className="flex flex-row items-center justify-between gap-4">
                        <CardTitle>Exercise {exerciseIndex + 1}</CardTitle>

                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeExercise(exercise.id)}
                            disabled={exercises.length === 1}
                            aria-label="Remove exercise"
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </CardHeader>

                    <CardContent className="space-y-5">
                        <div className="space-y-2">
                            <Label>Exercise Name</Label>
                            <Input
                                value={exercise.exercise_name}
                                onChange={(event) =>
                                    updateExercise(
                                        exercise.id,
                                        "exercise_name",
                                        event.target.value
                                    )
                                }
                                placeholder="Bench Press, Goblet Squat, Lat Pulldown..."
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="grid grid-cols-[48px_1fr_1fr_1fr_1.5fr_40px] gap-2 text-sm font-medium text-muted-foreground">
                                <div>Set</div>
                                <div>Reps</div>
                                <div>Weight</div>
                                <div>RPE</div>
                                <div>Notes</div>
                                <div />
                            </div>

                            {exercise.sets.map((set, setIndex) => (
                                <div
                                    key={set.id}
                                    className="grid grid-cols-[48px_1fr_1fr_1fr_1.5fr_40px] gap-2"
                                >
                                    <div className="flex items-center text-sm text-muted-foreground">
                                        {setIndex + 1}
                                    </div>

                                    <Input
                                        value={set.reps}
                                        onChange={(event) =>
                                            updateSet(
                                                exercise.id,
                                                set.id,
                                                "reps",
                                                event.target.value
                                            )
                                        }
                                        inputMode="numeric"
                                        placeholder="10"
                                    />

                                    <Input
                                        value={set.weight}
                                        onChange={(event) =>
                                            updateSet(
                                                exercise.id,
                                                set.id,
                                                "weight",
                                                event.target.value
                                            )
                                        }
                                        inputMode="decimal"
                                        placeholder="135"
                                    />

                                    <Input
                                        value={set.rpe}
                                        onChange={(event) =>
                                            updateSet(
                                                exercise.id,
                                                set.id,
                                                "rpe",
                                                event.target.value
                                            )
                                        }
                                        inputMode="decimal"
                                        placeholder="8"
                                    />

                                    <Input
                                        value={set.notes}
                                        onChange={(event) =>
                                            updateSet(
                                                exercise.id,
                                                set.id,
                                                "notes",
                                                event.target.value
                                            )
                                        }
                                        placeholder="Felt strong"
                                    />

                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => removeSet(exercise.id, set.id)}
                                        disabled={exercise.sets.length === 1}
                                        aria-label="Remove set"
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => addSet(exercise.id)}
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Add Set
                            </Button>
                        </div>

                        <div className="space-y-2">
                            <Label>Exercise Notes</Label>
                            <Textarea
                                value={exercise.notes}
                                onChange={(event) =>
                                    updateExercise(exercise.id, "notes", event.target.value)
                                }
                                placeholder="Tempo, form cues, pain, substitutions..."
                            />
                        </div>
                    </CardContent>
                </Card>
            ))}

            <Button type="button" variant="outline" onClick={addExercise}>
                <Plus className="mr-2 h-4 w-4" />
                Add Exercise
            </Button>

            <Card>
                <CardHeader>
                    <CardTitle>Finish Session</CardTitle>
                </CardHeader>

                <CardContent className="space-y-5">
                    <div className="space-y-2">
                        <Label htmlFor="pain_flags">Pain Flags</Label>
                        <Textarea
                            id="pain_flags"
                            name="pain_flags"
                            placeholder="Shoulder discomfort, knee pain, low back tightness..."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="next_session_plan">Next-Session Plan</Label>
                        <Textarea
                            id="next_session_plan"
                            name="next_session_plan"
                            placeholder="Progress squat, repeat bench load, add conditioning finisher..."
                        />
                    </div>

                    <Button type="submit" className="w-full">
                        Save Session
                    </Button>
                </CardContent>
            </Card>
        </form>
    );
}