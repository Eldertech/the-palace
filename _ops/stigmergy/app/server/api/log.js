// server/api/log.js — the LOG deck: git history + structured commit creation.
//   GET  /api/log          — the commit stream (classified + diffstat)
//   GET  /api/commit?sha=  — one commit's palace-aware diff
//   GET  /api/uncommitted  — the working-tree delta (the banner)
//   GET  /api/git-state    — worktree topology (branches, ahead/behind, dirty)
//   POST /api/commit/create — record a structured palace commit

import { jsonResponse, readBody } from '../http.js';
import { readLog, readCommit, readUncommitted, readGitState } from '../git.js';
import { commitSelected } from '../commit.js';

export async function logRoutes(ctx) {
  const { req, res, palaceRoot, urlPath, query, method } = ctx;

  // ?limit=N caps the stream; ?path=<rel> filters to one entry's history.
  if (urlPath === '/api/log' && method === 'GET') {
    try {
      const limit = query.get('limit') ?? '100';
      const pathspec = query.get('path');
      const result = await readLog(palaceRoot, { limit, pathspec });
      if (result.error) { jsonResponse(res, 400, { error: result.error }); return true; }
      jsonResponse(res, 200, { ...result, ts: new Date().toISOString() });
      return true;
    } catch (err) {
      jsonResponse(res, 500, { error: `git log failed: ${err.message}` });
      return true;
    }
  }

  if (urlPath === '/api/commit' && method === 'GET') {
    const sha = query.get('sha');
    if (!sha) { jsonResponse(res, 400, { error: 'missing ?sha' }); return true; }
    try {
      const commit = await readCommit(palaceRoot, sha);
      if (!commit) { jsonResponse(res, 404, { error: 'commit not found or invalid ref', sha }); return true; }
      jsonResponse(res, 200, commit);
      return true;
    } catch (err) {
      jsonResponse(res, 500, { error: `git show failed: ${err.message}` });
      return true;
    }
  }

  if (urlPath === '/api/uncommitted' && method === 'GET') {
    try {
      const delta = await readUncommitted(palaceRoot);
      jsonResponse(res, 200, { ...delta, ts: new Date().toISOString() });
      return true;
    } catch (err) {
      jsonResponse(res, 500, { error: `git status failed: ${err.message}` });
      return true;
    }
  }

  // The worktree topology -- read-only; never prunes or mutates a worktree.
  if (urlPath === '/api/git-state' && method === 'GET') {
    try {
      const state = await readGitState(palaceRoot);
      jsonResponse(res, 200, { ...state, ts: new Date().toISOString() });
      return true;
    } catch (err) {
      jsonResponse(res, 500, { error: `git worktree read failed: ${err.message}` });
      return true;
    }
  }

  // Body: { paths:[...], kind, summary, verify, scope?, body?, campaign?,
  // resolves? }. Stages ONLY the named paths (never -A), derives the Palace-*
  // trailers from their staged diff, and commits exactly those.
  if (urlPath === '/api/commit/create' && method === 'POST') {
    const bodyText = await readBody(req, res);
    if (bodyText === null) return true; // 413 already sent
    let payload;
    try { payload = JSON.parse(bodyText); } catch (e) {
      jsonResponse(res, 400, { error: `malformed JSON: ${e.message}` });
      return true;
    }
    const { paths, kind, scope, summary, body, verify, campaign, resolves } = payload || {};
    const result = await commitSelected(palaceRoot, {
      paths, kind, scope, summary, body, verify, campaign, resolves, author: 'loudon',
    });
    if (!result.ok) { jsonResponse(res, 400, result); return true; }
    jsonResponse(res, 200, { ...result, ts: new Date().toISOString() });
    return true;
  }

  return false;
}
