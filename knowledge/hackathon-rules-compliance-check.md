# Hackathon Rules and Compliance Check

## Hackathon compliance and judging-readiness check

Checked October 18, 2026 (JST) against the [organizer's published rules](https://luma.com/OpenAIDevDay2026CommunityHackathonTokyo). This is an evidence check, not organizer approval. Apply it to the actual submitted deliverable; this repository remains a public coordination/development resource.

| Published requirement | Evidence and current assessment | Follow-up |
| --- | --- | --- |
| Deliverable must be publicly deployed on the web | **Unverified.** This repository documents localhost setup and a placeholder deployment URL. Issue #1 still lists public deployment as incomplete. Public source code alone does not establish deployed-deliverable compliance. | Record the actual submission URL and verify it is accessible to judges. |
| Development during the hackathon uses Codex CLI, Codex App, or ChatGPT Work; Claude Code, Cursor/Devin with OpenAI models, and third-party harnesses using OpenAI OAuth are prohibited | **Partially evidenced.** This work uses ChatGPT Work; the full team's workflow is not established by repository contents. | Confirm each member's development tools and record any organizer clarification. |
| Advance work is limited to a new prototype not previously published on SNS; polishing a prior hackathon submission is prohibited | **Unverified.** A prototype already exists. Repository contents do not establish its complete creation, publication, or prior-submission history. | Record what existed before the event, when it was shared, and whether any part was submitted elsewhere. If the boundary is unclear, ask the organizer. |
| Team has 2–4 people | **Documented fit.** README lists Taketo, Takao Ken, and akari (three people). | Confirm the registered team roster. |
| Advance research on DevDay announcements is permitted and encouraged | **No issue identified from reviewed documentation.** | Keep advance research distinct from advance implementation in the work record. |

### Judging readiness — separate from eligibility

The current page lists four criteria: appropriate use of DevDay 2026 features, usability, usefulness, and originality.

- [ ] **New features:** identify the feature used in the actual submission and demonstrate real operation. This repository includes a session launcher, but shared race state and hosted-agent end-to-end operation remain unverified; distinguish local deterministic simulation from live computer use.
- [ ] **Usability:** verify a judge can open the submission and understand or try the experience.
- [ ] **Usefulness:** explain who benefits from Playable Waiting and how the demo supports that claim.
- [ ] **Originality:** explain the contribution of visible agent progress and lightweight human participation.

### Submission details still to establish

- [ ] Record the submission channel, required fields, and exact deadline from organizer instructions. The page lists preliminary judging at 17:30 JST; do not assume that is an explicit submission deadline.
- [ ] Confirm whether a slide/video-only website qualifies if that is the chosen deliverable; the published deployment rule does not resolve this.
- [ ] Capture any additional instructions given in the on-site briefing.
- [ ] Recheck the organizer page before submission. It currently describes model-based preliminary evaluation, with the exact model tentative and the final-round decision method undecided.

**Overall:** Compliance is not yet established. The main evidence gaps are the actual deployed submission, all team members' development tools, and advance-work/publication/prior-submission history. These gaps are not findings of a rule violation.

## Evidence record

Maintain this file as the team's working reference. The organizer's page and explicit organizer clarifications are authoritative; repository assessments are provisional.

| Evidence to collect | Value | Verified by / time (JST) |
| --- | --- | --- |
| Actual submitted deliverable URL | Pending | Pending |
| Registered team roster | Pending confirmation | Pending |
| Development tools used by each member | Pending confirmation | Pending |
| Prototype work completed before event | Pending | Pending |
| Previous publication and hackathon submission history | Pending | Pending |
| Submission channel and deadline | Pending organizer instructions | Pending |
| On-site rule clarifications | Pending | Pending |

## How to repeat this check

1. Read the organizer's current rules and record the verification date.
2. Record additional organizer instructions with their date and source.
3. Evaluate the actual submission against each eligibility requirement using links or confirmed team statements.
4. Keep unknown items marked unverified. A missing record does not prove a violation.
5. Review the four judging criteria separately from eligibility.
6. Update this document and summarize remaining actions in [Issue #1](https://github.com/taketonomy/openai-devday-agent-circuit-20261018/issues/1).

## Reviewed repository evidence

- [Project README](../README.md): team and current setup.
- [Prototype README](../prototype/README.md): local simulation, computer-use boundary, and shared-state limitation.
- [Concept sheet](../concept-sheet.md): intended experience and pitch.
- [Issue #1](https://github.com/taketonomy/openai-devday-agent-circuit-20261018/issues/1): team coordination and deployment checklist.

The deployment and prototype findings above refer to this repository's supporting prototype. They do not establish the state of a separate submission maintained by another team member.
