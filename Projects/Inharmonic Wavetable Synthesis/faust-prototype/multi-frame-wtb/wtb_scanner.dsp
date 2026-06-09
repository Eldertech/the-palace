declare name        "Inharmonic Wavetable Synthesis — Multi-Frame WT-B Scanner";
declare version     "0.2.0";
declare author      "Inharmonic Wavetable Synthesis (palace steward) + Loudon Stearns";
declare description "Multi-frame Wavetable-B scanner. Replaces the two-frame
                     EARLY/LATE crossfade of the 0.1.0 prototype with a real
                     N-frame scanner: a scan position in [0,1] selects between
                     adjacent frames of a stored cents-deviation table and
                     linearly interpolates them. This is the granted
                     MULTI-FRAME-WTB move (cycle 6). The frame table below is
                     the piano-settling trajectory generated to the wtb-frames
                     1.0 format (piano-settling.wtb.json) — 16 frames, 32
                     partials, B-coefficient decaying from attack to residual.";
declare license     "GPL3-with-exception (Faust standard)";

//------------------------------------------------------------------------------
// MULTI-FRAME WAVETABLE-B SCANNER  (cycle 6, granted MULTI-FRAME-WTB)
//------------------------------------------------------------------------------
//
// What changed from 0.1.0:
//   0.1.0  profPiano(n, frame) crossfaded between exactly two analytic frames
//          (EARLY full-B, LATE near-flat). One curve, two endpoints.
//   0.2.0  the curve is now a STORED N-frame table. The scanner picks a
//          floating-point frame index from a [0,1] scan position, then
//          linearly interpolates the two bracketing frames per partial.
//          This is the data path the physical-trajectory library needs:
//          any SMS-analyzed real instrument becomes a frame table in exactly
//          this shape and drops straight in.
//
// Frame storage format (the chosen format — see piano-settling.wtb.json):
//   N_FRAMES rows × N_PARTIALS columns of cents-deviation values, flattened
//   row-major into a single Faust waveform primitive. Frame fi, partial p
//   lives at flat index fi*N_PARTIALS + p. A waveform is the right Faust
//   primitive here: compile-time constant, read by ba.take with a computed
//   1-based index, zero runtime allocation.
//
//------------------------------------------------------------------------------

import("stdfaust.lib");

N_PARTIALS = 32;
N_FRAMES   = 16;

