export function getActorInitials(name: string): string {
    return name
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("");
}

export function getActorAvatarToneClass(name: string): string {
    const tones = [
        "bg-blue-500/15 text-blue-700 dark:text-blue-300",
        "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
        "bg-amber-500/15 text-amber-700 dark:text-amber-300",
        "bg-rose-500/15 text-rose-700 dark:text-rose-300",
        "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300",
    ] as const;

    const hash = name
        .split("")
        .reduce((total, char) => total + char.charCodeAt(0), 0);
    return tones[hash % tones.length];
}
