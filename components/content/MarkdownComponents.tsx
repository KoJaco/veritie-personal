// Only 'Pre' is client, meaning only the subtree that hits the client Pre component will hydrate on the client. We want to preserve SSR for the MarkdownRenderer.

import { ExternalLink } from "lucide-react"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import {
  AnchorHTMLAttributes,
  BlockquoteHTMLAttributes,
  HTMLAttributes,
  TableHTMLAttributes,
  TdHTMLAttributes,
  ThHTMLAttributes,
} from "react"
import { Pre } from "./_client/Pre"
import { logger } from "@/lib/logging/server-logger"
import { cn } from "@/lib/utils"


/**
 * Allowed protocols for links
 * javascript: and data: are explicitly blocked for security
 */
const ALLOWED_LINK_PROTOCOLS = ["http:", "https:", "mailto:", "tel:"] as const

/**
 * Checks if a URL is safe (NOT javascript: or data:)
 * !TODO: Unit test this function with our link block.
 */
export function isSafeLink(href?: string): boolean {
  if (!href) return false

  //   normalize
  const hrefTrimmed = href.trim()
  const hrefLower = hrefTrimmed.toLowerCase()

  // Block javascript: and data: protocols
  if (hrefLower.startsWith("javascript:") || hrefLower.startsWith("data:")) return false

  //   Block protocol-relative URLs like //some-malicious-site.com
  if (hrefTrimmed.startsWith("//")) return false

  // Allow internal anchors
  if (hrefTrimmed.startsWith("#")) return true

  // Allow relative URLs like /some-page
  if (hrefTrimmed.startsWith("/")) return true

  // Allow specific protocols
  return (ALLOWED_LINK_PROTOCOLS.some(protocol => hrefLower.startsWith(protocol)))
}

// Type for code elements - extended to support className detection
interface CodeProps extends HTMLAttributes<HTMLElement> {
  className?: string
  children?: React.ReactNode
}



/**
 * Code component - detects inline vs fenced
 *
 * - Inline code: Simple styled span with background
 * - Fenced code: Minimal code element, wrapped by Pre component
 *
 */
export function Code({ children, className, ...props }: CodeProps) {
  // TODO: could be tightened to props.inline if typed accordingly? must check in react-markdown
  const isInline = !className

  // Inline code rendering
  if (isInline) {
    return (
      <code
        className="px-1.5 py-0.5 text-sm font-mono"
        {...props}
      >
        {children}
      </code>
    )
  }

  // Fenced code block - minimal element, wrapped by Pre
  return (
    <code className={cn("text-sm font-mono", className)} {...props}>
      {children}
    </code>
  )
}



// ============================================================================
// LINK COMPONENT (safe linking policy)
// ============================================================================

