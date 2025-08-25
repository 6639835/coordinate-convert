import React, { useState, useCallback } from 'react';
import { CoordinateUtils, Coordinate, DistanceResult } from '../utils/coordinateUtils';
import { DMSConverter } from '../utils/dmsConverter';

interface CalculatorProps {
  onClose: () => void;
}

interface CalculatorState {
  point1: string;
  point2: string;
  result: DistanceResult | null;
  error: string;
  isCalculating: boolean;
}

export const CoordinateCalculator: React.FC<CalculatorProps> = ({ onClose }) => {
  const [state, setState] = useState<CalculatorState>({
    point1: '',
    point2: '',
    result: null,
    error: '',
    isCalculating: false
  });

  const parseCoordinate = (input: string): Coordinate | null => {
    try {
      const trimmed = input.trim();
      if (!trimmed) return null;

      // Try parsing as decimal degrees first
      const decimalMatch = trimmed.match(/^(-?\d+\.?\d*)[,\s]+(-?\d+\.?\d*)$/);
      if (decimalMatch) {
        const lat = parseFloat(decimalMatch[1]);
        const lon = parseFloat(decimalMatch[2]);
        if (CoordinateUtils.validateCoordinate(lat, lon)) {
          return { latitude: lat, longitude: lon };
        }
      }

      // Try parsing as DMS
      const dmsResult = DMSConverter.parseCoordinatePair(trimmed);
      if (dmsResult && CoordinateUtils.validateCoordinate(dmsResult.latitude, dmsResult.longitude)) {
        return dmsResult;
      }

      return null;
    } catch {
      return null;
    }
  };

  const calculate = useCallback(async () => {
    setState(prev => ({ ...prev, isCalculating: true, error: '', result: null }));

    try {
      const coord1 = parseCoordinate(state.point1);
      const coord2 = parseCoordinate(state.point2);

      if (!coord1) {
        throw new Error('Invalid format for first coordinate');
      }
      if (!coord2) {
        throw new Error('Invalid format for second coordinate');
      }

      // Simulate processing time for large calculations
      await new Promise(resolve => setTimeout(resolve, 100));

      const result = CoordinateUtils.calculateDistance(coord1, coord2);
      setState(prev => ({ ...prev, result, isCalculating: false }));
    } catch (error) {
      setState(prev => ({ 
        ...prev, 
        error: error instanceof Error ? error.message : 'Calculation failed',
        isCalculating: false 
      }));
    }
  }, [state.point1, state.point2]);

  const formatDistance = (meters: number): string => {
    if (meters < 1000) {
      return `${meters.toFixed(2)} m`;
    } else if (meters < 1000000) {
      return `${(meters / 1000).toFixed(2)} km`;
    } else {
      return `${(meters / 1000000).toFixed(2)} Mm`;
    }
  };

  const formatBearing = (degrees: number): string => {
    const cardinalDirections = [
      'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
      'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'
    ];
    const index = Math.round(degrees / 22.5) % 16;
    return `${degrees.toFixed(1)}° (${cardinalDirections[index]})`;
  };

  const copyResult = useCallback((text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could add a toast notification here
    }).catch(console.error);
  }, []);

  const loadExample = useCallback(() => {
    setState(prev => ({
      ...prev,
      point1: 'N40°45\'00" W73°59\'00"', // New York
      point2: 'N34°03\'00" W118°15\'00"'  // Los Angeles
    }));
  }, []);

  const clear = useCallback(() => {
    setState({
      point1: '',
      point2: '',
      result: null,
      error: '',
      isCalculating: false
    });
  }, []);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content calculator" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <svg className="modal-icon" viewBox="0 0 24 24" fill="none">
              <path d="M9 2V6M15 2V6M3 10H21M5 4H19C20.1046 4 21 4.89543 21 6V20C21 21.1046 20.1046 22 19 22H5C3.89543 22 4 21.1046 4 20V6C4 4.89543 4.89543 4 5 4Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Coordinate Calculator
          </h2>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          <div className="calculator-description">
            <p>Calculate distance and bearing between two geographic coordinates.</p>
            <p>Supports both decimal degrees and DMS formats.</p>
          </div>

          {/* Input Section */}
          <div className="calculator-section">
            <h3>Coordinates</h3>
            
            <div className="coordinate-input-group">
              <label htmlFor="point1">First Point</label>
              <input
                id="point1"
                type="text"
                className="coordinate-input"
                placeholder="e.g., N40°45'00&quot; W73°59'00&quot; or 40.75, -73.983"
                value={state.point1}
                onChange={(e) => setState(prev => ({ ...prev, point1: e.target.value }))}
              />
            </div>

            <div className="coordinate-input-group">
              <label htmlFor="point2">Second Point</label>
              <input
                id="point2"
                type="text"
                className="coordinate-input"
                placeholder="e.g., N34°03'00&quot; W118°15'00&quot; or 34.05, -118.25"
                value={state.point2}
                onChange={(e) => setState(prev => ({ ...prev, point2: e.target.value }))}
              />
            </div>

            <div className="calculator-controls">
              <button 
                className="btn btn--primary"
                onClick={calculate}
                disabled={state.isCalculating || !state.point1.trim() || !state.point2.trim()}
              >
                {state.isCalculating ? (
                  <>
                    <svg className="btn-icon spinning" viewBox="0 0 24 24">
                      <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Calculating...
                  </>
                ) : (
                  <>
                    <svg className="btn-icon" viewBox="0 0 24 24">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Calculate
                  </>
                )}
              </button>
              <button className="btn" onClick={loadExample}>
                Load Example
              </button>
              <button className="btn" onClick={clear}>
                Clear
              </button>
            </div>
          </div>

          {/* Error Display */}
          {state.error && (
            <div className="calculator-section">
              <div className="error-message">
                <svg className="error-icon" viewBox="0 0 24 24">
                  <path d="M12 9V11M12 15H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {state.error}
              </div>
            </div>
          )}

          {/* Results Section */}
          {state.result && (
            <div className="calculator-section">
              <h3>Results</h3>
              
              <div className="result-grid">
                <div className="result-card">
                  <div className="result-header">
                    <h4>Distance</h4>
                    <button 
                      className="copy-btn"
                      onClick={() => copyResult(formatDistance(state.result!.distance))}
                      title="Copy distance"
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M8 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21H16C17.1046 21 18 20.1046 18 19V18" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                  </div>
                  <div className="result-value large">
                    {formatDistance(state.result.distance)}
                  </div>
                  <div className="result-details">
                    <div>Meters: {state.result.distance.toLocaleString()}</div>
                    <div>Kilometers: {(state.result.distance / 1000).toFixed(3)}</div>
                    <div>Miles: {(state.result.distance / 1609.344).toFixed(3)}</div>
                    <div>Nautical Miles: {(state.result.distance / 1852).toFixed(3)}</div>
                  </div>
                </div>

                <div className="result-card">
                  <div className="result-header">
                    <h4>Forward Bearing</h4>
                    <button 
                      className="copy-btn"
                      onClick={() => copyResult(formatBearing(state.result!.bearing))}
                      title="Copy bearing"
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M8 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21H16C17.1046 21 18 20.1046 18 19V18" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                  </div>
                  <div className="result-value">
                    {formatBearing(state.result.bearing)}
                  </div>
                  <div className="bearing-compass">
                    <svg viewBox="0 0 100 100" className="compass">
                      <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="2"/>
                      <text x="50" y="15" textAnchor="middle" fontSize="12" fill="currentColor">N</text>
                      <text x="85" y="55" textAnchor="middle" fontSize="12" fill="currentColor">E</text>
                      <text x="50" y="95" textAnchor="middle" fontSize="12" fill="currentColor">S</text>
                      <text x="15" y="55" textAnchor="middle" fontSize="12" fill="currentColor">W</text>
                      <line 
                        x1="50" 
                        y1="50" 
                        x2={50 + 35 * Math.sin(state.result.bearing * Math.PI / 180)} 
                        y2={50 - 35 * Math.cos(state.result.bearing * Math.PI / 180)}
                        stroke="var(--text-accent)" 
                        strokeWidth="3"
                        markerEnd="url(#arrowhead)"
                      />
                      <defs>
                        <marker id="arrowhead" markerWidth="10" markerHeight="7" 
                                refX="0" refY="3.5" orient="auto">
                          <polygon points="0 0, 10 3.5, 0 7" fill="var(--text-accent)" />
                        </marker>
                      </defs>
                    </svg>
                  </div>
                </div>

                <div className="result-card">
                  <div className="result-header">
                    <h4>Reverse Bearing</h4>
                    <button 
                      className="copy-btn"
                      onClick={() => copyResult(formatBearing(state.result!.reverseBearing))}
                      title="Copy reverse bearing"
                    >
                      <svg viewBox="0 0 24 24" fill="none">
                        <path d="M8 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21H16C17.1046 21 18 20.1046 18 19V18" stroke="currentColor" strokeWidth="2"/>
                      </svg>
                    </button>
                  </div>
                  <div className="result-value">
                    {formatBearing(state.result.reverseBearing)}
                  </div>
                  <div className="result-note">
                    From point 2 back to point 1
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Info Section */}
          <div className="calculator-section">
            <div className="info-section">
              <h4>About the Calculations</h4>
              <ul>
                <li><strong>Distance:</strong> Calculated using the Haversine formula on the WGS84 ellipsoid</li>
                <li><strong>Bearing:</strong> Initial bearing from point 1 to point 2 (great circle path)</li>
                <li><strong>Accuracy:</strong> Suitable for most navigation purposes, accurate to within meters</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
