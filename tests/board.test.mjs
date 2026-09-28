import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {REPOSITORY, REPOSITORY_URL, MAX_PAGES, PAGE_SIZE, issueLink, classifyStatus, normalizeIssue, selectIssues, fetchIssues, renderIssue} from '../board.mjs';

const raw = (number = 1, extra = {}) => ({number, html_url: `${REPOSITORY_URL}/issues/${number}`,
  title: 'A synthetic test request', labels: [{name: 'type:feature'}, {name: 'status:new'}],
  created_at: '2026-01-01T00:00:00Z', state: 'open', reactions: {'+1': 2}, ...extra});
const response = (data, link = null) => ({ok: true, headers: {get: () => link}, json: async () => data});

test('shipped requires closure and one explicit shipped status; closure alone is not delivery', () => {
  assert.equal(normalizeIssue(raw(1, {state: 'closed', labels: ['type:feature']})).status, 'closed');
  assert.equal(normalizeIssue(raw(1, {state: 'closed', labels: ['type:feature', 'status:not-planned']})).status, 'not-planned');
  assert.equal(classifyStatus(['status:shipped']), 'unassigned');
  assert.equal(classifyStatus(['status:shipped'], 'closed'), 'shipped');
  assert.equal(classifyStatus(['status:shipped', 'status:planned']), 'unassigned');
  assert.equal(classifyStatus(['status:shipped', 'status:shipped'], 'closed'), 'shipped');
  assert.equal(classifyStatus(['status:shipped', 'status:planned'], 'closed'), 'closed');
  assert.equal(classifyStatus(['status:unknown']), 'unassigned');
});

test('only valid public feature issues enter the board', () => {
  for (const invalid of [null, raw(1, {pull_request: {}}), raw(1, {labels: []}), raw(1, {title: null}), raw(0), raw(1, {html_url: 'https://example.com'})]) {
    assert.equal(normalizeIssue(invalid), null);
  }
  assert.equal(normalizeIssue(raw(1, {reactions: {'+1': -4}, created_at: 'invalid'})).votes, 0);
  assert.equal(normalizeIssue(raw(1, {reactions: {'+1': '100'}})).votes, 0);
});

test('issue links allow only this exact repository and matching positive safe integer', () => {
  assert.equal(issueLink(12, `${REPOSITORY_URL}/issues/12`), `${REPOSITORY_URL}/issues/12`);
  for (const url of ['javascript:alert(1)', `https://github.com/Other/drift-feedback/issues/12`,
    `${REPOSITORY_URL}/issues/13`, `${REPOSITORY_URL}/issues/12?next=evil`, `${REPOSITORY_URL}/issues/12#evil`,
    `https://github.com.evil.example/${REPOSITORY}/issues/12`, `https://user@github.com/${REPOSITORY}/issues/12`,
    `${REPOSITORY_URL}/issues/012`, `${REPOSITORY_URL}/pull/12`]) assert.equal(issueLink(12, url), null);
  for (const number of [0, -1, '12', 1.5, Number.MAX_SAFE_INTEGER + 1]) assert.equal(issueLink(number, `${REPOSITORY_URL}/issues/${number}`), null);
});

class FakeElement {
  constructor(tag) { this.tagName = tag; this.children = []; this.dataset = {}; this.attributes = {}; }
  append(...nodes) { this.children.push(...nodes); }
  setAttribute(key, value) { this.attributes[key] = value; }
  set innerHTML(_) { throw new Error('Unsafe HTML sink'); }
}
const fakeDocument = {createElement: tag => new FakeElement(tag)};

