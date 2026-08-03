"use client";

import * as React from "react";
import { useState } from "react";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Check, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

type PreProps = React.HTMLAttributes<HTMLPreElement>;

interface CodeHeaderProps {
  language?: string;
  copied: boolean;
  onCopy: () => void;
}

function CodeHeader({ language, copied, onCopy }: CodeHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-2 h-10">
      {language && (
        <div className="rounded text-xs font-mono opacity-60">
          {language}
        </div>
      )}
      <Button
        type="button"
        title={copied ? "Copied" : "Copy code"}
        variant="ghost"
        size="icon"
        className={cn(
          "h-7 w-7 group-hover:opacity-100 transition-opacity",
          copied ? "opacity-100" : "opacity-25",
        )}
        onClick={onCopy}
        aria-label="Copy code"
      >
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}

/**
 * Pre component - renders fenced code blocks with copy button (client only)
 *
 * Handles common react-markdown shape:
 * <pre>
 *   <code className="language-ts">...</code>
 * </pre>
 *
 * - Robust code extraction for copy (supports nested React nodes)
 * - ScrollArea + horizontal ScrollBar for overflow-x protection
 * - Optional language label extraction from nested <code className="language-...">
 * - Does NOT introduce nested vertical scrolling (only horizontal)
 */
export function Pre({ children, className, ...props }: PreProps) {
  const [copied, setCopied] = useState(false);

  // Try to find the nested <code> element inside <pre>.
  // react-markdown maps `code` to our Code component, so child.type is a function, not "code".
  const childElements = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<{ children?: React.ReactNode; className?: string }> =>
      React.isValidElement(child)
  );

  const codeElement =
    childElements.find((child) =>
      typeof child.props?.className === "string" &&
      child.props.className.includes("language-")
    ) ?? childElements[0];

  // Extract language from nested <code className="language-..."> if present
  const nestedCodeClassName =
    codeElement && React.isValidElement(codeElement)
      ? (codeElement.props as { className?: string }).className
      : undefined;



  const languageMatch = nestedCodeClassName?.match(/language-([A-Za-z0-9_-]+)/);
  const language = languageMatch ? languageMatch[1] : undefined;

  // console.log("languageMatch", languageMatch);

  // Extract text content from nested code's children (robust)
  const codeText = React.useMemo(() => {
    const raw = codeElement?.props?.children;

    // react-markdown passes code text as string or string[]
    if (typeof raw === "string") return raw;
    if (Array.isArray(raw)) return raw.join("");

    // Fallback: attempt to stringify anything else safely
    return raw != null ? String(raw) : "";
  }, [codeElement]);

  const handleCopy = async () => {
    try {
      // Trim just the outer newlines that react-markdown sometimes includes
      const text = codeText.replace(/^\n+/, "").replace(/\n+$/, "");
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = text;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }

      setCopied(true);
      window.setTimeout(() => setCopied(false), 5000);
    } catch {
      // Optional: you can replace with a toast if you have one
      setCopied(false);
    }
  };

  // TODO: dark bg hardcoded for now, need to align with prose styling.
  return (
    <div className="relative group rounded-lg bg-background border border-muted/20 text-muted-foreground">
      <CodeHeader language={language} copied={copied} onCopy={handleCopy} />

      {/* Horizontal-only scroll. Avoid height props to prevent nested vertical scroll traps. */}
      <ScrollArea className="w-full bg-transparent bg-background">
        <div className="min-w-max">
          <pre
            className={[
              className ?? "-translate-y-4",
            ].join(" ")}
            {...props}
          >
            {children}
          </pre>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

    </div>
  );
}
