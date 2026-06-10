#pragma once

// ============================================================================
// WordMap - pure logic for Word mode (INTERFACE.md section 6).
//
// "Type a word and scan through it": a word maps to a path of vowel anchor
// points; a scan position 0..1 resolves to a pad coordinate along that path with
// smoothstep blends between plateaus. The PROCESSOR owns this (so state restore
// works without a GUI); the mock JS mirrors the exact same math.
//
// No JUCE dependency: <array>, <cmath>, <cstddef>, <cctype>. The letter->vowel
// mapping, the anchor coordinates, and the scan timing are all pinned by the
// contract and MUST stay identical to the inlined JS in gui/index.html.
// ============================================================================

#include <array>
#include <cmath>
#include <cstddef>
#include <cctype>

namespace word_map
{
    static constexpr int kMaxWordChars = 32;   // word length cap (contract sec 6)
    static constexpr int kMaxPath      = 32;   // path points cap (<= one per char)

    struct PadPoint { float x = 0.5f, y = 0.45f; };

    // Anchor pad positions (INTERFACE.md sec 2 / TractEngine::kAnchorPos). Indexed
    // by the vowel letters a/e/i/o/u. x right 0..1, y DOWN 0..1.
    inline PadPoint anchorFor (char vowel)
    {
        switch (vowel)
        {
            case 'a': return { 0.50f, 0.90f };
            case 'e': return { 0.15f, 0.55f };
            case 'i': return { 0.08f, 0.10f };
            case 'o': return { 0.85f, 0.58f };
            case 'u': return { 0.90f, 0.12f };
            default:  return { 0.50f, 0.45f };   // schwa (never reached for valid vowels)
        }
    }

    // Letter -> vowel letter, case-insensitive (contract sec 6):
    //   a->a e->e i->i o->o u->u y->i w->u ; every other char -> 0 (ignored).
    inline char vowelLetter (char ch)
    {
        const char c = (char) std::tolower ((unsigned char) ch);
        switch (c)
        {
            case 'a': case 'e': case 'i': case 'o': case 'u': return c;
            case 'y': return 'i';
            case 'w': return 'u';
            default:  return 0;     // ignored
        }
    }

    // A resolved word: the path of vowel points + per-character path indices.
    // letterVowel[i] is the index into path[] for character i, or -1 if ignored.
    struct WordPath
    {
        int      length = 0;                      // number of characters consumed
        char     chars[kMaxPath] = { 0 };         // the (truncated, lower) characters
        int      letterVowel[kMaxPath] = { 0 };   // path index per char, -1 if ignored
        int      pathLen = 0;                      // number of vowel points
        PadPoint path[kMaxPath] = {};             // vowel anchor coordinates
        char     pathVowel[kMaxPath] = { 0 };      // the vowel letter at each path point

        bool active() const { return pathLen >= 1; }
    };

    // Build a WordPath from a C-string word (NUL-terminated). Case-insensitive,
    // truncated to kMaxWordChars. Allocation-free.
    inline WordPath build (const char* word)
    {
        WordPath wp;
        if (word == nullptr) return wp;

        int n = 0;
        for (; word[n] != 0 && n < kMaxWordChars; ++n)
        {
            const char raw = word[n];
            const char lower = (char) std::tolower ((unsigned char) raw);
            wp.chars[n] = lower;

            const char v = vowelLetter (raw);
            if (v != 0 && wp.pathLen < kMaxPath)
            {
                wp.letterVowel[n] = wp.pathLen;
                wp.pathVowel[wp.pathLen] = v;
                wp.path[wp.pathLen] = anchorFor (v);
                ++wp.pathLen;
            }
            else
            {
                wp.letterVowel[n] = -1;
            }
        }
        wp.length = n;
        return wp;
    }

    // Resolve the scan position t in [0,1] to a pad coordinate along the path,
    // per the contract scan-timing math:
    //   K path points split t into K equal segments. Within segment i (1-based),
    //   local s = K*t - (i-1). If i > 1 and s < 0.35: smoothstep blend p_(i-1) ->
    //   p_i with u = s/0.35 (smoothstep 3u^2 - 2u^3); else hold p_i. t=0 is exactly
    //   p_1, t=1 is exactly p_K. K=1 holds constant.
    inline PadPoint scan (const WordPath& wp, float t)
    {
        if (wp.pathLen <= 0) return { 0.5f, 0.45f };
        const int K = wp.pathLen;
        if (K == 1) return wp.path[0];

        if (t <= 0.0f) return wp.path[0];
        if (t >= 1.0f) return wp.path[K - 1];

        // segment index i in 1..K (the last boundary t==1 handled above)
        int i = (int) std::floor ((double) t * (double) K) + 1;
        if (i < 1) i = 1;
        if (i > K) i = K;
        const double s = (double) K * (double) t - (double) (i - 1);

        const PadPoint pi = wp.path[i - 1];   // p_i (0-based: index i-1)
        if (i > 1 && s < 0.35)
        {
            const PadPoint pPrev = wp.path[i - 2];   // p_(i-1)
            double u = s / 0.35;
            if (u < 0.0) u = 0.0; else if (u > 1.0) u = 1.0;
            const double ss = u * u * (3.0 - 2.0 * u);   // smoothstep 3u^2 - 2u^3
            PadPoint out;
            out.x = (float) (pPrev.x + (pi.x - pPrev.x) * ss);
            out.y = (float) (pPrev.y + (pi.y - pPrev.y) * ss);
            return out;
        }
        return pi;   // hold p_i
    }
}
