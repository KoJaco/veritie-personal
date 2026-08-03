/**
 * Error component visual testing
 *
 * Debug component for visually testing error states and variations. I've returned null when not in dev mode.
 */

"use client";

import { useState } from "react";
import { RotateCw, RefreshCw, Home, X, AlertCircle } from "lucide-react";
import { ErrorState } from "@/components/system/error-state";
import { normalizeError } from "@/lib/errors/normalize";
import { isRecoverableError } from "@/lib/errors/is-recoverable";
import { envPublic } from "@/lib/config/env.public";

const isDevelopment =
    process.env.NODE_ENV === "development" || envPublic.appEnv === "local";

export default function ErrorTest() {
    const [selectedTest, setSelectedTest] = useState<string>("basic");

    const testCases = {
        basic: {
            title: "Basic Error",
            component: (
                <ErrorState message="This is a basic error message with no action button." />
            ),
        },
        withAction: {
            title: "Error with Action",
            component: (
                <ErrorState
                    message="This error has an action button with an icon."
                    action={{
                        label: "Try again",
                        onClick: () => alert("Action clicked!"),
                        icon: RotateCw,
                    }}
                />
            ),
        },
        withDetails: {
            title: "Error with Technical Details",
            component: (
                <ErrorState
                    title="Detailed Error"
                    message="This error shows technical details in development mode."
                    action={{
                        label: "Dismiss",
                        onClick: () => console.log("Dismissed"),
                        icon: X,
                    }}
                    details={JSON.stringify(
                        {
                            name: "TestError",
                            message: "This is a test error",
                            code: "TEST_001",
                            stack: "Error: Test error\n    at ErrorTest (test.tsx:42)\n    at render (app.tsx:15)",
                        },
                        null,
                        2
                    )}
                />
            ),
        },
        recoverable: {
            title: "Recoverable Error",
            component: (
                <ErrorState
                    title="Temporary Issue"
                    message="We encountered a temporary issue. Please try again."
                    action={{
                        label: "Try again",
                        onClick: () => console.log("Retry clicked"),
                        icon: RotateCw,
                    }}
                />
            ),
        },
        nonRecoverable: {
            title: "Non-Recoverable Error",
            component: (
                <ErrorState
                    title="Error"
                    message="An unexpected error occurred. Please refresh the page or contact support if the problem persists."
                    action={{
                        label: "Reload page",
                        onClick: () => window.location.reload(),
                        icon: RefreshCw,
                    }}
                />
            ),
        },
        notFound: {
            title: "404 Not Found",
            component: (
                <ErrorState
                    title="Page not found"
                    message="The page you're looking for doesn't exist or has been moved."
                    action={{
                        label: "Go home",
                        onClick: () => console.log("Navigate home"),
                        icon: Home,
                    }}
                />
            ),
        },
        customTitle: {
            title: "Custom Title",
            component: (
                <ErrorState
                    title="Custom Error Title"
                    message="This error has a custom title and icon."
                    action={{
                        label: "OK",
                        onClick: () => console.log("OK clicked"),
                        icon: AlertCircle,
                    }}
                />
            ),
        },
        longMessage: {
            title: "Long Error Message",
            component: (
                <ErrorState
                    title="Complex Error"
                    message="This is a very long error message that demonstrates how the component handles longer text content. It should wrap nicely and remain readable even with extended descriptions of what went wrong."
                    action={{
                        label: "Learn more",
                        onClick: () => console.log("Learn more clicked"),
                        icon: AlertCircle,
                    }}
                />
            ),
        },
        noAction: {
            title: "No Action Button",
            component: (
                <ErrorState
                    title="Information Only"
                    message="This error state has no action button, just the message."
                />
            ),
        },
    };

    // Test error normalization
    const testErrors = [
        new Error("Standard Error"),
        new Error("Error with code") as Error & { code: string },
        "String error",
        { message: "Object error", code: "OBJ_001" },
        null,
    ];

    // Set code on test error
    (testErrors[1] as Error & { code: string }).code = "ERR_001";

    if (!isDevelopment) {
        return null;
    }

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">
                    Error Component Testing
                </h1>
                <p className="text-muted-foreground">
                    Visual testing for error states and variations
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Test selector sidebar */}
                <div className="lg:col-span-1">
                    <div className="sticky top-4">
                        <h2 className="text-lg font-semibold mb-4">
                            Test Cases
                        </h2>
                        <div className="space-y-2">
                            {Object.entries(testCases).map(([key, test]) => (
                                <button
                                    key={key}
                                    onClick={() => setSelectedTest(key)}
                                    className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                                        selectedTest === key
                                            ? "bg-primary text-primary-foreground"
                                            : "bg-muted hover:bg-muted/80"
                                    }`}
                                >
                                    {test.title}
                                </button>
                            ))}
                        </div>

                        <div className="mt-8">
                            <h3 className="text-sm font-semibold mb-2">
                                Error Normalization Tests
                            </h3>
                            <div className="space-y-2 text-xs">
                                {testErrors.map((error, idx) => {
                                    const normalized = normalizeError(
                                        error,
                                        true
                                    );
                                    const recoverable =
                                        isRecoverableError(error);
                                    return (
                                        <div
                                            key={idx}
                                            className="p-2 rounded bg-muted text-xs"
                                        >
                                            <div className="font-mono text-xs mb-1">
                                                {normalized.name}
                                            </div>
                                            <div className="text-muted-foreground text-xs">
                                                {normalized.message}
                                            </div>
                                            <div className="mt-1 text-xs">
                                                <span
                                                    className={`px-1.5 py-0.5 rounded text-xs ${
                                                        recoverable
                                                            ? "bg-green-500/20 text-green-700 dark:text-green-400"
                                                            : "bg-red-500/20 text-red-700 dark:text-red-400"
                                                    }`}
                                                >
                                                    {recoverable
                                                        ? "Recoverable"
                                                        : "Non-recoverable"}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Test display area */}
                <div className="lg:col-span-3">
                    <div className="bg-card border rounded-lg p-4 mb-4">
                        <div className="flex items-center justify-between mb-2">
                            <h2 className="text-xl font-semibold">
                                {
                                    testCases[
                                        selectedTest as keyof typeof testCases
                                    ].title
                                }
                            </h2>
                            <span className="text-xs text-muted-foreground">
                                {selectedTest}
                            </span>
                        </div>
                    </div>

                    <div className="bg-background border rounded-lg overflow-hidden">
                        {
                            testCases[selectedTest as keyof typeof testCases]
                                .component
                        }
                    </div>

                    {/* Code preview */}
                    <div className="mt-4 bg-muted rounded-lg p-4">
                        <details className="text-sm">
                            <summary className="cursor-pointer font-semibold mb-2">
                                View Test Info
                            </summary>
                            <div className="mt-2 text-xs space-y-1">
                                <div>
                                    <span className="font-semibold">
                                        Test Case:
                                    </span>{" "}
                                    {selectedTest}
                                </div>
                                <div>
                                    <span className="font-semibold">
                                        Description:
                                    </span>{" "}
                                    {
                                        testCases[
                                            selectedTest as keyof typeof testCases
                                        ].title
                                    }
                                </div>
                            </div>
                        </details>
                    </div>
                </div>
            </div>
        </div>
    );
}
