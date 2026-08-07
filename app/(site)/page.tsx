import { RootFlowChooser } from "@/components/onboarding/RootFlowChooser";

export default function Home() {
    return (
        <div className="min-h-screen bg-background px-4 py-8 lg:px-8">
            <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-5xl flex-col items-center justify-center gap-6">
                <div className="flex flex-col items-center space-y-3 text-center mb-3">
                    <p className="text-sm uppercase tracking-[0.28em] text-primary">
                        Veritie
                    </p>
                    <h1 className="max-w-3xl text-4xl font-semibold tracking-tight text-foreground lg:text-5xl">
                        Capture, organize, and share your life using voice.
                    </h1>
                </div>
                <RootFlowChooser />
            </div>
        </div>
    );
}
