# Proposed new typed link in `Palace Agent Infrastructure Spec.md`

Add to the `links:` array in frontmatter:

```yaml
- target: "[[Lossy Compression with Intent Alignment]]"
  type: deepens
  label: gives-info-theoretic-foundation
```

**Reason:** Reciprocal of the link proposed in card-028. PAIS currently links to [[Generative Compression]] but not directly to [[Lossy Compression with Intent Alignment]] — the connection routes only transitively through GC. LCIA brings the rate-distortion-perception tradeoff and the deposit-as-model-training reframe, which together give PAIS's compression-at-every-interface architecture its information-theoretic backbone. A direct `deepens` link captures that LCIA is more rigorous about compression than PAIS itself can be while remaining an infrastructure spec.