/**
 * SafeLink component - enforces security and UX policies
 *
 * Security policies:
 * - Blocks javascript: and data: protocols
 * - Only allows http:, https:, mailto:, tel:
 * - Forces target="_blank" and rel="noopener noreferrer" for external links
 *
 * UX policies:
 * - External links show icon indicator
 * - Internal links use Next.js Link for client-side navigation
 *   !TODO: Test this
*/
export function SafeLink({
  href,
  children,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (!href) {
    return <span {...props}>{children}</span>
  }
  const hrefTrimmed = href.trim()
  const hrefLower = hrefTrimmed.toLowerCase()

  const safeLinkProps = {
    title: props.title,
    "aria-label": props["aria-label"],
    "aria-labelledby": props["aria-labelledby"],
    "aria-describedby": props["aria-describedby"],
    "aria-details": props["aria-details"],
    "aria-hidden": props["aria-hidden"],
    "aria-disabled": props["aria-disabled"],
    "aria-expanded": props["aria-expanded"],
    "aria-pressed": props["aria-pressed"],
  }

  // Security check: Block unsafe protocols
  if (!isSafeLink(hrefTrimmed)) {
    logger.debug("MarkdownComponents.SafeLink: Blocked unsafe link", { href: href as string })
    return <span className="text-muted-foreground">{children}</span>
  }


  const isHttpExternal = hrefLower.startsWith("http:") || hrefLower.startsWith("https:");
  const isSpecialExternal = hrefLower.startsWith("mailto:") || hrefLower.startsWith("tel:");
  const isAnchor = hrefTrimmed.startsWith("#");
  const isInternalPath = hrefTrimmed.startsWith("/");

  if (isHttpExternal) {
    return (
      <a
        href={hrefTrimmed}
        target="_blank"
        rel="noopener noreferrer"
        className={cn("inline-flex items-center gap-1 hover:underline text-primary", props.className)}
        {...safeLinkProps}
      >
        {children}
        <ExternalLink className="h-3 w-3 flex-shrink-0" />
      </a>
    );
  }

  if (isSpecialExternal) {
    return (
      <a
        href={hrefTrimmed}
        className={cn("inline-flex items-center gap-1 hover:underline text-primary", props.className)}
        {...safeLinkProps}
      >
        {children}
      </a>
    );
  }

  // Internal (# anchors or / paths)
  if (isAnchor || isInternalPath) {
    return (
      <a
        href={hrefTrimmed}
        className={cn("hover:underline text-primary", props.className)}
        {...safeLinkProps}
      >
        {children}
      </a>
    );
  }

  // Shouldn't reach here due to isSafeLink, but safe fallback
  return <span className="text-muted-foreground">{children}</span>;
}

// ============================================================================
// BLOCKQUOTE COMPONENT
// ============================================================================

/**
 * Blockquote component - styled for platform callouts
 */
export function Blockquote({
  children,
  ...props
}: BlockquoteHTMLAttributes<HTMLQuoteElement>) {
  return (
    <blockquote
      className="border-l-4 border-primary pl-4 py-1 my-4 bg-muted/50"
      {...props}
    >
      {children}
    </blockquote>
  )
}

// ============================================================================
// TABLE COMPONENTS (layout-safe with ScrollArea)
// ============================================================================

/**
 * Table component - wrapped in ScrollArea for horizontal scrolling
 *
 * - Prevents layout blowout on mobile
 * - Touch-friendly scrolling with consistent scrollbar styling
 * - min-w-max ensures table doesn't collapse to container width
 * - Horizontal-only scrolling (vertical handled outside table)
 */
export function Table({
  children,
  ...props
}: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="my-4">
      <ScrollArea>
        <div className="min-w-max rounded-lg overflow-hidden border border-border/50">
          <table className="w-full border-collapse mt-0" {...props}>
            {children}
          </table>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

export function TableHead({
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead className="border-b" {...props}>
      {children}
    </thead>
  )
}

export function TableBody({
  children,
  ...props
}: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody {...props}>{children}</tbody>
}

export function TableRow({
  children,
  ...props
}: HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr className="border-b last:border-b-0" {...props}>
      {children}
    </tr>
  )
}

export function TableCell({
  children,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td className="px-4 py-2 text-left border-t border-border/50" {...props}>
      {children}
    </td>
  )
}

export function TableHeaderCell({
  children,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th className="px-4 py-2 text-left font-semibold border-b border-border/50" {...props}>
      {children}
    </th>
  )
}

// ============================================================================
// LIST COMPONENTS (spacing control)
// ============================================================================

export function UnorderedList({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLUListElement>) {
  return (
    <ul className={cn("list-disc list-outside my-4 space-y-1 pl-6", className)} {...props}>
      {children}
    </ul>
  )
}

export function OrderedList({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLOListElement>) {
  return (
    <ol className={cn("list-decimal list-outside my-4 space-y-1 pl-6", className)} {...props}>
      {children}
    </ol>
  )
}

export function ListItem({
  children,
  className,
  ...props
}: HTMLAttributes<HTMLLIElement>) {
  return <li className={cn(className)} {...props}>{children}</li>
}

// ============================================================================
// CHAT-SPECIFIC COMPONENTS (streaming-optimized)
// ============================================================================

/**
 * Chat-optimized code component (no copy button, no language label)
 * Optimized for real-time streaming responses
 */
export function ChatCode({ children, className, ...props }: CodeProps) {
  const isInline = !className

  if (isInline) {
    return (
      <code
        className="bg-background/75 text-muted-foreground px-1.5 py-0.5 rounded text-sm font-mono border border-border/50 prose-pre:m-0"
        {...props}
      >
        {children}
      </code>
    )
  }

  return <code className="text-sm font-mono" {...props}>{children}</code>
}

/**
 * Chat-optimized pre component (no copy button, no language label)
 * Just renders code block with ScrollArea, optimized for streaming
 *
 * - Horizontal-only scrolling (overflow-x-auto)
 * - min-w-max ensures code doesn't collapse to container width
 * - Vertical scrolling handled outside table (not nested)
 */
export function ChatPre({ children, ...props }: HTMLAttributes<HTMLPreElement>) {
  return (
    <div className="my-4">
      <ScrollArea>
        <div className="min-w-max">
          <pre
            className="rounded-md border border-muted/20 bg-muted p-4"
            {...props}
          >
            {children}
          </pre>
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}

// ============================================================================
// EXPORT: COMPONENTS MAPS FOR REACT-MARKDOWN
// ============================================================================

/**
 * Artifact components - Full-featured with copy buttons, language labels
 * Used for static, long-lived artifacts (policies, controls, assessments)
 *
 * Security:
 * - No raw HTML (react-markdown blocks by default)
 * - rehype-sanitize strips any HTML that slips through
 * - No dangerouslySetInnerHTML
 *
 * UX:
 * - Comfortable spacing via Tailwind prose
 * - Interactive copy buttons on code blocks
 * - Language labels on fenced code blocks
 */
export const ArtifactMarkdownComponents = {
  // Code (with copy button and language label)
  code: Code,
  pre: Pre, // !client component.

  // Links (safe protocols, forced external link behavior)
  a: SafeLink,

  // Blockquotes
  blockquote: Blockquote,

  // Tables (wrapped in ScrollArea for layout safety)
  table: Table,
  tbody: TableBody,
  thead: TableHead,
  th: TableHeaderCell,
  tr: TableRow,
  td: TableCell,

  // Lists (controlled spacing)
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
}

/**
 * Chat components - Streaming-optimized, no interactive elements
 * Used for real-time chat responses from assistant-ui
 *
 * Security:
 * - Same sanitization as artifact variant
 * - Same link policy as artifact variant
 *
 * UX:
 * - Reduced margins and spacing for chat context
 * - No copy buttons or language labels (reduces DOM complexity)
 * - Smaller prose scale if needed (can configure via className)
 * - Tighter line-height if needed (can configure via className)
 */
export const ChatMarkdownComponents = {
  // Code (no copy button, no language label)
  code: ChatCode,
  pre: ChatPre,

  // Links (same as artifact - security critical)
  a: SafeLink,

  // Blockquotes (same as artifact)
  blockquote: Blockquote,

  // Tables (same as artifact - layout safety)
  table: Table,
  tbody: TableBody,
  thead: TableHead,
  th: TableHeaderCell,
  tr: TableRow,
  td: TableCell,

  // Lists (same as artifact - spacing)
  ul: UnorderedList,
  ol: OrderedList,
  li: ListItem,
}
