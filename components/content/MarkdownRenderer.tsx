"use client"

import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeSanitize from "rehype-sanitize"
import { cn } from "@/lib/utils"
import {
  ArtifactMarkdownComponents,
  ChatMarkdownComponents,
} from "./MarkdownComponents"

export interface MarkdownRendererProps {
  content: string
  className?: string
  variant?: "artifact" | "chat"
}

/**
 * MarkdownRenderer - Main component with two variants
 *
 * @variant artifact - Full-featured renderer for app artifacts (policies, controls, assessments)
 * @variant chat - Streaming-optimized renderer for chat interface (assistant-ui override)
 *
 * Security guarantees:
 * - No raw HTML rendering (react-markdown blocks by default)
 * - rehype-sanitize strips any HTML that slips through
 * - Safe link policy (blocks javascript:, data:, forces external link attributes)
 * - No dangerouslySetInnerHTML used anywhere
 *
 * SSR safety:
 * - All components are client-side ("use client" directive)
 * - React-markdown is SSR-friendly
 * - Client-only copy button via useState
 */
export function MarkdownRenderer({
  content,
  className,
  variant = "artifact",
}: MarkdownRendererProps) {
  const components = variant === "chat" ? ChatMarkdownComponents : ArtifactMarkdownComponents

  return (
    <div
      className={cn(
        "prose dark:prose-invert max-w-none prose-sm prose-pre:bg-background/75 prose-pre:rounded-t-none prose-pre:text-muted-foreground",
        // Chat variant: reduced margins and tighter spacing
        variant === "chat" && "prose-sm",
        className
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={components}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

/**
 * ArtifactMarkdownRenderer - Alias for variant="artifact"
 * Full-featured renderer for app artifacts
 * - Comfortable spacing with Tailwind prose
 * - Copy buttons on code blocks
 * - Language labels on fenced code
 */
export function ArtifactMarkdownRenderer(props: MarkdownRendererProps) {
  return <MarkdownRenderer {...props} variant="artifact" />
}

/**
 * ChatMarkdownRenderer - Alias for variant="chat"
 * Streaming-optimized renderer for chat interface
 * - Reduced margins (prose-sm)
 * - Tighter line-height if needed (can extend via className)
 * - No copy buttons or language labels (streaming-optimized)
 * - Used to override assistant-ui's built-in markdown renderer
 *
 * Integration with assistant-ui:
 * - assistant-ui uses react-markdown under the hood
 * - Pass ChatMarkdownComponents via components prop to override
 * - Same sanitization and security as artifact variant
 */
export function ChatMarkdownRenderer(props: MarkdownRendererProps) {
  return <MarkdownRenderer {...props} variant="chat" />
}