test('untrusted API titles stay literal text and rendering rejects invalid hrefs', async () => {
  const title = '<img src=x onerror=alert(1)> & "text"';
  const issue = normalizeIssue(raw(1, {title}));
  const card = renderIssue(issue, fakeDocument);
  const headingLink = card.children[0].children[1].children[0];
  assert.equal(headingLink.textContent, title);
  assert.equal(headingLink.children.length, 0);
  assert.equal(headingLink.href, `${REPOSITORY_URL}/issues/1`);
  assert.throws(() => renderIssue({...issue, url: 'javascript:alert(1)'}, fakeDocument), /Invalid issue link/);
  const source = await readFile(new URL('../board.mjs', import.meta.url), 'utf8');
  assert.doesNotMatch(source, /innerHTML|outerHTML|insertAdjacentHTML|document\.write|eval\(/);
});

test('search, status and voting sort work without mutating the original data', () => {
  const data = [normalizeIssue(raw(1, {title: 'Search episodes', reactions: {'+1': 1}})),
    normalizeIssue(raw(2, {title: 'Queue ideas', reactions: {'+1': 10}, labels: ['type:feature', 'status:planned']}))];
  assert.deepEqual(selectIssues(data).map(i => i.number), [2, 1]);
  assert.deepEqual(selectIssues(data, {search: 'EPISODES'}).map(i => i.number), [1]);
  assert.deepEqual(selectIssues(data, {search: '#2', status: 'planned'}).map(i => i.number), [2]);
  assert.deepEqual(selectIssues(data, {search: 'episodes', status: 'shipped'}), []);
  assert.deepEqual(data.map(i => i.number), [1, 2]);
});

test('pagination is bounded; requests use only the public repo and omit credentials', async () => {
  const calls = [];
  const result = await fetchIssues(async (url, options) => {
    calls.push({url, options});
    return response(Array.from({length: PAGE_SIZE}, (_, i) => raw(calls.length * PAGE_SIZE + i)), '<untrusted-pagination-url>; rel="next"');
  });
  assert.equal(calls.length, MAX_PAGES);
  assert.equal(result.scanned, MAX_PAGES * PAGE_SIZE);
  assert.equal(result.limited, true);
  for (const [index, call] of calls.entries()) {
    assert.equal(call.url, `https://api.github.com/repos/${REPOSITORY}/issues?state=all&sort=created&direction=desc&per_page=100&page=${index + 1}`);
    assert.equal(call.options.credentials, 'omit');
    assert.deepEqual(Object.keys(call.options.headers), ['Accept']);
  }
});

test('a real empty response remains empty and stops fetching', async () => {
  let calls = 0;
  const result = await fetchIssues(async () => { calls += 1; return response([]); });
  assert.equal(calls, 1);
  assert.deepEqual(result, {issues: [], scanned: 0, pages: 1, limited: false, error: null});
});

test('partial/rate-limit failure retains successful pages and reports incomplete data', async () => {
  let calls = 0;
  const result = await fetchIssues(async () => ++calls === 1
    ? response([raw(1)], '<next>; rel="next"') : {ok: false, status: 403});
  assert.equal(result.error, 'rate-limit');
  assert.equal(result.issues.length, 1);
  assert.equal(result.pages, 1);
});

test('network/malformed failures never look like a successfully empty board', async () => {
  for (const fetcher of [async () => { throw new Error('offline'); }, async () => response({message: 'error'}),
    async () => response(Array.from({length: PAGE_SIZE + 1}, () => raw()))]) {
    const result = await fetchIssues(fetcher);
    assert.equal(result.error, 'unavailable');
    assert.equal(result.issues.length, 0);
  }
});

test('duplicates across pages are deduplicated and pull requests are excluded', async () => {
  let calls = 0;
  const result = await fetchIssues(async () => ++calls === 1
    ? response([raw(1)], '<next>; rel="next"') : response([raw(1), raw(2, {pull_request: {}})]));
  assert.equal(result.issues.length, 1);
  assert.equal(result.scanned, 3);
  assert.equal(result.limited, false);
});

test('unknown status labels cannot silently qualify delivery', () => {
  assert.equal(classifyStatus(['status:shipped', 'status:unknown'], 'closed'), 'closed');
  assert.equal(classifyStatus(['status:planned', 'status:unknown'], 'open'), 'unassigned');
  assert.equal(classifyStatus(['status:unknown'], 'open'), 'unassigned');
});
