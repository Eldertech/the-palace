import React, { useState, useEffect, useRef } from 'react';
import * as Tone from 'tone';

const StringBendingDemo = () => {
  const [bendAmount, setBendAmount] = useState(1.0); // Tension multiplier (1.0 = unbent)
  const [isPlaying, setIsPlaying] = useState(false);
  const [B0, setB0] = useState(0.0005); // Initial inharmonicity coefficient
  const [numPartials, setNumPartials] = useState(16);
  const oscillatorsRef = useRef([]);
  const [f0, setF0] = useState(65.41); // C2 - low piano string

  // Calculate inharmonicity coefficient based on tension
  const calculateB = (tensionMultiplier) => {
    return B0 / tensionMultiplier;
  };

  // Calculate partial frequency with inharmonicity
  const calculatePartialFreq = (n, fundamental, B) => {
    return n * fundamental * Math.sqrt(1 + B * n * n);
  };

  // Calculate frequencies for all partials
  const getPartialData = () => {
    const bentF0 = f0 * Math.sqrt(bendAmount);
    const currentB = calculateB(bendAmount);
    
    const partials = [];
    for (let n = 1; n <= numPartials; n++) {
      const freq = calculatePartialFreq(n, bentF0, currentB);
      const idealFreq = n * bentF0; // Harmonic series position
      const stretch = freq - idealFreq; // Hz of stretching
      const stretchCents = 1200 * Math.log2(freq / idealFreq); // Cents of stretching
      
      partials.push({
        n,
        freq,
        idealFreq,
        stretch,
        stretchCents
      });
    }
    return partials;
  };

  const partialData = getPartialData();
  const currentB = calculateB(bendAmount);
  const bentF0 = f0 * Math.sqrt(bendAmount);

  // Play the inharmonic sound
  const playSound = async () => {
    if (isPlaying) {
      // Stop all oscillators
      oscillatorsRef.current.forEach(osc => {
        osc.stop();
        osc.dispose();
      });
      oscillatorsRef.current = [];
      setIsPlaying(false);
    } else {
      // Start Tone.js
      await Tone.start();
      
      // Create oscillators for each partial
      const oscs = [];
      partialData.forEach((partial, idx) => {
        const osc = new Tone.Oscillator(partial.freq, "sine").toDestination();
        // Amplitude decreases with partial number
        osc.volume.value = -6 - (idx * 1.5);
        osc.start();
        oscs.push(osc);
      });
      
      oscillatorsRef.current = oscs;
      setIsPlaying(true);
    }
  };

  // Update oscillator frequencies when bend changes
  useEffect(() => {
    if (isPlaying) {
      partialData.forEach((partial, idx) => {
        if (oscillatorsRef.current[idx]) {
          oscillatorsRef.current[idx].frequency.rampTo(partial.freq, 0.05);
        }
      });
    }
  }, [bendAmount]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      oscillatorsRef.current.forEach(osc => {
        osc.stop();
        osc.dispose();
      });
    };
  }, []);

  // Visualization of harmonic positions - fixed reference frame
  const renderHarmonicChart = () => {
    const svgWidth = 1000;
    const svgHeight = 300;
    const padding = 60;
    const plotWidth = svgWidth - 2 * padding;
    const plotHeight = svgHeight - 2 * padding;
    
    // Fixed scale: harmonic number on x-axis
    const maxHarmonic = numPartials + 1;
    
    // Calculate pixel position for harmonic number (fixed)
    const getIdealX = (n) => padding + (n / maxHarmonic) * plotWidth;
    
    // Calculate pixel position for actual frequency (as deviation from ideal)
    // We'll show the actual position scaled by harmonic number equivalence
    const getActualX = (partial) => {
      // What "harmonic number" would this frequency correspond to?
      const equivalentHarmonic = partial.freq / bentF0;
      return padding + (equivalentHarmonic / maxHarmonic) * plotWidth;
    };
    
    return (
      <svg width="100%" height={svgHeight} viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="bg-gray-900 rounded">
        {/* Axes */}
        <line x1={padding} y1={svgHeight - padding} x2={svgWidth - padding} y2={svgHeight - padding} 
              stroke="#666" strokeWidth="2" />
        <line x1={padding} y1={padding} x2={padding} y2={svgHeight - padding} 
              stroke="#666" strokeWidth="2" />
        
        {/* X-axis labels */}
        <text x={svgWidth/2} y={svgHeight - 10} fill="white" fontSize="14" textAnchor="middle">
          Harmonic Number
        </text>
        
        {/* Grid lines for FIXED ideal harmonic positions */}
        {partialData.map((partial) => {
          const x = getIdealX(partial.n);
          return (
            <g key={`grid-${partial.n}`}>
              <line
                x1={x}
                y1={padding}
                x2={x}
                y2={svgHeight - padding}
                stroke="#444"
                strokeWidth="1"
                strokeDasharray="4,4"
              />
              {/* Harmonic number labels on x-axis */}
              <text
                x={x}
                y={svgHeight - padding + 20}
                fill="#999"
                fontSize="12"
                textAnchor="middle"
              >
                {partial.n}
              </text>
            </g>
          );
        })}
        
        {/* FIXED ideal harmonic positions (gray) - these never move */}
        {partialData.map((partial) => {
          const x = getIdealX(partial.n);
          const y = svgHeight / 2;
          return (
            <circle
              key={`ideal-${partial.n}`}
              cx={x}
              cy={y}
              r="4"
              fill="#666"
            />
          );
        })}
        
        {/* MOVING actual inharmonic positions (colored by stretch) */}
        {partialData.map((partial) => {
          const idealX = getIdealX(partial.n);
          const actualX = getActualX(partial);
          const y = svgHeight / 2;
          
          const color = partial.stretchCents > 20 ? '#ef4444' :
                       partial.stretchCents > 10 ? '#f59e0b' :
                       partial.stretchCents > 5 ? '#eab308' : '#22c55e';
          
          return (
            <g key={`actual-${partial.n}`}>
              {/* Line showing deviation from ideal */}
              <line
                x1={idealX}
                y1={y}
                x2={actualX}
                y2={y}
                stroke={color}
                strokeWidth="3"
                opacity="0.8"
              />
              {/* Actual position marker */}
              <circle
                cx={actualX}
                cy={y}
                r="6"
                fill={color}
                stroke="white"
                strokeWidth="1"
              />
              {/* Harmonic number label above */}
              <text
                x={actualX}
                y={y - 15}
                fill="white"
                fontSize="12"
                textAnchor="middle"
                fontWeight="bold"
              >
                {partial.n}
              </text>
              {/* Stretch amount label below */}
              <text
                x={actualX}
                y={y + 25}
                fill={color}
                fontSize="10"
                textAnchor="middle"
              >
                +{partial.stretchCents.toFixed(1)}¢
              </text>
            </g>
          );
        })}
        
        {/* Legend */}
        <text x={padding} y={30} fill="white" fontSize="13">
          Gray circles = FIXED ideal harmonic positions
        </text>
        <text x={padding} y={48} fill="white" fontSize="13">
          Colored circles = actual inharmonic positions (move as you bend)
        </text>
        <text x={padding} y={66} fill="white" fontSize="13">
          Lines show stretching in cents above ideal
        </text>
      </svg>
    );
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-6 bg-gray-800 text-white rounded-lg">
      <h1 className="text-3xl font-bold mb-6">Piano String Bending: Inharmonicity Demo</h1>
      
      <div className="mb-6 p-4 bg-gray-700 rounded">
        <p className="mb-2">
          This demo shows how string bending (increasing tension) affects the inharmonicity of piano strings.
        </p>
        <p className="text-sm text-gray-300">
          Formula: f<sub>n</sub> = n·f₀·√(1 + B·n²), where B = B₀/tension
        </p>
      </div>

      {/* String Bend Control */}
      <div className="mb-6">
        <label className="block mb-2 font-semibold">
          String Bend (Tension Multiplier): {bendAmount.toFixed(2)}x
        </label>
        <input
          type="range"
          min="1.0"
          max="2.0"
          step="0.01"
          value={bendAmount}
          onChange={(e) => setBendAmount(parseFloat(e.target.value))}
          className="w-full"
        />
        <div className="flex justify-between text-sm text-gray-400 mt-1">
          <span>Unbent (1.0x)</span>
          <span>Bent up ~2 semitones (2.0x)</span>
        </div>
      </div>

      {/* Info Display */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-400">Fundamental</div>
          <div className="text-xl font-bold">{bentF0.toFixed(2)} Hz</div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-400">Pitch Shift</div>
          <div className="text-xl font-bold">
            {(1200 * Math.log2(Math.sqrt(bendAmount))).toFixed(0)} cents
          </div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-400">Inharmonicity B</div>
          <div className="text-xl font-bold">{(currentB * 10000).toFixed(2)} × 10⁻⁴</div>
        </div>
        <div className="bg-gray-700 p-3 rounded">
          <div className="text-sm text-gray-400">B Change</div>
          <div className="text-xl font-bold">{((currentB / B0) * 100).toFixed(0)}%</div>
        </div>
      </div>

      {/* Play Button */}
      <div className="mb-6">
        <button
          onClick={playSound}
          className={`px-6 py-3 rounded font-semibold ${
            isPlaying ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
          }`}
        >
          {isPlaying ? 'Stop' : 'Play Inharmonic Tone'}
        </button>
        <p className="text-sm text-gray-400 mt-2">
          Listen to how the timbre changes as you move the bend slider!
        </p>
      </div>

      {/* Harmonic Visualization */}
      <div className="mb-6">
        <h2 className="text-xl font-bold mb-3">Harmonic Positions</h2>
        {renderHarmonicChart()}
        <div className="mt-2 flex gap-4 text-sm">
          <span><span className="inline-block w-3 h-3 bg-green-500 rounded mr-1"></span>&lt;5 cents</span>
          <span><span className="inline-block w-3 h-3 bg-yellow-500 rounded mr-1"></span>5-10 cents</span>
          <span><span className="inline-block w-3 h-3 bg-orange-500 rounded mr-1"></span>10-20 cents</span>
          <span><span className="inline-block w-3 h-3 bg-red-500 rounded mr-1"></span>&gt;20 cents</span>
        </div>
      </div>

      {/* Detailed Partial Data */}
      <div>
        <h2 className="text-xl font-bold mb-3">Partial Frequencies</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-700">
              <tr>
                <th className="p-2 text-left">Partial #</th>
                <th className="p-2 text-right">Ideal Freq (Hz)</th>
                <th className="p-2 text-right">Actual Freq (Hz)</th>
                <th className="p-2 text-right">Stretch (Hz)</th>
                <th className="p-2 text-right">Stretch (cents)</th>
              </tr>
            </thead>
            <tbody>
              {partialData.slice(0, 12).map((partial) => (
                <tr key={partial.n} className="border-b border-gray-700">
                  <td className="p-2">{partial.n}</td>
                  <td className="p-2 text-right">{partial.idealFreq.toFixed(2)}</td>
                  <td className="p-2 text-right font-semibold">{partial.freq.toFixed(2)}</td>
                  <td className="p-2 text-right">{partial.stretch.toFixed(2)}</td>
                  <td className="p-2 text-right">{partial.stretchCents.toFixed(1)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Physics Explanation */}
      <div className="mt-6 p-4 bg-gray-700 rounded">
        <h3 className="font-bold mb-2">What's Happening:</h3>
        <ul className="space-y-2 text-sm">
          <li>• As you bend the string, <strong>tension increases</strong> and the fundamental pitch rises</li>
          <li>• Stiffness stays constant, so <strong>B decreases</strong> proportionally to 1/tension</li>
          <li>• Upper harmonics become <strong>less stretched</strong> - moving closer to ideal harmonic positions</li>
          <li>• The tone becomes <strong>purer and less piano-like</strong> when bent</li>
          <li>• This is why bent guitar notes sound subtly different from unbent ones!</li>
        </ul>
      </div>

      {/* Controls */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div>
          <label className="block mb-2 text-sm">Initial Inharmonicity (B₀ × 10⁴)</label>
          <input
            type="range"
            min="1"
            max="15"
            step="0.5"
            value={B0 * 10000}
            onChange={(e) => setB0(parseFloat(e.target.value) / 10000)}
            className="w-full"
          />
          <div className="text-sm text-gray-400">{(B0 * 10000).toFixed(1)}</div>
        </div>
        <div>
          <label className="block mb-2 text-sm">Number of Partials</label>
          <input
            type="range"
            min="8"
            max="24"
            step="1"
            value={numPartials}
            onChange={(e) => setNumPartials(parseInt(e.target.value))}
            className="w-full"
          />
          <div className="text-sm text-gray-400">{numPartials}</div>
        </div>
      </div>
    </div>
  );
};

export default StringBendingDemo;
