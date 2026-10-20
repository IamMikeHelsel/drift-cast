export const REPOSITORY = 'IamMikeHelsel/drift-cast';
export const REPOSITORY_URL = `https://github.com/${REPOSITORY}`;
export const PAGE_SIZE = 100;
export const MAX_PAGES = 4;
export const STATUSES = Object.freeze({
  new: 'New', considering: 'Considering', planned: 'Planned',
  'in-progress': 'In progress', shipped: 'Shipped', 'not-planned': 'Not planned',
  closed: 'Closed', unassigned: 'Not categorized',
});

export function issueLink(number, suppliedURL) {
  if (!Number.isSafeInteger(number) || number < 1) return null;
  const expected = `${REPOSITORY_URL}/issues/${number}`;
  return suppliedURL === expected ? expected : null;
}

function labelNames(issue) {
  if (!Array.isArray(issue.labels)) return [];
  return issue.labels.map(label => typeof label === 'string' ? label : label?.name)
    .filter(label => typeof label === 'string');
}

export function classifyStatus(labels, state = 'open') {
  const statuses = [...new Set(labels.filter(label => label.startsWith('status:'))
    .map(label => label.slice(7)))];
  // Neither closure nor conflicting/missing labels implies a delivery promise.
  const status = statuses.length === 1 && Object.hasOwn(STATUSES, statuses[0])
    && !['unassigned', 'closed'].includes(statuses[0]) ? statuses[0] : 'unassigned';
  if (state === 'closed') return status === 'shipped' || status === 'not-planned' ? status : 'closed';
  return status === 'shipped' ? 'unassigned' : status;
}

export function normalizeIssue(issue) {
  if (!issue || typeof issue !== 'object' || 'pull_request' in issue) return null;
  const url = issueLink(issue.number, issue.html_url);
  const labels = labelNames(issue);
  if (!url || !labels.some(label => ['type:feature', 'type:bug'].includes(label)) || typeof issue.title !== 'string') return null;
  const votes = issue.reactions?.['+1'];
  const created = Date.parse(issue.created_at);
  return {
    number: issue.number, url, title: issue.title, status: classifyStatus(labels, issue.state),
    votes: Number.isSafeInteger(votes) && votes >= 0 ? votes : 0,
    created: Number.isFinite(created) ? created : 0,
    closed: issue.state === 'closed',
  };
}

export function selectIssues(issues, {search = '', status = 'all', sort = 'votes'} = {}) {
  const query = search.trim().toLocaleLowerCase();
  const selected = issues.filter(issue => (status === 'all' || issue.status === status)
    && (!query || `${issue.title} #${issue.number}`.toLocaleLowerCase().includes(query)));
  const order = Object.keys(STATUSES);
  return selected.sort((a, b) => {
    const primary = sort === 'newest' ? b.created - a.created
      : sort === 'status' ? order.indexOf(a.status) - order.indexOf(b.status)
      : b.votes - a.votes;
    return primary || b.created - a.created || b.number - a.number;
  });
}

export async function fetchIssues(fetcher = globalThis.fetch) {
  const records = new Map();
  let scanned = 0;
  let pages = 0;
  for (let page = 1; page <= MAX_PAGES; page += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetcher(`https://api.github.com/repos/${REPOSITORY}/issues?state=all&sort=created&direction=desc&per_page=${PAGE_SIZE}&page=${page}`, {
        headers: {Accept: 'application/vnd.github+json'}, credentials: 'omit',
        cache: 'no-store', signal: controller.signal,
      });
      if (!response.ok) throw new Error(response.status === 403 || response.status === 429 ? 'rate-limit' : 'unavailable');
      const data = await response.json();
      if (!Array.isArray(data) || data.length > PAGE_SIZE) throw new Error('unavailable');
      pages += 1;
      scanned += data.length;
      for (const raw of data) {
        const issue = normalizeIssue(raw);
        if (issue) records.set(issue.number, issue);
      }
      const link = response.headers?.get('link');
      // When pagination headers are unavailable, a full page is conservatively incomplete.
      const hasNext = link ? /rel="next"/.test(link) : data.length === PAGE_SIZE;
      if (!hasNext) return {issues: [...records.values()], scanned, pages, limited: false, error: null};
    } catch (error) {
      return {issues: [...records.values()], scanned, pages, limited: false,
        error: error.message === 'rate-limit' ? 'rate-limit' : 'unavailable'};
    } finally {
      clearTimeout(timer);
    }
  }
  return {issues: [...records.values()], scanned, pages, limited: true, error: null};
}

