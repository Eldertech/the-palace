// server/git-wrapper.js — the one promisified `git` runner shared by the
// read adapter (git.js) and the write adapter (commit.js).
//
// Spawns `git` with an argument array (never a shell string), so a path or ref
// can never be interpreted as a shell command. Resolves
// { stdout, stderr, failed }; rejects on non-zero exit unless { allowFail }.

import { execFile } from 'node:child_process';
import { resolve } from 'node:path';

// 64 MB — the full palace log fits easily.
export const MAX_BUFFER = 64 * 1024 * 1024;

export function execGit(palaceRoot, args, { allowFail = false } = {}) {
  return new Promise((resolvePromise, rejectPromise) => {
    execFile('git', args, {
      cwd: resolve(palaceRoot),
      maxBuffer: MAX_BUFFER,
      windowsHide: true,
    }, (err, stdout, stderr) => {
      if (err && !allowFail) {
        err.stderr = stderr;
        rejectPromise(err);
        return;
      }
      resolvePromise({ stdout: stdout ?? '', stderr: stderr ?? '', failed: !!err });
    });
  });
}