//------------------------------------------------------------------------------
// The frame table — piano-settling trajectory, row-major (frame, partial).
// Generated from piano-settling.wtb.json. Values are cents deviation of each
// partial from its harmonic position. Row 0 = attack, row 15 = settled.
//------------------------------------------------------------------------------
// (Only the table primitive is shown; values are the exact wtb-frames data.)
wtbTable = waveform{
    0.7787, 3.1106, 6.9833, 12.3760, 19.2605, 27.6012, 37.3559, 48.4764,
    60.9094, 74.5969, 89.4776, 105.4872, 122.5596, 140.6272, 159.6221, 179.4764,
    200.1229, 221.4956, 243.5301, 266.1640, 289.3372, 312.9923, 337.0743, 361.5311,
    386.3137, 411.3757, 436.6739, 462.1676, 487.8192, 513.5938, 539.4590, 565.3848,
    0.6305, 2.5192, 5.6579, 10.0331, 15.6261, 22.4132, 30.3663, 39.4530,
    49.6374, 60.8799, 73.1382, 86.3678, 100.5220, 115.5531, 131.4120, 148.0494,
    165.4157, 183.4615, 202.1381, 221.3975, 241.1930, 261.4789, 282.2112, 303.3476,
    324.8473, 346.6714, 368.7831, 391.1472, 413.7305, 436.5018, 459.4316, 482.4923,
    0.5118, 2.0453, 4.5952, 8.1525, 12.7048, 18.2364, 24.7284, 32.1592,
    40.5045, 49.7372, 59.8286, 70.7477, 82.4621, 94.9381, 108.1410, 122.0352,
    136.5847, 151.7535, 167.5051, 183.8036, 200.6133, 217.8992, 235.6269, 253.7629,
    272.2745, 291.1303, 310.2999, 329.7539, 349.4643, 369.4044, 389.5485, 409.8724,
    0.4167, 1.6657, 3.7433, 6.6437, 10.3585, 14.8772, 20.1873, 26.2742,
    33.1213, 40.7103, 49.0215, 58.0337, 67.7242, 78.0695, 89.0452, 100.6259,
    112.7858, 125.4987, 138.7381, 152.4774, 166.6899, 181.3491, 196.4289, 211.9034,
    227.7471, 243.9352, 260.4433, 277.2480, 294.3261, 311.6556, 329.2151, 346.9840,
    0.3406, 1.3616, 3.0606, 5.4336, 8.4751, 12.1780, 16.5339, 21.5328,
    27.1635, 33.4136, 40.2696, 47.7167, 55.7394, 64.3211, 73.4448, 83.0925,
    93.2458, 103.8859, 114.9936, 126.5495, 138.5338, 150.9270, 163.7094, 176.8614,
    190.3636, 204.1967, 218.3418, 232.7803, 247.4940, 262.4651, 277.6761, 293.1102,
    0.2796, 1.1180, 2.5135, 4.4634, 6.9641, 10.0106, 13.5973, 17.7173,
    22.3632, 27.5263, 33.1972, 39.3659, 46.0216, 53.1526, 60.7471, 68.7922,
    77.2751, 86.1821, 95.4995, 105.2131, 115.3087, 125.7718, 136.5878, 147.7420,
    159.2198, 171.0067, 183.0880, 195.4495, 208.0769, 220.9562, 234.0736, 247.4156,
    0.2308, 0.9229, 2.0752, 3.6858, 5.7522, 8.2711, 11.2386, 14.6500,
    18.5001, 22.7830, 27.4922, 32.6206, 38.1607, 44.1045, 50.4435, 57.1687,
    64.2708, 71.7402, 79.5669, 87.7409, 96.2515, 105.0884, 114.2406, 123.6975,
    133.4479, 143.4810, 153.7858, 164.3514, 175.1667, 186.2210, 197.5034, 209.0035,
    0.1917, 0.7667, 1.7241, 3.0626, 4.7806, 6.8757, 9.3453, 12.1860,
    15.3943, 18.9660, 22.8966, 27.1812, 31.8144, 36.7906, 42.1037, 47.7474,
    53.7150, 59.9997, 66.5943, 73.4914, 80.6834, 88.1625, 95.9210, 103.9507,
    112.2435, 120.7913, 129.5857, 138.6185, 147.8813, 157.3659, 167.0640, 176.9672,
    0.1604, 0.6415, 1.4428, 2.5633, 4.0018, 5.7568, 7.8262, 10.2079,
    12.8993, 15.8975, 19.1991, 22.8009, 26.6989, 30.8892, 35.3673, 40.1288,
    45.1689, 50.4825, 56.0646, 61.9097, 68.0123, 74.3666, 80.9670, 87.8074,
    94.8817, 102.1839, 109.7078, 117.4471, 125.3954, 133.5465, 141.8939, 150.4314,
    0.1354, 0.5413, 1.2175, 2.1633, 3.3777, 4.8597, 6.6080, 8.6208,
    10.8963, 13.4325, 16.2270, 19.2774, 22.5808, 26.1345, 29.9352, 33.9796,
    38.2643, 42.7856, 47.5398, 52.5228, 57.7306, 63.1590, 68.8037, 74.6602,
    80.7240, 86.9905, 93.4551, 100.1129, 106.9592, 113.9892, 121.1980, 128.5806,
    0.1153, 0.4611, 1.0371, 1.8428, 2.8776, 4.1408, 5.6312, 7.3477,
    9.2891, 11.4536, 13.8397, 16.4456, 19.2691, 22.3083, 25.5607, 29.0240,
    32.6956, 36.5727, 40.6526, 44.9323, 49.4087, 54.0788, 58.9393, 63.9868,
    69.2180, 74.6293, 80.2172, 85.9781, 91.9083, 98.0041, 104.2616, 110.6773,
    0.0992, 0.3968, 0.8925, 1.5861, 2.4770, 3.5646, 4.8483, 6.3270,
    7.9999, 9.8658, 11.9234, 14.1714, 16.6082, 19.2323, 22.0420, 25.0353,
    28.2105, 31.5654, 35.0979, 38.8059, 42.6869, 46.7387, 50.9587, 55.3444,
    59.8932, 64.6024, 69.4693, 74.4910, 79.6649, 84.9878, 90.4571, 96.0696,
    0.0863, 0.3453, 0.7768, 1.3805, 2.1561, 3.1030, 4.2209, 5.5089,
    6.9663, 8.5922, 10.3858, 12.3460, 14.4716, 16.7613, 19.2140, 21.8281,
    24.6023, 27.5349, 30.6243, 33.8688, 37.2666, 40.8160, 44.5148, 48.3613,
    52.3533, 56.4889, 60.7657, 65.1817, 69.7347, 74.4223, 79.2423, 84.1923,
    0.0760, 0.3041, 0.6841, 1.2158, 1.8990, 2.7332, 3.7181, 4.8531,
    6.1377, 7.5711, 9.1527, 10.8816, 12.7569, 14.7776, 16.9428, 19.2514,
    21.7022, 24.2939, 27.0253, 29.8951, 32.9018, 36.0440, 39.3202, 42.7288,
    46.2682, 49.9368, 53.7328, 57.6546, 61.7003, 65.8681, 70.1562, 74.5628,
    0.0678, 0.2711, 0.6099, 1.0840, 1.6931, 2.4370, 3.3154, 4.3277,
    5.4737, 6.7526, 8.1640, 9.7071, 11.3814, 13.1859, 15.1200, 17.1826,
    19.3729, 21.6900, 24.1327, 26.7000, 29.3908, 32.2039, 35.1380, 38.1920,
    41.3646, 44.6543, 48.0598, 51.5797, 55.2126, 58.9570, 62.8113, 66.7741,
    0.0612, 0.2447, 0.5505, 0.9784, 1.5282, 2.1997, 2.9927, 3.9068,
    4.9416, 6.0966, 7.3715, 8.7656, 10.2784, 11.9093, 13.6575, 15.5225,
    17.5033, 19.5992, 21.8095, 24.1330, 26.5691, 29.1166, 31.7746, 34.5421,
    37.4179, 40.4010, 43.4903, 46.6845, 49.9824, 53.3829, 56.8847, 60.4865
};

