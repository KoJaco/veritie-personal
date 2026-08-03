# ADR-0008: Markdown Renderer Implementation

> **Historical note:** Written during previous product framing. The renderer serves operational documents and AI-generated content using domain-agnostic vocabulary.

## Status

Proposed

## Date

30-01-2026

## Context

The platform needs a safe, robust markdown renderer for displaying AI-generated content and long-lived operational artifacts. Key requirements:

1. **LLM Output Safety**: Must safely render untrusted markdown from LLMs (OpenAI, etc.) without XSS or injection risks
2. **Artifact Rendering**: Policies, check descriptions, risk assessments, remediation roadmaps, and attachment explanations
3. **Operational Document Features**: Tables for structured summaries, code blocks for technical specifications, lists for requirements
4. **Cross-Platform Consistency**: Same renderer used throughout the app for consistent artifact presentation
5. **SSR Compatibility**: Must work with Next.js server-side rendering without hydration issues

The platform uses Tailwind CSS for styling, and artifacts are expected to be long-lived, auditable documents requiring version tracking.

## Decision

Implement a `MarkdownRenderer` component using the following library stack:

### Core Libraries

1. **`react-markdown`** — Primary markdown rendering engine
   - Actively maintained and widely used in production
   - Does not allow raw HTML by default (critical for LLM safety)
   - Highly composable via `components` prop for custom element rendering
   - SSR-safe in Next.js (no hydration issues)

2. **`remark-gfm`** — GitHub Flavored Markdown support (mandatory)
   - LLMs constantly emit GFM-style markdown:
     - Tables (critical for structured operational summaries)
     - Task lists (`- [x]`)
     - Strikethrough (`~~text~~`)
     - Auto-linked URLs
   - Without this: tables break, layout degrades, fighting LLM output forever
   - **Verdict: mandatory**

3. **`rehype-sanitize`** — HTML sanitization layer
   - Second layer of defense if HTML slips through
   - **Important nuance**: Do not enable `rehype-raw` (do not parse raw HTML)
   - Even with react-markdown's HTML blocking, LLMs and upstream libraries can emit edge cases
   - Configuration: Use default schema (allow nothing or very small allowlist)
   - **Verdict: strongly recommended for AI apps**

### Additional Dependencies

4. **`@tailwindcss/typography`** — Tailwind plugin for markdown styling
   - Provides consistent, beautiful markdown typography
   - Includes `prose-invert` variant for dark mode

5. **Syntax Highlighting** (Post-MVP enhancement, pending review)
   - For code blocks with language-specific highlighting (using `shiki` or `react-syntax-highlighter`)
   - Async worker to avoid blocking main thread
   - **Decision**: Deferred to post-MVP pending review of requirements

### Implementation Pattern

```typescript
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeSanitize from 'rehype-sanitize'
import { CodeBlock } from './components/CodeBlock'
import { SafeLink } from './components/SafeLink'
import { MarkdownTable } from './components/MarkdownTable'
import { MarkdownBlockquote } from './components/MarkdownBlockquote'

export function MarkdownRenderer({ content, className }: MarkdownRendererProps) {
  return (
    <div className={cn('prose dark:prose-invert max-w-none', className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeSanitize]}
        components={{
          code: CodeBlock,
          a: SafeLink,
          table: MarkdownTable,
          blockquote: MarkdownBlockquote,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}
```

### Custom Components

#### 1. CodeBlock (`code` element)
- **Purpose**: Render code blocks with copy-to-clipboard functionality
- **Features**:
  - Copy-to-clipboard button
  - Dark mode support
  - Distinguishes between inline code (`<code>`) and code blocks (`<pre><code>`)
  - **Note**: Syntax highlighting deferred to post-MVP pending review

```typescript
export function CodeBlock({ children, className, ...props }: CodeProps) {
  const isInline = !className
  if (isInline) {
    return <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">{children}</code>
  }
  // Code block implementation with copy button (syntax highlighting deferred)
}
```

#### 2. SafeLink (`a` element)
- **Purpose**: Render links with security and UX best practices
- **Features**:
  - External links open in new tab (`target="_blank"`)
  - Security attributes (`rel="noopener noreferrer"`)
  - Visual indicator for external links (icon or color)
  - Internal links use Next.js `<Link>` for client-side navigation
  - Safe URL validation

```typescript
export function SafeLink({ href, children, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>) {
  const isExternal = href?.startsWith('http')
  if (isExternal) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex items-center gap-1 hover:underline"
        {...props}
      >
        {children}
        <ExternalLink className="h-3 w-3" />
      </a>
    )
  }
  // Internal link using Next.js Link
}
```

#### 3. MarkdownTable (`table` element)
- **Purpose**: Render tables with responsive overflow handling
- **Features**:
  - Horizontal scroll wrapper for mobile compatibility
  - Prose styling via Tailwind Typography
  - Dark mode support
  - Sticky header for long tables (optional enhancement)

```typescript
export function MarkdownTable({ children, ...props }: TableHTMLAttributes<HTMLTableElement>) {
  return (
    <div className="overflow-x-auto my-4">
      <table className="min-w-full" {...props}>
        {children}
      </table>
    </div>
  )
}
```

#### 4. MarkdownBlockquote (`blockquote` element)
- **Purpose**: Render blockquotes with document-appropriate styling
- **Features**:
  - Left border for visual emphasis
  - Subtle background for callouts
  - Dark mode support
  - Support for nested blockquotes

