import { act, fireEvent, render } from "@testing-library/react";
import React from "react";
import { Thread } from "@/components/assistant-ui/thread";

const mockState = {
    thread: {
        isEmpty: false,
        isRunning: false,
    },
};

jest.mock("@/components/assistant-ui/attachment", () => ({
    ComposerAddAttachment: () => <button type="button">attach</button>,
    ComposerAttachments: () => <div data-testid="composer-attachments" />,
    UserMessageAttachments: () => <div data-testid="user-attachments" />,
}));

jest.mock("@/components/assistant-ui/markdown-text", () => ({
    MarkdownText: () => <div data-testid="markdown-text" />,
}));

jest.mock("@/components/assistant-ui/tool-fallback", () => ({
    ToolFallback: () => <div data-testid="tool-fallback" />,
}));

jest.mock("@/components/assistant-ui/tooltip-icon-button", () => ({
    TooltipIconButton: ({
        children,
        ...props
    }: React.ComponentProps<"button">) => (
        <button type="button" {...props}>
            {children}
        </button>
    ),
}));

jest.mock("@/components/assistant-ui/chat-store", () => ({
    useChatStore: (selector: (state: { clearThread: jest.Mock }) => unknown) =>
        selector({ clearThread: jest.fn() }),
}));

jest.mock("@/components/ui/button", () => ({
    Button: ({ children, ...props }: React.ComponentProps<"button">) => (
        <button type="button" {...props}>
            {children}
        </button>
    ),
}));

jest.mock("@/components/ui/dropdown-menu", () => ({
    DropdownMenu: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    DropdownMenuContent: ({ children }: { children: React.ReactNode }) => (
        <div>{children}</div>
    ),
    DropdownMenuItem: ({
        children,
        onClick,
    }: {
        children: React.ReactNode;
        onClick?: () => void;
    }) => (
        <button type="button" onClick={onClick}>
            {children}
        </button>
    ),
}));

jest.mock("@assistant-ui/react", () => {
    return {
        ThreadPrimitive: {
            Root: ({
                children,
                className,
                style,
            }: {
                children: React.ReactNode;
                className?: string;
                style?: React.CSSProperties;
            }) => (
                <div className={className} style={style}>
                    {children}
                </div>
            ),
            Viewport: ({
                children,
                className,
                ...props
            }: {
                children: React.ReactNode;
                className?: string;
                [key: string]: unknown;
            }) => (
                <div className={className} {...props}>
                    {children}
                </div>
            ),
            Messages: () => <div data-testid="thread-messages" />,
            ViewportFooter: ({
                children,
                className,
            }: {
                children: React.ReactNode;
                className?: string;
            }) => <div className={className}>{children}</div>,
            ScrollToBottom: ({ children }: { children: React.ReactNode }) => (
                <>{children}</>
            ),
            Suggestions: () => <div data-testid="thread-suggestions" />,
        },
        SuggestionPrimitive: {
            Trigger: ({ children }: { children: React.ReactNode }) => (
                <>{children}</>
            ),
            Title: () => <span>title</span>,
            Description: () => <span>description</span>,
        },
        ComposerPrimitive: {
            Root: ({ children }: { children: React.ReactNode }) => (
                <div>{children}</div>
            ),
            AttachmentDropzone: ({
                children,
            }: {
                children: React.ReactNode;
            }) => <div>{children}</div>,
            Input: (props: React.ComponentProps<"textarea">) => (
                <textarea {...props} />
            ),
            Send: ({ children }: { children: React.ReactNode }) => (
                <>{children}</>
            ),
            Cancel: ({ children }: { children: React.ReactNode }) => (
                <>{children}</>
            ),
        },
        MessagePrimitive: {
            Root: ({ children }: { children: React.ReactNode }) => (
                <div>{children}</div>
            ),
            Parts: () => <div data-testid="message-parts" />,
            Error: ({ children }: { children: React.ReactNode }) => (
                <>{children}</>
            ),
        },
        ErrorPrimitive: {
            Root: ({ children }: { children: React.ReactNode }) => (
                <div>{children}</div>
            ),
            Message: () => <span>error</span>,
        },
        ActionBarPrimitive: {
            Root: ({ children }: { children: React.ReactNode }) => (
                <div>{children}</div>
            ),
            Edit: ({ children }: { children: React.ReactNode }) => (
                <>{children}</>
            ),
            Reload: ({ children }: { children: React.ReactNode }) => (
                <>{children}</>
            ),
            Copy: ({ children }: { children: React.ReactNode }) => (
                <>{children}</>
            ),
            Speak: ({ children }: { children: React.ReactNode }) => (
                <>{children}</>
            ),
            BranchPicker: ({ children }: { children: React.ReactNode }) => (
                <>{children}</>
            ),
            Source: ({ children }: { children: React.ReactNode }) => (
                <>{children}</>
            ),
        },
        ActionBarMorePrimitive: {
            Root: ({ children }: { children: React.ReactNode }) => (
                <div>{children}</div>
            ),
            Trigger: ({ children }: { children: React.ReactNode }) => (
                <>{children}</>
            ),
            Content: ({ children }: { children: React.ReactNode }) => (
                <>{children}</>
            ),
            Speech: ({ children }: { children: React.ReactNode }) => (
                <>{children}</>
            ),
            Copy: ({ children }: { children: React.ReactNode }) => (
                <>{children}</>
            ),
            Reload: ({ children }: { children: React.ReactNode }) => (
                <>{children}</>
            ),
        },
        BranchPickerPrimitive: {
            Root: ({ children }: { children: React.ReactNode }) => (
                <div>{children}</div>
            ),
            Previous: ({ children }: { children: React.ReactNode }) => (
                <>{children}</>
            ),
            Next: ({ children }: { children: React.ReactNode }) => (
                <>{children}</>
            ),
            Number: () => <span>1</span>,
        },
        AuiIf: ({
            condition,
            children,
        }: {
            condition: (state: typeof mockState) => boolean;
            children: React.ReactNode;
        }) => (condition(mockState) ? <>{children}</> : null),
    };
});

