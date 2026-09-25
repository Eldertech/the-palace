// The Sentry's rules — what it looks for, in one place.
//
// Four families, matching the four things the Sentry watches ([[Sentry]] § What it watches):
//   SECRET   credentials by their published formats, plus generic "name = value" assignments
//   PII      personal data: emails, phones, ID and card numbers, street addresses
//   INJECT   text aimed at agents: instruction-override phrases, invisible Unicode
//   PATH     files that should never be tracked (.env, keys, exports), by name
// Plus INVENTORY rules (scripts that delete or reach the network) — counted, not flagged.
//
// Severity is the gate's only input: `high` blocks a push, everything else is raised.
// A value is never stored or printed whole — `mask()` is the only way a value leaves here.

import { createHash } from 'node:crypto';

// ── SECRET ────────────────────────────────────────────────────────────────────
export const SECRET_RULES = [
  { id: 'anthropic-key',    sev: 'high', re: /sk-ant-(?:api|admin)\d{2}-[A-Za-z0-9_\-]{20,}/g },
  { id: 'anthropic-loose',  sev: 'high', re: /sk-ant-[A-Za-z0-9_\-]{20,}/g },
  { id: 'openai-key',       sev: 'high', re: /sk-(?:proj-|svcacct-|admin-)?[A-Za-z0-9_\-]{20,}T3BlbkFJ[A-Za-z0-9_\-]{20,}/g },
  { id: 'openai-project',   sev: 'high', re: /\bsk-(?:proj|svcacct)-[A-Za-z0-9_\-]{30,}/g },
  { id: 'github-token',     sev: 'high', re: /\bgh[pousr]_[A-Za-z0-9]{36,}/g },
  { id: 'github-fine-pat',  sev: 'high', re: /\bgithub_pat_[A-Za-z0-9_]{50,}/g },
  { id: 'huggingface',      sev: 'high', re: /\bhf_[A-Za-z0-9]{30,}/g },
  { id: 'aws-access-key',   sev: 'high', re: /\b(?:AKIA|ASIA|AGPA|AIDA|AROA)[0-9A-Z]{16}\b/g },
  { id: 'runpod',           sev: 'high', re: /\brpa_[A-Za-z0-9]{30,}/g },
  { id: 'google-api',       sev: 'high', re: /\bAIza[0-9A-Za-z_\-]{35}/g },
  { id: 'google-oauth',     sev: 'high', re: /\bGOCSPX-[A-Za-z0-9_\-]{20,}/g },
  { id: 'slack-token',      sev: 'high', re: /\bxox[abposr]-[A-Za-z0-9\-]{10,}/g },
  { id: 'slack-webhook',    sev: 'high', re: /hooks\.slack\.com\/services\/T[A-Za-z0-9]+\/B[A-Za-z0-9]+\/[A-Za-z0-9]+/g },
  { id: 'discord-webhook',  sev: 'high', re: /discord(?:app)?\.com\/api\/webhooks\/\d+\/[A-Za-z0-9_\-]{20,}/g },
  { id: 'stripe',           sev: 'high', re: /\b[sr]k_live_[A-Za-z0-9]{20,}/g },
  { id: 'replicate',        sev: 'high', re: /\br8_[A-Za-z0-9]{30,}/g },
  { id: 'groq',             sev: 'high', re: /\bgsk_[A-Za-z0-9]{40,}/g },
  { id: 'sendgrid',         sev: 'high', re: /\bSG\.[A-Za-z0-9_\-]{20,}\.[A-Za-z0-9_\-]{20,}/g },
  { id: 'notion',           sev: 'high', re: /\b(?:secret_[A-Za-z0-9]{43}|ntn_[A-Za-z0-9]{40,})/g },
  { id: 'elevenlabs',       sev: 'high', re: /\bsk_[a-f0-9]{48}\b/g },
  { id: 'npm-token',        sev: 'high', re: /\bnpm_[A-Za-z0-9]{36}\b/g },
  { id: 'gitlab-token',     sev: 'high', re: /\bglpat-[A-Za-z0-9_\-]{20}/g },
  { id: 'private-key',      sev: 'high', re: /-----BEGIN (?:RSA |EC |DSA |OPENSSH |PGP |ENCRYPTED )?PRIVATE KEY(?: BLOCK)?-----/g },
  { id: 'jwt',              sev: 'medium', re: /\beyJ[A-Za-z0-9_\-]{10,}\.eyJ[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}/g },
  { id: 'url-credentials',  sev: 'medium', re: /\b[a-z][a-z0-9+.\-]*:\/\/[^\s\/:@'"<>]{2,}:[^\s\/@'"<>]{4,}@[A-Za-z0-9.\-]+/g },
  { id: 'bearer-token',     sev: 'medium', re: /\b[Bb]earer\s+[A-Za-z0-9_\-.=]{24,}/g },
  // name-shaped assignments; the value is capture group 1
  { id: 'generic-assign',   sev: 'medium', group: 1,
    re: /\b[A-Za-z0-9_]*(?:api[_\-]?key|apikey|secret|token|passw(?:or)?d|passwd|auth[_\-]?key|access[_\-]?key|client[_\-]?secret)[A-Za-z0-9_]*\b\s*["']?\s*[:=]\s*["']([^"'\s]{12,})["']/gi },
  { id: 'generic-env',      sev: 'medium', group: 1,
    re: /^\s*(?:export\s+)?[A-Z0-9_]*(?:API_KEY|SECRET|TOKEN|PASSWORD|PASSWD|ACCESS_KEY)[A-Z0-9_]*\s*=\s*([^\s#'"]{12,}|"[^"]{12,}"|'[^']{12,}')/gm },
];

// A line that looks like documentation of a key rather than a key.
export const PLACEHOLDER = /(x{6,}|\*{4,}|your[_\-]?|<[^>]+>|\$\{|\$[A-Z_]+|process\.env|os\.environ|getenv|example|placeholder|dummy|redacted|changeme|\.\.\.|…|REPLACE|INSERT|TODO|fake|sample|test[_\-]?key)/i;

// Binaries get only the formats that are unmistakable on their own.
export const BINARY_SAFE = new Set(['anthropic-key', 'anthropic-loose', 'github-token', 'github-fine-pat',
  'huggingface', 'aws-access-key', 'runpod', 'openai-key', 'private-key']);

// ── PII ───────────────────────────────────────────────────────────────────────
const FILE_TLDS = 'png|jpe?g|gif|svg|webp|js|mjs|cjs|jsx|ts|tsx|json|md|css|py|html?|wav|mp3|mp4|txt|pdf|zip|lock';
export const PII_RULES = [
  { id: 'email',   sev: 'low',
    re: new RegExp(String.raw`\b[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.(?!(?:${FILE_TLDS})\b)[A-Za-z]{2,24}\b`, 'g') },
  { id: 'phone',   sev: 'medium',
    re: /(?<![\d.\-])(?:\+?1[\s.\-])?\(?[2-9]\d{2}\)?[\s.\-][2-9]\d{2}[\s.\-]\d{4}(?![\d.\-])/g },
  { id: 'phone-intl', sev: 'medium', re: /(?<![\d])\+(?:[2-9]\d{0,2})[\s.\-]\d{2,4}[\s.\-]\d{3,4}[\s.\-]\d{3,4}(?![\d])/g },
  // ID and card numbers are read only in prose-like files: numeric data (HTML/JSON float arrays) passes Luhn by chance.
  { id: 'us-ssn',  sev: 'high', ext: /\.(md|txt|csv|tsv|eml|mbox|vcf)$/i, re: /(?<![\w.\-])\d{3}-\d{2}-\d{4}(?![\w.\-])/g },
  { id: 'card-number', sev: 'high', luhn: true, ext: /\.(md|txt|csv|tsv|eml|mbox|vcf)$/i,
    re: /(?<![\w.,\-])[3-6]\d{3}(?:[ \-]?\d{4}){2}[ \-]?\d{1,7}(?![\w.,\-])/g },
  { id: 'street-address', sev: 'low',
    re: /\b\d{1,5} (?:[A-Z][a-z]+ ){1,3}(?:Street|St\.|Avenue|Ave\.?|Road|Rd\.|Lane|Ln\.|Drive|Dr\.|Boulevard|Blvd\.?|Court|Ct\.|Terrace|Place)(?=[\s,.]|$)/g },
];
// Addresses nobody needs told about: examples, noreply, git remotes, package scopes.
export const EMAIL_IGNORE = /@(?:example\.(?:com|org|net)|users\.noreply\.github\.com|noreply\.[a-z.]+|localhost|github\.com$|test\.(?:com|test))|no-?reply|donotreply|^git@/i;
// The only extensions PII text rules read (data-heavy code and JSON arrays drown them in noise).
export const PII_TEXT_EXT = /\.(md|txt|html?|csv|tsv|jsonl|json|yaml|yml|vcf|eml|mbox)$/i;

export function luhn(digits) {
  const d = digits.replace(/\D/g, '');
  if (d.length < 13 || d.length > 19) return false;
  let sum = 0;
  for (let i = 0; i < d.length; i++) {
    let n = +d[d.length - 1 - i];
    if (i % 2) { n *= 2; if (n > 9) n -= 9; }
    sum += n;
  }
  return sum % 10 === 0;
}

// ── INJECT ────────────────────────────────────────────────────────────────────
// Text written to steer an agent that reads it. The palace is read by agents as
// instructions, so harvested web text that carries these is a real threat, not a curiosity.
export const INJECT_RULES = [
  { id: 'override-phrase', sev: 'medium',
    re: /\b(?:ignore|disregard|forget)\s+(?:all\s+|any\s+)?(?:the\s+|your\s+)?(?:previous|prior|above|earlier|preceding)\s+(?:instructions|prompts?|directions|rules)/gi },
  { id: 'role-hijack',     sev: 'medium', re: /\byou are now (?:in |an? )?(?:developer|admin|jailbreak|DAN|unrestricted|root)\b/gi },
  { id: 'chat-markup',     sev: 'medium', re: /<\|(?:im_start|im_end|system|endoftext)\|>/g },
  { id: 'secrecy-order',   sev: 'medium', re: /\bdo not (?:tell|inform|alert|mention (?:this )?to) the user\b/gi },
  { id: 'exfil-order',     sev: 'high',   re: /\b(?:send|post|upload|forward|exfiltrate)\s+(?:the\s+|your\s+|all\s+)?(?:api[ _-]?keys?|credentials|secrets|tokens|passwords|\.env)\s+to\b/gi },
  // Unicode tag characters — invisible ASCII smuggling. No legitimate palace text needs them.
  { id: 'unicode-tags',    sev: 'high',   re: /[\u{E0000}-\u{E007F}]+/gu },
  { id: 'bidi-control',    sev: 'medium', re: /[‪-‮⁦-⁩]+/g },
  { id: 'zero-width',      sev: 'low',    re: /[​-‍⁠]+/g },
];
export const INJECT_TEXT_EXT = /\.(md|txt|html?|json|jsonl|ya?ml|csv|tsv|xml|svg)$/i;

// ── PATH ──────────────────────────────────────────────────────────────────────
// Files that must never be tracked, by name alone.
export const PATH_RULES = [
  { id: 'dotenv',            sev: 'high',   re: /(^|\/)\.env(\.[^\/]*)?$/i, except: /\.env\.(example|sample|template)$/i },
  { id: 'claude-local',      sev: 'high',   re: /(^|\/)settings\.local\.json$/ },
  { id: 'mcp-config',        sev: 'medium', re: /(^|\/)(\.mcp\.json|claude_desktop_config\.json)$/ },
  { id: 'key-file',          sev: 'high',   re: /\.(pem|key|p12|pfx|keystore|jks|kdbx|ppk)$/i },
  { id: 'ssh-key',           sev: 'high',   re: /(^|\/)id_(rsa|dsa|ecdsa|ed25519)(\.pub)?$/ },
  { id: 'credential-file',   sev: 'high',   re: /(^|\/)(\.netrc|\.npmrc|\.pypirc|\.git-credentials|credentials(\.json)?|service[-_]?account[^\/]*\.json)$/i },
  // Also applied to the names inside a zip (engine.mjs zipMembers), so an export is caught in an archive.
  { id: 'data-export',       sev: 'high',   re: /(^|\/|!)(conversations\.json|memories\.json|users\.json|[^\/!]*\.mbox|[^\/!]*\.pst|[^\/!]*\.vcf|[^\/!]*takeout[^\/!]*)$/i },
  { id: 'archive',           sev: 'medium', re: /\.(zip|tar|tgz|gz|7z|rar|bz2|xz)$/i }, // an archive's insides are opaque to the text rules
];

// ── INVENTORY ─────────────────────────────────────────────────────────────────
// Not findings — a census. The Sentry flags only what is NEW since the last recorded sweep.
export const SCRIPT_EXT = /\.(mjs|cjs|js|jsx|ts|py|sh)$/i;
export const INVENTORY_RULES = [
  { id: 'deletes', re: /\brm\s+-[a-z]*r[a-z]*f|\brmSync\s*\(|\bunlinkSync\s*\(|\brmdirSync\s*\(|shutil\.rmtree|os\.remove\(|os\.unlink\(|\bgit\s+(?:reset\s+--hard|clean\s+-[a-z]*f|push\s+(?:-f|--force))/ },
  { id: 'network', re: /\bfetch\s*\(|\bcurl\s|\bwget\s|requests\.(?:get|post|put)|urllib\.request|https?\.request\s*\(|axios\.|new WebSocket\(|\bgh\s+api\b|huggingface_hub|runpod\./ },
];

// ── helpers ───────────────────────────────────────────────────────────────────
export function mask(value) {
  const s = String(value);
  if (s.length <= 10) return `${s.slice(0, 3)}…[len ${s.length}]`;
  return `${s.slice(0, 8)}…${s.slice(-2)} [len ${s.length}]`;
}

// Stable id for a finding, used by allow.json. Hashes the value (never stores it), so an
// allowlisted false positive can be recognized again without the file carrying it.
export function fingerprint(rule, path, value) {
  return createHash('sha256').update(`${rule}\0${path}\0${value}`).digest('hex').slice(0, 16);
}

export const SEV_RANK = { high: 3, medium: 2, low: 1, info: 0 };
