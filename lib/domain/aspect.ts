/** Life-area aspect taxonomy for lens filtering and entity tagging. */

export type AspectId =
    | "all"
    | "finance"
    | "fitness"
    | "work"
    | "personal"
    | "admin";

export type AspectKey = Exclude<AspectId, "all">;

export type AspectDefinition = {
    id: AspectKey;
    label: string;
    shortLabel: string;
    description: string;
};

export const ASPECT_DEFINITIONS: AspectDefinition[] = [
    {
        id: "finance",
        label: "Finance",
        shortLabel: "Finance",
        description: "Money, bills, subscriptions, and financial admin.",
    },
    {
        id: "fitness",
        label: "Fitness",
        shortLabel: "Fitness",
        description: "Training, health habits, and physical goals.",
    },
    {
        id: "work",
        label: "Work",
        shortLabel: "Work",
        description: "Professional tasks, projects, and career admin.",
    },
    {
        id: "personal",
        label: "Personal",
        shortLabel: "Personal",
        description: "Life admin, relationships, and personal projects.",
    },
    {
        id: "admin",
        label: "Admin",
        shortLabel: "Admin",
        description: "Household, vehicle, insurance, and bureaucratic follow-ups.",
    },
];
