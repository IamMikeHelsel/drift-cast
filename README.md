# Ideas for drift

A small public feature-request board for [drift](https://drift.lab44.dev).

Intended board address: <https://iammikehelsel.github.io/drift-feedback/>. The board is published only after its maintainer enables GitHub Pages. This directory alone does not establish a live site. GitHub Pages uses GitHub-managed deployment; this project provides no custom Actions workflow.

## Public-data boundary

This is a standalone public project. The drift application source remains private. This repository contains no app source, private history, internal backlog, credentials, analytics, or automatic synchronization with another repository.

Everything posted to this repository—including issue text, comments, names and reactions—is public on GitHub. Do not post personal information, account details, private feed addresses, recordings or credentials. For private or account-specific help, use the support contact on [drift’s privacy/support page](https://drift.lab44.dev/privacy).

Anyone can read and search the board without signing in. Submitting a request, commenting, or adding a 👍 reaction requires a GitHub account. To vote, open a request and add 👍 to its first post; the board displays that reaction count. It does not count comment reactions as votes.

## How it works

- Static HTML, CSS and browser JavaScript, with native system fonts and no dependencies or analytics. The board itself sets no cookies and uses no browser storage; GitHub hosting and service policies apply separately.
- Reads only public issues from `IamMikeHelsel/drift-feedback` using GitHub’s unauthenticated REST API. No token is requested, stored or embedded.
- Shows issues carrying `type:feature`, excludes pull requests, and offers title/number search, status filtering, and vote/newest/status sorting.
- Fetches at most four pages of 100 public issue records, newest-created first. Pull requests also consume records in this API response, even though the board excludes them. Search and vote sorting apply only to loaded requests. A visible notice explains truncation, partial results, API limits or failures and links to GitHub.
- Renders API text with DOM text nodes and validates every issue link against this exact repository and a positive numeric issue number. It does not interpret issue HTML or Markdown.
- Uses explicit status labels. Only a closed issue with the sole explicit `status:shipped` label is shown as **Shipped**. Closed issues without that status appear as **Closed** (or **Not planned** when explicitly labelled). Missing or conflicting statuses on open issues appear as **Not categorized**. An open issue labelled shipped is also not categorized until corrected.

Statuses are manually curated by the maintainer. “Planned” expresses current intent, not a delivery promise. Votes inform decisions and do not guarantee a feature or schedule. No private backlog is copied or synchronized here.

## Files and local checks

`index.html` provides the page, `styles.css` the responsive appearance, and `board.mjs` the public API reader and safe renderer. `tests/board.test.mjs` exercises classification, links, text rendering, filtering and request limits. `.github/ISSUE_TEMPLATE/` holds the feature form and support routing. `.nojekyll` selects plain static Pages delivery. All test fixtures are synthetic and never submitted to GitHub. [ADMIN.md](ADMIN.md) describes setup and manual curation.

```sh
node --test tests/board.test.mjs
python3 -m http.server 8000 --bind 127.0.0.1
```

Open `http://127.0.0.1:8000` to preview. The board queries its intended public GitHub repository; before publication it will correctly show an unavailable state. No example requests are inserted into the board or repository.
