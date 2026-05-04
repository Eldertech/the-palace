// prompts.js — load + render the skill's prompt templates.
//
// Templates live at `.claude/skills/palace-orchestrator/prompts/`. They use
// `{{var}}` placeholders that get filled from manifest values. A template may
// `{{>shared}}` to include the shared template inline (single-level include).

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';

const PLACEHOLDER_RE = /\{\{\s*([a-zA-Z_][a-zA-Z0-9_.-]*)\s*\}\}/g;
const INCLUDE_RE = /\{\{>\s*([a-zA-Z_][a-zA-Z0-9_.-]*)\s*\}\}/g;

/**
 * Resolve a value from a dotted path on an object.
 *   path "model.name" against { model: { name: "x" } } → "x"
 */
function resolveDotted(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? undefined : acc[key]), obj);
}

/**
 * Render a template string by substituting `{{var}}` and `{{>include}}`.
 * Throws on unresolved placeholders to fail loudly during build/test.
 *
 * @param {string} template
 * @param {object} vars
 * @param {(name: string) => string} loadInclude — function loading a partial by name
 */
export function renderTemplate(template, vars, loadInclude) {
  // First, resolve includes (single level — no nested includes).
  let withIncludes = template.replace(INCLUDE_RE, (_, name) => {
    if (typeof loadInclude !== 'function') {
      throw new Error(`prompts.renderTemplate: encountered include {{>${name}}} but no loadInclude function provided`);
    }
    return loadInclude(name);
  });
  // Then, substitute variables.
  return withIncludes.replace(PLACEHOLDER_RE, (_, key) => {
    const val = resolveDotted(vars, key);
    if (val === undefined || val === null) {
      throw new Error(`prompts.renderTemplate: unresolved placeholder {{${key}}}`);
    }
    if (typeof val === 'object') return JSON.stringify(val);
    return String(val);
  });
}

/**
 * Load + render a named template from the skill's prompts/ directory.
 *
 * @param {object} opts
 * @param {string} opts.skillRoot — absolute path to .claude/skills/palace-orchestrator/
 * @param {string} opts.templateName — `songline` | `steward` | `shared`
 * @param {object} opts.vars — manifest + extras to substitute
 * @returns {string} rendered prompt
 */
export function loadAndRender({ skillRoot, templateName, vars }) {
  const promptsDir = join(skillRoot, 'prompts');
  const file = join(promptsDir, `${templateName}.md`);
  if (!existsSync(file)) {
    throw new Error(`prompt template not found: ${file}`);
  }
  const text = readFileSync(file, 'utf8');
  const loadInclude = (name) => {
    const p = join(promptsDir, `${name}.md`);
    if (!existsSync(p)) throw new Error(`prompt include not found: ${p}`);
    return readFileSync(p, 'utf8');
  };
  return renderTemplate(text, vars, loadInclude);
}
