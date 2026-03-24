import React, { useState } from 'react';
import { Lock } from 'lucide-react';

const OhmsLawIntuition = () => {
  // Logarithmic scale configuration
  // We want: min = 0.1, center = 1, max = 10
  // This gives us one decade below and one decade above
  const LOG_MIN = 0.1;
  const LOG_MAX = 10;
  const LOG_CENTER = 1;
  
  // Convert slider position (0-100) to actual value using log scale
  const sliderToValue = (sliderPos) => {
    // Map 0-100 to min-max in log space
    const logMin = Math.log10(LOG_MIN);
    const logMax = Math.log10(LOG_MAX);
    const logValue = logMin + (sliderPos / 100) * (logMax - logMin);
    return Math.pow(10, logValue);
  };
  
  // Convert actual value to slider position (0-100) using log scale
  const valueToSlider = (value) => {
    const logMin = Math.log10(LOG_MIN);
    const logMax = Math.log10(LOG_MAX);
    const logValue = Math.log10(value);
    return ((logValue - logMin) / (logMax - logMin)) * 100;
  };
  
  // Initialize with log-scale friendly values
  const [voltageSlider, setVoltageSlider] = useState(valueToSlider(3));
  const [currentSlider, setCurrentSlider] = useState(valueToSlider(0.75));
  const [resistanceSlider, setResistanceSlider] = useState(valueToSlider(4));
  const [locked, setLocked] = useState('resistance');
  
  const voltage = sliderToValue(voltageSlider);
  const current = sliderToValue(currentSlider);
  const resistance = sliderToValue(resistanceSlider);
  
  // Handle voltage slider change
  const handleVoltageChange = (newSliderPos) => {
    setVoltageSlider(newSliderPos);
    const newV = sliderToValue(newSliderPos);
    
    if (locked === 'resistance') {
      // Adjust current: I = V / R
      const newI = newV / resistance;
      setCurrentSlider(valueToSlider(newI));
    } else if (locked === 'current') {
      // Adjust resistance: R = V / I
      const newR = newV / current;
      setResistanceSlider(valueToSlider(newR));
    }
  };
  
  // Handle current slider change
  const handleCurrentChange = (newSliderPos) => {
    setCurrentSlider(newSliderPos);
    const newI = sliderToValue(newSliderPos);
    
    if (locked === 'resistance') {
      // Adjust voltage: V = I × R
      const newV = newI * resistance;
      setVoltageSlider(valueToSlider(newV));
    } else if (locked === 'voltage') {
      // Adjust resistance: R = V / I
      const newR = voltage / newI;
      setResistanceSlider(valueToSlider(newR));
    }
  };
  
  // Handle resistance slider change
  const handleResistanceChange = (newSliderPos) => {
    setResistanceSlider(newSliderPos);
    const newR = sliderToValue(newSliderPos);
    
    if (locked === 'voltage') {
      // Adjust current: I = V / R
      const newI = voltage / newR;
      setCurrentSlider(valueToSlider(newI));
    } else if (locked === 'current') {
      // Adjust voltage: V = I × R
      const newV = current * newR;
      setVoltageSlider(valueToSlider(newV));
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 bg-gray-900 text-white rounded-lg">
      
      {/* The Equation with Live Values */}
      <div className="mb-8 text-center">
        <div className="text-3xl sm:text-4xl font-mono mb-2 flex justify-center items-center flex-wrap gap-2">
          <span className="text-blue-400">{voltage.toFixed(4)}</span>
          <span className="text-gray-500">=</span>
          <span className="text-green-400">{current.toFixed(4)}</span>
          <span className="text-gray-500">×</span>
          <span className="text-yellow-400">{resistance.toFixed(4)}</span>
        </div>
        
        {/* Symbol names directly below numbers */}
        <div className="text-lg sm:text-xl font-mono mb-4 flex justify-center items-center flex-wrap gap-2">
          <span className="text-blue-400">V</span>
          <span className="text-gray-500">=</span>
          <span className="text-green-400">I</span>
          <span className="text-gray-500">×</span>
          <span className="text-yellow-400">R</span>
        </div>
        
        {/* Full names */}
        <div className="text-xs sm:text-sm text-gray-400 flex justify-center items-center flex-wrap gap-4">
          <span className="text-blue-400">Voltage</span>
          <span className="text-gray-500">=</span>
          <span className="text-green-400">Current</span>
          <span className="text-gray-500">×</span>
          <span className="text-yellow-400">Resistance</span>
        </div>
      </div>

      {/* Sliders */}
      <div className="space-y-6">
        {/* Voltage Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold">
              <span className="text-blue-400 text-xl font-mono">V</span>
              <span className="text-gray-400 text-sm ml-2">Voltage</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xl text-blue-400 font-mono">{voltage.toFixed(4)}</span>
              <button
                onClick={() => setLocked('voltage')}
                className={`p-2 rounded ${
                  locked === 'voltage' ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title="Lock voltage"
              >
                <Lock size={16} className={locked === 'voltage' ? 'text-white' : 'text-gray-400'} />
              </button>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={voltageSlider}
            onChange={(e) => handleVoltageChange(parseFloat(e.target.value))}
            disabled={locked === 'voltage'}
            className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{accentColor: '#60a5fa'}}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
            <span>0.1</span>
            <span>1</span>
            <span>10</span>
          </div>
        </div>

        {/* Current Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold">
              <span className="text-green-400 text-xl font-mono">I</span>
              <span className="text-gray-400 text-sm ml-2">Current</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xl text-green-400 font-mono">{current.toFixed(4)}</span>
              <button
                onClick={() => setLocked('current')}
                className={`p-2 rounded ${
                  locked === 'current' ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title="Lock current"
              >
                <Lock size={16} className={locked === 'current' ? 'text-white' : 'text-gray-400'} />
              </button>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={currentSlider}
            onChange={(e) => handleCurrentChange(parseFloat(e.target.value))}
            disabled={locked === 'current'}
            className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{accentColor: '#22c55e'}}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
            <span>0.1</span>
            <span>1</span>
            <span>10</span>
          </div>
        </div>

        {/* Resistance Slider */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-semibold">
              <span className="text-yellow-400 text-xl font-mono">R</span>
              <span className="text-gray-400 text-sm ml-2">Resistance</span>
            </span>
            <div className="flex items-center gap-3">
              <span className="text-xl text-yellow-400 font-mono">{resistance.toFixed(4)}</span>
              <button
                onClick={() => setLocked('resistance')}
                className={`p-2 rounded ${
                  locked === 'resistance' ? 'bg-yellow-600' : 'bg-gray-700 hover:bg-gray-600'
                }`}
                title="Lock resistance"
              >
                <Lock size={16} className={locked === 'resistance' ? 'text-white' : 'text-gray-400'} />
              </button>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={resistanceSlider}
            onChange={(e) => handleResistanceChange(parseFloat(e.target.value))}
            disabled={locked === 'resistance'}
            className="w-full h-3 bg-gray-700 rounded-lg appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{accentColor: '#facc15'}}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1 px-1">
            <span>0.1</span>
            <span>1</span>
            <span>10</span>
          </div>
        </div>
      </div>
      
      {/* Hint about what's locked */}
      <div className="mt-4 text-center text-sm text-gray-400">
        🔒 {locked === 'voltage' ? 'Voltage' : locked === 'current' ? 'Current' : 'Resistance'} is locked
      </div>
      
      {/* Explanation of logarithmic scale */}
      <div className="mt-6 p-4 bg-gray-800 rounded-lg text-sm">
        <p className="font-semibold mb-2 text-blue-400">📐 Logarithmic Scale</p>
        <p className="text-gray-300 mb-2">
          These sliders use a <strong>log scale</strong> so "1" is in the center. This makes multiplication/division feel symmetric:
        </p>
        <ul className="text-gray-400 space-y-1 ml-4">
          <li>• Moving left from center: 1 → 0.5 → 0.25 → 0.1 (÷2 each step)</li>
          <li>• Moving right from center: 1 → 2 → 4 → 10 (×2 each step)</li>
          <li>• Equal slider movement = equal multiplication/division</li>
        </ul>
        <p className="text-gray-500 text-xs mt-2">
          This is how decibels (sound), f-stops (photography), and pH (chemistry) work!
        </p>
      </div>
    </div>
  );
};

export default OhmsLawIntuition;