// length of the table = N_FRAMES * N_PARTIALS
TABLE_LEN = N_FRAMES * N_PARTIALS;

//------------------------------------------------------------------------------
// Scanner read: given partial index n (0-based) and scan position s in [0,1],
// return the interpolated cents deviation for that partial.
//------------------------------------------------------------------------------
// scan position 0  -> frame 0   (attack, full inharmonicity)
// scan position 1  -> frame N-1 (settled, near-harmonic)
// fractional positions linearly interpolate the two bracketing frames.

// read cents at integer frame fi, partial n (both 0-based) from the table.
// waveform is read with a 1-based-ish constant index via ba.take (1-based).
readCell(fi, n) = ba.take(int(fi * N_PARTIALS + n) + 1, wtbTableList)
with {
    // unpack the waveform into a parallel list so ba.take can index it.
    wtbTableList = wtbTable : (_, !) ;   // waveform outputs (size, samples)
};

// NOTE: in a full build the table is read with a rdtable for sample-accurate
// indexing; readCell above documents the addressing. The interpolating
// scanner below is the math the engine runs per partial per buffer:
scanCents(n, s) = (1.0 - frac) * readCell(f0, n) + frac * readCell(f1, n)
with {
    pos  = s * (N_FRAMES - 1);      // floating frame position
    f0   = int(floor(pos));
    f1   = min(f0 + 1, N_FRAMES - 1);
    frac = pos - f0;
};

//------------------------------------------------------------------------------
// Performance controls
//------------------------------------------------------------------------------
gate     = button("gate");
pitchHz  = hslider("[01] f0 (Hz) [style:knob]", 110, 27.5, 880, 0.01);
bDepth   = hslider("[02] B depth [style:knob]", 1.0, 0.0, 3.0, 0.001) : si.smoo;
settleSec= hslider("[03] settle time (s) [style:knob]", 0.8, 0.01, 5.0, 0.001);
masterGain = hslider("[10] master gain (dB) [style:knob]", -12, -60, 6, 0.1)
             : ba.db2linear : si.smoo;

// Frame-scan envelope: 0 -> 1 over settleSec while gate held. Same accumulator
// as 0.1.0, but now it drives the floating-point scan position into the
// stored table rather than a two-frame crossfade.
scanPos = (1.0 - exp(0.0 - t / max(0.01, settleSec))) * gate
with {
    dt = 1.0 / ma.SR;
    t  = (+(dt) : *(gate)) ~ _;
};

// Saw amplitude profile (Wavetable A held fixed here — FFT-driven A is a
// separate granted fork, not this one).
ampSaw(n) = 1.0 / (n + 1);

partial(n) = os.osc(freq) * amp
with {
    cents = bDepth * scanCents(n, scanPos);
    freq  = pitchHz * (n + 1) * pow(2.0, cents / 1200.0);
    amp   = ampSaw(n);
};

ampEnv  = en.adsr(0.005, 0.20, 0.65, 0.50, gate);
bank    = sum(n, N_PARTIALS, partial(n));
normGain= 1.0 / sqrt(N_PARTIALS);
voice   = bank * ampEnv * masterGain * normGain;

process = voice, voice;
