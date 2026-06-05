"""
wavetable_writer.py — the write side of the Ableton Wavetable pipeline.

Stage 0 gave us a *reader* (extract_profile.py). This is the missing *writer*:
the smallest end-to-end proof that we can take a real factory preset, change one
named parameter, and emit a valid `.adv` that Ableton will load.

The `.adv` format is gzipped XML (confirmed in RECONNAISSANCE.md). Every full-form
parameter carries `<Manual Value="…">`. To mutate a parameter we find its
`<Voice_*>` element and rewrite the Manual value in place — everything else
(MidiControllerRange, AutomationTarget, ModulationTarget ids) is left untouched,
so the file stays structurally legal by construction. This is the whole point of
the fixed-architecture bet: there is no topology to get wrong, only values.

What this module proves mechanically (verified in the sandbox, 2026-06-03):
  read XML → locate Voice_Filter1_Frequency → mutate 714.4 Hz → 200 Hz →
  gzip to a valid 3.6 KB .adv → decompress → re-parse confirms 200 Hz,
  byte-identical to the mutated XML.

What it does NOT prove: that Ableton actually loads the emitted file and that the
change is audible. That is the audition gate — it needs Loudon's Mac and ears.
The TRICKSTER ask for this cycle carries that gate.

Usage:
    from wavetable_writer import read_adv, write_adv, set_param, get_param

    xml = read_adv("Aqueous Pad.adv")          # or read a decompressed .xml directly
    print(get_param(xml, "Voice_Filter1_Frequency"))   # -> 714.412231
    xml2 = set_param(xml, "Voice_Filter1_Frequency", 200.0)
    write_adv(xml2, "Aqueous Pad — dark.adv")  # emits a loadable .adv
"""
import gzip
import re
import io


# A full-form parameter looks like:
#   <Voice_Filter1_Frequency>
#       <LomId Value="0" />              (optional)
#       <Manual Value="714.412231" />
#       ... <MidiControllerRange> ... </MidiControllerRange> ...
#   </Voice_Filter1_Frequency>
# We match the element name + its first <Manual Value="…"> and rewrite just that value.
def _manual_re(param_name: str) -> re.Pattern:
    return re.compile(
        r'(<' + re.escape(param_name) + r'>\s*'
        r'(?:<LomId[^/]*/>\s*)?'
        r'<Manual Value=")([^"]+)(")'
    )


def read_adv(path: str) -> str:
    """Read a preset to its XML text. Accepts a gzipped .adv OR a plain .xml."""
    if path.endswith(".xml"):
        with open(path, "r", encoding="utf-8") as f:
            return f.read()
    with gzip.open(path, "rb") as f:
        return f.read().decode("utf-8")


def write_adv(xml: str, path: str) -> int:
    """Write XML text out as a gzipped .adv. Returns the compressed byte count.

    Uses a fixed mtime so the output is reproducible (same input -> same bytes).
    """
    raw = xml.encode("utf-8")
    buf = io.BytesIO()
    with gzip.GzipFile(fileobj=buf, mode="wb", mtime=0) as g:
        g.write(raw)
    data = buf.getvalue()
    with open(path, "wb") as f:
        f.write(data)
    return len(data)


def get_param(xml: str, param_name: str):
    """Return the current Manual value of a full-form parameter as a float, or None."""
    m = _manual_re(param_name).search(xml)
    if not m:
        return None
    try:
        return float(m.group(2))
    except ValueError:
        return m.group(2)


def set_param(xml: str, param_name: str, value) -> str:
    """Return a copy of xml with the named parameter's Manual value replaced.

    Raises KeyError if the parameter is not present (a guard against silently
    writing a no-op preset — the failure that shipped 352 bad files in GSL).
    """
    pat = _manual_re(param_name)
    if not pat.search(xml):
        raise KeyError(
            f"{param_name!r} not found as a full-form Manual parameter. "
            "Enum/flag params (single-line Value=) are not yet writable here."
        )
    new_xml, n = pat.subn(r"\g<1>" + str(value) + r"\g<3>", xml, count=1)
    if n != 1:
        raise RuntimeError(f"expected exactly 1 substitution, made {n}")
    return new_xml
