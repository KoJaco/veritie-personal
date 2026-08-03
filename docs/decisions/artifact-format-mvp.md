# Decision Note: Markdown-First Artifact Format for MVP

## Date

30-01-2026

## Summary

For the MVP, all platform artifacts (policies, check descriptions, assessments, etc.) will be stored and rendered as markdown. Structured JSON format as canonical is pending review, but rich text editor states are deferred to post-MVP if at all included.

## Decision

**Store and render artifacts as markdown-only for MVP.**

Specifically:
- All artifact content is stored as raw markdown strings
- No structured JSON (blocks, editor state) is persisted
- No inline comments or collaborative editing in MVP
- Version-based change management: each change creates a new immutable version
- No raw HTML in LLM output (markdown-only)

**Post-MVP considerations:**
- Evaluate converting markdown to blocks JSON for inline commenting support
- Consider rich text editor integration if phrase-level annotations are required
- Assess whether chat-to-artifact promotion needs identical rendering

## Rationale

**For MVP:**
- **Simplicity**: Markdown is the natural output format for LLMs and requires no transformation
- **Velocity**: No need to design and implement a blocks JSON schema or editor state format
- **Sufficiency**: Operational documents (policies, check descriptions, assessments) work well as markdown
- **Auditability**: Version-based immutable history is sufficient for review and traceability needs
- **Render consistency**: Single renderer (MarkdownRenderer) across all artifacts

**Deferred for post-MVP:**
- **Inline comments**: Requires block-level structure for anchoring
- **Collaborative editing**: Requires rich text editor state and real-time sync
- **Diffs/suggestions**: Requires structured format beyond plain text

### Artifact Types (MVP)

All rendered via MarkdownRenderer:
- Policies (Access Control Policy, Risk Management Policy, etc.)
- Check descriptions (logging, monitoring, technical specifications)
- Assessment outputs (risk areas, missing checks, readiness gaps)
- Action plans (remediation roadmaps, remediation steps)
- Attachment explanations (context, suitability assessment)
- Chat summaries (promoted to artifacts)

## Impact

**Routes/UI behavior:**
- ArtifactViewer uses MarkdownRenderer for all content
- No inline commenting UI in MVP
- Version selector shows history (no diff viewer)
- Simple "create new version" workflow

**Data model:**
```typescript
interface Artifact {
  id: string;
  title: string;
  content: string; // Markdown
  version: {
    versionNumber: number;
    authorId: string;
    timestamp: string;
    changeSummary?: string;
  };
}
```

**Backend LLM contract:**
- Output must be markdown-only
- No HTML tags or structured JSON
- Valid GFM (tables, lists, code blocks)

**DX:**
- Simple migration path if blocks JSON is needed post-MVP
- MarkdownRenderer components are reusable
- No complex editor state management

**Performance:**
- Lightweight storage (plain text)
- Simple version diff (text-based diffing tools)
- No editor state parsing/serialization overhead

## Follow-ups

- [ ] Evaluate inline commenting requirements during user testing
- [ ] Assess whether chat message promotion needs identical rendering to artifacts
- [ ] Review MarkdownRenderer usage in chat interface post-MVP
- [ ] Consider block JSON conversion strategy if inline comments are needed
- [ ] Evaluate rich text editor options (TipTap, Lexical) if post-MVP requires collaborative editing

## References

- Related clarifications: `docs/clarifications/30_01_2026.md` (Questions A.1, A.2, A.3, A.4, A.5)
- Related ADR: `docs/adr/0008-markdown-renderer-implementation.md`
- Related contract: `docs/contracts/markdown-renderer.md`
- Related feature: feat/artifact-viewer (TODO item #6)
