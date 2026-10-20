# Maintainer guide

## Keep this repository standalone

This is drift's public home, `IamMikeHelsel/drift-cast` (renamed from `drift-feedback` on October 19, 2026; GitHub redirects the old links). It is linked from the App Store listing and drift.lab44.dev. The private application repository stays `IamMikeHelsel/drift`. Never give a public repository that name: agent worktrees push there and the app's owner-feedback links target it. Keep this history independent. Do not copy the private application repository, its `.git` directory, issues, internal backlog or private documents into it.

Review every file before pushing. In repository **Settings → Pages**, choose **Deploy from a branch**, branch **main**, folder **/ (root)**. GitHub Pages supplies its managed build/deployment. This project needs no custom Actions workflow, server, dependency installation, secret or token. Keep the canonical app at <https://drift.lab44.dev> and private-help routing at <https://drift.lab44.dev/privacy>.

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

## How the board works

- Static HTML, CSS and browser JavaScript, with native system fonts and no dependencies or analytics. The board itself sets no cookies and uses no browser storage; GitHub hosting and service policies apply separately.
- Reads only public issues from `IamMikeHelsel/drift-cast` using GitHub's unauthenticated REST API. No token is requested, stored or embedded.
- Shows issues carrying `type:feature` or `type:bug`, excludes pull requests, and offers title/number search, status filtering, and vote/newest/status sorting.
- Fetches at most four pages of 100 public issue records, newest-created first. Pull requests also consume records in this API response, even though the board excludes them. Search and vote sorting apply only to loaded requests. A visible notice explains truncation, partial results, API limits or failures and links to GitHub.
- Renders API text with DOM text nodes and validates every issue link against this exact repository and a positive numeric issue number. It does not interpret issue HTML or Markdown.
- Only a closed issue with the sole explicit `status:shipped` label is shown as **Shipped**. Closed issues without that status appear as **Closed** (or **Not planned** when explicitly labelled). Missing or conflicting statuses on open issues appear as **Not categorized**.

`index.html` provides the page, `styles.css` the responsive appearance, and `board.mjs` the public API reader and safe renderer. `tests/board.test.mjs` exercises classification, links, text rendering, filtering and request limits with synthetic fixtures that are never submitted to GitHub. `.nojekyll` selects plain static Pages delivery.

```sh
node --test tests/board.test.mjs
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000` to preview. The preview reads the live public issues.
