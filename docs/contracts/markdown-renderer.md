# Contract: Markdown Renderer

## Purpose

Define the contract between markdown content producers and the shared
`MarkdownRenderer` component.

The renderer is domain-agnostic. It is used for authored documents, assistant
responses, generated artifacts, and any other markdown content that must be
rendered safely in the platform shell.

## Scope

Included:

- GitHub Flavored Markdown rendering
- safe rendering of untrusted model or user content
- artifact and chat presentation variants
- responsive tables and code blocks
- copy affordances for artifact code blocks

Out of scope:

- raw HTML rendering
- custom markdown extensions beyond GFM
- Mermaid or diagram rendering
- math rendering
- interactive markdown widgets

## Versioning

- **Current version:** v1
- **Compatibility:** Backward compatible
- **Change policy:** Change the version when supported syntax, sanitization
  policy, or public props change.

## Contract Shape

The implementation lives at:

- `components/content/MarkdownRenderer.tsx`
- `components/content/MarkdownComponents.tsx`

Required props:

- `content: string`

Optional props:

- `variant?: "artifact" | "chat"`
- `className?: string`

## Invariants

- Markdown content is treated as untrusted.
- Raw HTML is not part of the public contract.
- `javascript:` and `data:` links are blocked by the shared link component.
- External links use safe new-tab attributes.
- The renderer does not use `dangerouslySetInnerHTML`.
- Tables and code blocks must not break page width on small viewports.
- Chat rendering stays compact and avoids artifact-only controls.

## Example

```tsx
<MarkdownRenderer
  variant="artifact"
  content={`# Runbook

| Step | Owner |
| --- | --- |
| Review change | Engineering |

\`\`\`ts
export const status = "ready";
\`\`\`
`}
/>
```

## References

- ADR: `docs/adr/0008-markdown-renderer-implementation.md`
- Page model payload rule: `docs/contracts/page-model-contract.md`
