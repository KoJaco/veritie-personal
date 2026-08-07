# Branch 09 - Capture Profiles

Suggested branch: `feature/capture-profiles`

## Objective

Add capture profiles so different capture intents produce cleaner extraction and review experiences. General voice log remains the catch-all; braindump should be the first specialized profile.

## Depends On

- Branch 01 projection foundation.
- Branch 07 records/resources for braindump bulk-save target.

## In Scope

- `captures.profile` and `captures.profileContext`.
- Profile registry in app code.
- Pipeline config cache keyed by profile.
- Launcher UI for profile selection.
- Job metadata that passes profile/context to Veritie.
- Mapper behavior per profile.
- Braindump profile with capture-detail-first review and bulk save as record.

## Out of Scope

- All future profiles at once.
- In-app reclassification of Veritie output.
- Autonomous AI organization.
- External Veritie schema authoring beyond app contract docs.

## Implementation Checklist

### Schema and Types

- [ ] Add `captures.profile` with default `voice_log`.
- [ ] Add `captures.profileContext` JSON.
- [ ] Add app domain type for capture profiles.
- [ ] Add migration/backfill for existing captures.

### Profile Registry

- [ ] Define profile ids: `voice_log`, `braindump`, `journal`, `task_list`, `meeting`.
- [ ] Map profile id to UI label, Veritie schema/alias, extraction keys, and default review surface.
- [ ] Keep `CaptureType` as media format (`voice`, `pdf`, etc.).

### Pipeline Config

- [ ] Include profile in pipeline config cache key.
- [ ] Load config for active profile when launcher opens.
- [ ] Ensure fallback to `voice_log` config if specialized profile config is unavailable and product allows it.
- [ ] Add tests for profile-specific extraction keys.

### Launcher and Capture

- [ ] Add profile selection to `GlobalCaptureLauncher`.
- [ ] Pass profile/context through lease preparation and job metadata.
- [ ] Support contextual launch with `profileContext.listId` later for task lists.
- [ ] Persist profile/context when mapping Veritie job to capture bundle.

### Braindump

- [ ] Add braindump UI label and launcher entry.
- [ ] Suppress braindump fragments from default timeline unless explicitly promoted.
- [ ] Add capture detail primary action: save as record.
- [ ] Allow selective fragment promotion if the schema emits structured fragments.
- [ ] Add route tests for braindump capture detail behavior.

### Tests

- [ ] Profile registry tests.
- [ ] Pipeline config cache key tests.
- [ ] Metadata builder tests.
- [ ] Capture mapper persistence tests for profile/context.
- [ ] Launcher tests for profile selection.
- [ ] Braindump review surface tests.

## Acceptance Criteria

- Existing voice log behavior remains default and unchanged.
- New captures persist profile/context.
- Pipeline config is profile-aware.
- Braindump captures review on capture detail first and can save a record.
- Braindump does not flood the main timeline by default.

## Open Questions

- Should profile selection be shown immediately in the global launcher or hidden behind a mode menu?
- Should profile config failure block capture or fall back to voice log?
- Should journal and meeting profiles be separate branches after braindump?
- How much profile context should be user-visible on capture detail?