describe("Thread", () => {
    beforeEach(() => {
        jest.useFakeTimers();
    });

    afterEach(() => {
        jest.runOnlyPendingTimers();
        jest.useRealTimers();
    });

    it("applies gated scrollbar class and defaults scroll-active to false", () => {
        const { container } = render(<Thread threadKey="thread:test" />);
        const viewport = container.querySelector(".aui-thread-viewport");

        expect(viewport).not.toBeNull();
        expect(viewport).toHaveClass("thread-scrollbar-gated");
        expect(viewport).toHaveAttribute("data-scroll-active", "false");
    });

    it("sets scroll-active true on interaction and resets after timeout", () => {
        const { container } = render(<Thread threadKey="thread:test" />);
        const viewport = container.querySelector(".aui-thread-viewport");

        if (!viewport) {
            throw new Error("Viewport not found");
        }

        fireEvent.wheel(viewport);
        expect(viewport).toHaveAttribute("data-scroll-active", "true");

        act(() => {
            jest.advanceTimersByTime(899);
        });
        expect(viewport).toHaveAttribute("data-scroll-active", "true");

        act(() => {
            jest.advanceTimersByTime(1);
        });
        expect(viewport).toHaveAttribute("data-scroll-active", "false");
    });

    it("extends active window when additional scroll interaction occurs", () => {
        const { container } = render(<Thread threadKey="thread:test" />);
        const viewport = container.querySelector(".aui-thread-viewport");

        if (!viewport) {
            throw new Error("Viewport not found");
        }

        fireEvent.scroll(viewport);
        act(() => {
            jest.advanceTimersByTime(600);
        });
        fireEvent.touchMove(viewport);

        act(() => {
            jest.advanceTimersByTime(600);
        });
        expect(viewport).toHaveAttribute("data-scroll-active", "true");

        act(() => {
            jest.advanceTimersByTime(300);
        });
        expect(viewport).toHaveAttribute("data-scroll-active", "false");
    });
});
