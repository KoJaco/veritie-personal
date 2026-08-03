import { RootFlowChooser } from "@/components/onboarding/RootFlowChooser";

export default function Home() {
    return (
        <div className="min-h-screen bg-background px-4 py-8 lg:px-8">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center gap-6">
                <div className="flex flex-col items-center space-y-3 text-center">
                    <p className="text-sm uppercase tracking-[0.28em] text-foreground/75">
                        PLATFORM SHELL
                    </p>
                    <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground lg:text-5xl">
                        Choose the workspace mode for this assistant-scoped
                        platform shell.
                    </h1>
                    <p className="max-w-xl text-base leading-7 text-foreground/50">
                        This repository supports both a populated demo workspace
                        and a guided onboarding-first bootstrap flow.
                    </p>
                </div>
                <RootFlowChooser />
            </div>
        </div>
    );
}
