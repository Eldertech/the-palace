# Proposed new typed link in `Lossy Compression with Intent Alignment.md`

Add to the `links:` array in frontmatter:

```yaml
- target: "[[Palace Agent Infrastructure Spec]]"
  type: applies-to
  label: compression-at-every-interface
```

**Reason:** PAIS specs the multi-role palace agent architecture (Trickster, Coordinator, Worker, Palace). LCIA names the property — Rate-Distortion-Perception tradeoff with intent alignment — that operates at every interface in that architecture. The connection currently only routes through [[Generative Compression]] (which links to PAIS as `automated-by`); a direct typed link captures the deeper relationship that LCIA gives the information-theoretic foundation for every compression site PAIS describes.

The reciprocal link from PAIS back to LCIA is in card-029.