function element(document, tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function renderIssue(issue, document) {
  // All API content enters text nodes; no HTML or Markdown is interpreted.
  const card = element(document, 'article', 'issue-card');
  const main = element(document, 'div', 'issue-main');
  const status = element(document, 'span', 'status-badge', STATUSES[issue.status]);
  status.dataset.status = issue.status;
  const title = element(document, 'h3');
  const link = element(document, 'a', 'issue-title', issue.title);
  const url = issueLink(issue.number, issue.url);
  if (!url) throw new Error('Invalid issue link');
  link.href = url;
  title.append(link);
  const date = issue.created ? new Intl.DateTimeFormat('en', {month: 'short', day: 'numeric', year: 'numeric'}).format(issue.created) : 'Date unavailable';
  const meta = element(document, 'p', 'issue-meta', `#${issue.number} · ${date}${issue.closed ? ' · Closed on GitHub' : ''}`);
  main.append(status, title, meta);
  const vote = element(document, 'a', 'vote-link');
  vote.href = url;
  vote.setAttribute('aria-label', `${issue.votes} thumbs-up votes. Open request ${issue.number} to vote on GitHub; sign-in required.`);
  vote.append(element(document, 'span', 'vote-count', `👍 ${issue.votes}`), element(document, 'span', 'vote-caption', 'Vote on GitHub'));
  card.append(main, vote);
  return card;
}

export function mountBoard(document) {
  const list = document.getElementById('issue-list');
  const notice = document.getElementById('load-notice');
  const count = document.getElementById('result-count');
  const empty = document.getElementById('empty-state');
  const emptyTitle = document.getElementById('empty-title');
  const emptyCopy = document.getElementById('empty-copy');
  const search = document.getElementById('search');
  const status = document.getElementById('status');
  const sort = document.getElementById('sort');
  const refresh = document.getElementById('refresh');
  let result = {issues: [], error: null, limited: false};
  let loaded = false;
  function draw() {
    const selected = selectIssues(result.issues, {search: search.value, status: status.value, sort: sort.value});
    list.replaceChildren(...selected.map(issue => renderIssue(issue, document)));
    count.textContent = loaded ? `${selected.length} of ${result.issues.length} loaded requests` : '';
    empty.hidden = !loaded || selected.length > 0;
    if (result.error && result.issues.length === 0) {
      emptyTitle.textContent = 'Requests are temporarily unavailable';
      emptyCopy.textContent = 'Try Refresh, or use the GitHub link below to read and submit requests.';
    } else if (result.issues.length === 0 && !result.limited) {
      emptyTitle.textContent = 'No feature requests yet';
      emptyCopy.textContent = 'Share an idea on GitHub. Requests appear here once labelled type:feature.';
    } else {
      emptyTitle.textContent = 'No matching requests in this view';
      emptyCopy.textContent = 'Try another search or status. Older requests may be available on GitHub.';
    }
  }
  async function load() {
    refresh.disabled = true;
    list.setAttribute('aria-busy', 'true');
    notice.textContent = 'Loading public requests from GitHub…';
    try {
      result = await fetchIssues();
      loaded = true;
      notice.textContent = result.error
        ? `${result.error === 'rate-limit' ? 'GitHub’s public API limit was reached.' : 'GitHub couldn’t load all requests.'} ${result.issues.length ? 'Showing the requests loaded so far. ' : ''}Try Refresh later, or view all requests on GitHub below.`
        : result.limited ? `Showing requests found in the ${result.scanned} most recent public issues. Older requests and their votes may be missing; view all requests on GitHub below.`
        : 'Loaded from public GitHub issues. Vote counts update when you refresh.';
      draw();
    } finally {
      refresh.disabled = false;
      list.setAttribute('aria-busy', 'false');
    }
  }
  search.addEventListener('input', draw);
  status.addEventListener('change', draw);
  sort.addEventListener('change', draw);
  refresh.addEventListener('click', load);
  load();
}

if (typeof document !== 'undefined') mountBoard(document);
