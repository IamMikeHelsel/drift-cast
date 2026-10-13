# Maintainer guide

## Publish only this standalone repository

The intended public repository is `IamMikeHelsel/drift-feedback`. Create its history from this directory alone. Do not copy the private application repository, its `.git` directory, issues, internal backlog or private documents into it.

Review every file, then publish this small standalone project. In repository **Settings → Pages**, choose **Deploy from a branch**, branch **main**, folder **/ (root)**. GitHub Pages supplies its managed build/deployment. This project needs no custom Actions workflow, server, dependency installation, secret or token. Keep the canonical app at <https://drift.lab44.dev> and private-help routing at <https://drift.lab44.dev/privacy>.

Create these issue labels before accepting submissions:

| Label | Meaning | Suggested color |
| --- | --- | --- |
| `type:feature` | A feature request shown on the board | `6B7280` |
| `type:bug` | A public bug report shown on the board | `B91C1C` |
| `status:new` | Awaiting consideration | `6B7280` |
| `status:considering` | Being evaluated | `6B7280` |
| `status:planned` | Current intent; no promised date | `4B5563` |
| `status:in-progress` | Work has started | `374151` |
| `status:shipped` | Verified availability to the relevant users | `1F2937` |
| `status:not-planned` | No current plan to implement | `6B7280` |

The issue form requests `type:feature` and `status:new` automatically; the labels must exist. Blank issues are disabled by the template configuration. GitHub account sign-in is required for submissions and voting. Do not promise anonymous submissions or private GitHub issues in this public repository.

## Curate requests

Use exactly one status label per request. Explain decisions and keep the request’s status current. Close the issue and set `status:shipped` only when the stated feature is actually available; both are required to show **Shipped**. Closure alone can mean duplicate, declined or another outcome and displays **Closed**, unless explicitly labelled **Not planned**. Missing or conflicting labels on open issues appear as **Not categorized**; an open issue labelled shipped also requires correction. “Planned” may change and is not a commitment.

For duplicates, link to the canonical public request and ask voters to react there; do not add the counts together or imply votes were transferred. Close the duplicate with an explanatory comment, retaining an honest status. Votes are 👍 reactions on the issue’s first post, not on comments.

Keep private account discussions and sensitive details off this board. If someone posts private information, remove it using GitHub’s moderation facilities and direct them to the support contact on the privacy page. Do not repeat the sensitive text in comments or another issue. Public content may already have been seen or copied.

There is no automatic import from the private product backlog. Any maintainer-posted request must be independently written for public discussion and reviewed for disclosure. Avoid fake seed requests, invented vote counts or implied release commitments.

## Verify after publication

Check desktop and narrow mobile layouts, keyboard navigation, light/dark appearance, loading and true empty states. Submit a real request only when there is a real idea; do not manufacture public activity for a test. Confirm labels, safe issue links, status filtering, search and 👍 counts against GitHub.

The browser fetches at most 400 recent public issue records and has a 12-second timeout per page. A request failure keeps already loaded results and explains the limitation. GitHub’s unauthenticated API has rate limits. If the board cannot load, its GitHub link remains the fallback; never add a personal token to client-side JavaScript. The site has no automatic refresh loop or analytics.

Run `node --test tests/board.test.mjs` after changing API or rendering behavior. These synthetic tests do not prove Pages publication or real GitHub account submission/voting.

## Roadmap upkeep

Update [ROADMAP.md](ROADMAP.md) when a public decision changes. Link relevant public requests as they arrive. Write public summaries deliberately; never mirror private issues or in-app reports. Use App Store availability for Shipped, and label private or TestFlight work separately. The bug and feature forms both apply `status:new`; triage them manually.
