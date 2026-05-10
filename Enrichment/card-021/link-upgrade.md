# Proposed link upgrade in `Generative Compression.md` frontmatter

Current entry in the `links:` array:

```yaml
- target: "[[Palace Agent Infrastructure Spec]]"
  type: connects-to
  label: "automated-by"
```

## Option A — replace the label

```yaml
- target: "[[Palace Agent Infrastructure Spec]]"
  type: connects-to
  label: "operates-at-every-interface-of"
```

## Option B — keep the existing link, add a second one

```yaml
- target: "[[Palace Agent Infrastructure Spec]]"
  type: connects-to
  label: "automated-by"
- target: "[[Palace Agent Infrastructure Spec]]"
  type: deepens
  label: "operates-at-every-interface-of"
```

**Reason:** The original label captures only that PAIS's automated context-compression (§3.3) uses generative compression. The conversation surfaced a stronger claim: every interface in PAIS's multi-role architecture (Trickster ↔ Coordinator ↔ Worker ↔ Palace) is a compression site. The relationship is broader than "automated-by."

Option B preserves the original framing alongside the broader one.
