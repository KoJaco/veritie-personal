"use client";

import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RootFlowChooser() {
    const router = useRouter();

    return (
        <div className="mx-auto flex w-full max-w-xl justify-center">
            <Button
                className="w-full justify-between sm:w-auto"
                onClick={() => router.push("/onboarding")}
            >
                Open onboarding
                <ArrowRight className="h-4 w-4" />
            </Button>
        </div>
    );
}