```typescript
export function MarkdownBlockquote({ children, ...props }: BlockquoteHTMLAttributes<HTMLQuoteElement>) {
  return (
    <blockquote
      className="border-l-4 border-primary pl-4 py-1 my-4 bg-muted/50"
      {...props}
    >
      {children}
    </blockquote>
  )
}
```

### Tailwind Typography Integration

- **Base classes**: `prose dark:prose-invert` for automatic markdown styling
- **Customization**: Override prose styles as needed in tailwind.config
- **Headings**: Consistent spacing and font weights
- **Lists**: Proper nesting and indentation
- **Images**: Responsive and contained

### In-Scope Features (MVP)
- Headings (h1-h6)
- Paragraphs and text formatting (bold, italic, strikethrough)
- Lists (ordered, unordered, nested)
- Code blocks with copy button (syntax highlighting deferred)
- Inline code
- Tables (GFM)
- Blockquotes
- Links (with safe external link behavior)
- Horizontal rules

### Out-of-Scope for MVP
- Raw HTML support (explicitly blocked)
- Custom markdown extensions beyond GFM
- Custom component rendering (e.g., `<Alert>`, `<Tabs>`)
- Math rendering (LaTeX)
- Mermaid/diagram rendering
- Interactive elements (collapsible sections, tabs)
- **Syntax highlighting** — deferred to post-MVP pending review

### Chat Interface Decision
The `MarkdownRenderer` will NOT be used as the chat interface renderer in the MVP. Chat messages will use the chat UI's built-in markdown support. This decision is pending review based on:
- Whether chat content needs the same strict sanitization as artifacts
- Whether chat messages should be promotable to artifacts with identical rendering
- Performance considerations for real-time streaming responses

This separation allows the renderer to be optimized for static, long-lived artifacts while the chat can use a more lightweight approach optimized for streaming.

## Alternatives Considered

- **Raw HTML rendering** — rejected due to XSS vulnerabilities and LLM output safety concerns
- **Rich text editor state (Lexical/ProseMirror)** — rejected for MVP; adds complexity and assumes a specific editor backend format that isn't yet decided (see clarification A.1)
- **Server-side rendering to HTML** — rejected because it limits client-side interaction (code copy, etc.) and adds server complexity
- **Custom markdown parser** — rejected in favor of battle-tested `react-markdown` ecosystem
- **Markdown-only with no syntax highlighting** — rejected because operational artifacts often include code (configuration snippets, technical specs)
- **Using `rehype-raw` with sanitization** — rejected because it explicitly allows HTML parsing, increasing attack surface; `react-markdown`'s default HTML blocking + `rehype-sanitize` is safer
- **Without `remark-gfm`** — rejected because LLMs natively emit GFM (tables, task lists, etc.); fighting this would cause constant rendering issues
- **DOMPurify instead of `rehype-sanitize`** — considered but `rehype-sanitize` integrates better with the remark/rehype pipeline and provides AST-level sanitization rather than post-processing HTML

## Consequences

### Pros
- Safe rendering of untrusted LLM output prevents XSS and injection attacks (react-markdown blocks HTML by default, rehype-sanitize provides second layer)
- Consistent artifact presentation across the entire platform
- Tailwind typography provides beautiful, readable defaults out-of-the-box
- Dark mode support matches platform-wide theme switching (`prose-invert`)
- Table overflow handling prevents layout breakage
- Code block copying improves developer/operator UX for technical reference material
- SSR-safe implementation works seamlessly with Next.js
- GFM support covers all markdown features needed for operational documents (tables, task lists, etc.)
- **`react-markdown`**: Production-ready, actively maintained, highly composable
- **`remark-gfm`**: Eliminates fighting LLM output for tables and task lists
- **`rehype-sanitize`**: Defense-in-depth against HTML edge cases from upstream sources

### Cons
- Additional bundle size from `react-markdown`, `remark-gfm`, and `rehype-sanitize`
- Code block syntax highlighting (when added post-MVP) will add complexity and require language detection
- Not using the renderer for chat means potential rendering inconsistency between chat and promoted artifacts
- Custom code block renderer requires careful styling to match Tailwind typography

### Tradeoffs
- Security over performance: DOMPurify adds overhead but is required for LLM output safety
- Consistency over flexibility: Enforcing Tailwind typography means custom styling requires CSS overrides
- MVP scope over completeness: No diagrams, math, or custom elements until explicitly needed

### Follow-ups / TODOs
- [ ] Audit LLM output for any unexpected markdown patterns that might break rendering
- [ ] Evaluate whether chat messages should use this renderer post-MVP (clarification needed)
- [ ] Consider adding custom markdown extensions if domain-specific patterns emerge (e.g., structured checklists)
- [ ] Review syntax highlighting requirements for post-MVP implementation (performance, library choice: `shiki` vs `react-syntax-highlighter`)
- [ ] Document Tailwind typography customization guidelines for team members

## References

- Issue: feat/markdown-renderer (TODO item #1)
- Related clarifications: `docs/clarifications/30_01_2026.md` (Questions A.1-A.5)
- Related contract: `docs/contracts/markdown-renderer.md`
- Related components: `components/markdown/MarkdownRenderer.tsx`
