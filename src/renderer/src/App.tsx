import React, { useState, useEffect, useCallback } from 'react';
import { DMSConverter } from '../utils/dmsConverter';
import { CoordinateUtils, CoordinateFormat } from '../utils/coordinateUtils';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { BatchProcessor } from '../components/BatchProcessor';
import { CoordinateCalculator } from '../components/CoordinateCalculator';
import './App.css';

interface ConversionState {
  input: string;
  result: string;
  status: string;
  isError: boolean;
  precision: number;
  detectedFormat: CoordinateFormat;
  reverseMode: boolean;
  isLoading: boolean;
}

interface ConversionHistory {
  id: string;
  input: string;
  result: string;
  timestamp: Date;
  format: CoordinateFormat;
}

const App: React.FC = () => {
  const [state, setState] = useState<ConversionState>({
    input: '',
    result: '',
    status: 'Ready',
    isError: false,
    precision: 6,
    detectedFormat: CoordinateFormat.UNKNOWN,
    reverseMode: false,
    isLoading: false,
  });

  const [history, setHistory] = useState<ConversionHistory[]>([]);
  const [activeModal, setActiveModal] = useState<'batch' | 'calculator' | null>(null);

  const updateState = useCallback((updates: Partial<ConversionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Enhanced conversion with format detection and reverse mode
  const performConversion = useCallback(async () => {
    if (!state.input.trim()) {
      updateState({
        status: 'Please enter coordinates',
        isError: true,
        result: '',
      });
      return;
    }

    updateState({ isLoading: true, status: 'Converting...', isError: false });

    try {
      // Add processing delay for UX
      await new Promise(resolve => setTimeout(resolve, 100));

      let result: string;

      if (state.reverseMode) {
        // Reverse mode: Convert decimal to DMS
        const coords = state.input.split(/[,\s]+/).map(s => parseFloat(s.trim()));
        if (coords.length !== 2 || coords.some(isNaN)) {
          throw new Error('Invalid decimal degree format. Use: latitude, longitude');
        }
        
        const [latitude, longitude] = coords;
        if (!CoordinateUtils.validateCoordinate(latitude, longitude)) {
          throw new Error('Coordinates out of valid range');
        }

        result = CoordinateUtils.decimalToDMS(latitude, longitude, state.precision);
      } else {
        // Forward mode: Convert to decimal degrees
        const detectedFormat = CoordinateUtils.detectFormat(state.input);
        
        if (detectedFormat === CoordinateFormat.UNKNOWN) {
          throw new Error('Unrecognized coordinate format');
        }

        if (detectedFormat === CoordinateFormat.DMS) {
          const parsed = DMSConverter.parseCoordinatePair(state.input);
          result = DMSConverter.formatDecimalDegrees(parsed.latitude, parsed.longitude, state.precision);
        } else if (detectedFormat === CoordinateFormat.DD) {
          const coords = state.input.split(/[,\s]+/).map(s => parseFloat(s.trim()));
          if (coords.length !== 2 || coords.some(isNaN)) {
            throw new Error('Invalid decimal degree format');
          }
          result = `${coords[0].toFixed(state.precision)} ${coords[1].toFixed(state.precision)}`;
        } else {
          throw new Error(`${detectedFormat} format conversion not yet implemented`);
        }

        updateState({ detectedFormat });
      }

      // Add to history
      const historyEntry: ConversionHistory = {
        id: Date.now().toString(),
        input: state.input,
        result,
        timestamp: new Date(),
        format: state.reverseMode ? CoordinateFormat.DD : state.detectedFormat
      };

      setHistory(prev => [historyEntry, ...prev.slice(0, 9)]); // Keep last 10

      updateState({
        result,
        status: 'Conversion successful',
        isError: false,
        isLoading: false,
      });

    } catch (error) {
      updateState({
        status: error instanceof Error ? error.message : 'Conversion failed',
        isError: true,
        result: '',
        isLoading: false,
      });
    }
  }, [state.input, state.precision, state.reverseMode, state.detectedFormat, updateState]);

  const copyToClipboard = useCallback(async () => {
    if (!state.result) {
      updateState({
        status: 'Nothing to copy',
        isError: true,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(state.result);
      updateState({
        status: 'Copied to clipboard',
        isError: false,
      });
    } catch (error) {
      updateState({
        status: 'Failed to copy to clipboard',
        isError: true,
      });
    }
  }, [state.result, updateState]);

  const clearFields = useCallback(() => {
    updateState({
      input: '',
      result: '',
      status: 'Fields cleared',
      isError: false,
    });
  }, [updateState]);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const detectedFormat = value.trim() ? CoordinateUtils.detectFormat(value) : CoordinateFormat.UNKNOWN;
    
    updateState({
      input: value,
      status: value.trim() ? 'Ready to convert' : 'Ready',
      isError: false,
      detectedFormat,
    });
  }, [updateState]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      performConversion();
    } else if (e.key === 'Escape') {
      clearFields();
    }
  }, [performConversion, clearFields]);

  // Additional helper functions
  const toggleReverseMode = useCallback(() => {
    updateState({ 
      reverseMode: !state.reverseMode,
      input: '',
      result: '',
      status: 'Ready',
      isError: false 
    });
  }, [state.reverseMode, updateState]);

  const handlePrecisionChange = useCallback((precision: number) => {
    updateState({ precision });
  }, [updateState]);

  const loadFromHistory = useCallback((historyItem: ConversionHistory) => {
    updateState({
      input: historyItem.input,
      result: historyItem.result,
      status: 'Loaded from history',
      isError: false,
    });
  }, [updateState]);

  const clearHistory = useCallback(() => {
    setHistory([]);
    updateState({ status: 'History cleared', isError: false });
  }, [updateState]);

  const getUTMConversion = useCallback(async () => {
    if (!state.result) {
      updateState({ status: 'Convert coordinates first', isError: true });
      return;
    }

    try {
      const coords = state.result.split(' ').map(s => parseFloat(s.trim()));
      if (coords.length !== 2 || coords.some(isNaN)) {
        throw new Error('Invalid decimal coordinates');
      }

      const utm = CoordinateUtils.toUTM(coords[0], coords[1]);
      const utmString = `${utm.zone}${utm.hemisphere} ${utm.easting} ${utm.northing}`;
      
      await navigator.clipboard.writeText(utmString);
      updateState({ status: 'UTM coordinates copied to clipboard', isError: false });
    } catch (error) {
      updateState({ 
        status: error instanceof Error ? error.message : 'UTM conversion failed',
        isError: true 
      });
    }
  }, [state.result, updateState]);

  // Auto-clear status after 3 seconds
  useEffect(() => {
    if (state.status && state.status !== 'Ready' && state.status !== 'Ready to convert') {
      const timer = setTimeout(() => {
        updateState({
          status: state.result ? 'Ready to convert' : 'Ready',
          isError: false,
        });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [state.status, state.result, updateState]);

  const handleExampleClick = useCallback((exampleText: string) => {
    updateState({
      input: exampleText,
      status: 'Ready to convert',
      isError: false,
      result: '',
      detectedFormat: CoordinateUtils.detectFormat(exampleText),
    });
  }, [updateState]);

  const getStatusType = () => {
    if (state.isLoading) return 'pending';
    if (state.isError) return 'error';
    if (state.result) return 'success';
    return 'pending';
  };

  const formatDetectionDisplay = () => {
    if (!state.input.trim()) return null;
    
    const formatNames = {
      [CoordinateFormat.DMS]: 'DMS (Degrees, Minutes, Seconds)',
      [CoordinateFormat.DD]: 'Decimal Degrees',
      [CoordinateFormat.UTM]: 'UTM (Universal Transverse Mercator)',
      [CoordinateFormat.MGRS]: 'MGRS (Military Grid Reference)',
      [CoordinateFormat.UNKNOWN]: 'Unknown Format'
    };

    return (
      <div className={`format-detector ${state.detectedFormat !== CoordinateFormat.UNKNOWN ? 'detected' : 'unknown'}`}>
        <svg className="format-icon" viewBox="0 0 24 24" fill="none">
          <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
        </svg>
        Detected: {formatNames[state.detectedFormat]}
      </div>
    );
  };

  return (
    <ErrorBoundary>
      <div className="app">
        {/* App Header */}
        <header className="app-header">
          <div className="app-header__container">
            <div className="app-header__left">
              <div className="app-icon">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" />
                </svg>
              </div>
              <span className="app-header__title">Coordinate Converter Pro</span>
            </div>
            <div className="app-header__right">
              <span className="app-version">v1.0.0</span>
            </div>
          </div>
        </header>

        {/* Main Container */}
        <div className="main-container">
          {/* Main Converter Card */}
          <main className="card converter-card">
            <div className="converter-header">
              <h2 className="converter-title">
                <svg className="converter-icon" viewBox="0 0 24 24" fill="none">
                  <path 
                    d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2Z" 
                    fill="currentColor"
                  />
                </svg>
                {state.reverseMode ? 'Decimal to DMS' : 'Advanced Converter'}
              </h2>
              <span className={`badge badge--${getStatusType()}`}>
                {state.isLoading ? 'Converting...' : state.isError ? 'Error' : state.result ? 'Ready' : 'Idle'}
              </span>
            </div>

            {/* Feature Bar */}
            <div className="feature-bar">
              <button className="feature-btn" onClick={toggleReverseMode}>
                <svg viewBox="0 0 24 24">
                  <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7M8 12L12 16M12 16L16 12M12 16V8" stroke="currentColor" strokeWidth="2"/>
                </svg>
                {state.reverseMode ? 'To Decimal' : 'To DMS'}
              </button>
              
              <button className="feature-btn" onClick={() => setActiveModal('batch')}>
                <svg viewBox="0 0 24 24">
                  <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L19.7071 9.70711C19.8946 9.89464 20 10.149 20 10.4142V19C20 20.1046 19.1046 21 18 21H17Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Batch Process
              </button>

              <button className="feature-btn" onClick={() => setActiveModal('calculator')}>
                <svg viewBox="0 0 24 24">
                  <path d="M9 17H15M9 13H15M9 9H15M4 5C4 3.89543 4.89543 3 6 3H18C19.1046 3 20 3.89543 20 5V19C20 20.1046 19.1046 21 18 21H6C4.89543 21 4 20.1046 4 19V5Z" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Calculator
              </button>

              {state.result && (
                <button className="feature-btn" onClick={getUTMConversion}>
                  <svg viewBox="0 0 24 24">
                    <path d="M3 7V17C3 18.1046 3.89543 19 5 19H19C20.1046 19 21 18.1046 21 17V7M8 12L12 16M12 16L16 12M12 16V8" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Get UTM
                </button>
              )}
            </div>

            {/* Precision Control */}
            <div className="precision-control">
              <span className="precision-label">Precision:</span>
              <input
                type="range"
                min="0"
                max="12"
                value={state.precision}
                onChange={(e) => handlePrecisionChange(parseInt(e.target.value))}
                className="precision-slider"
              />
              <span className="precision-value">{state.precision}</span>
            </div>

            {/* Input Section */}
            <div className="input-section">
              <label htmlFor="coordinate-input" className="input-label">
                {state.reverseMode 
                  ? 'Enter Decimal Degrees (latitude, longitude)'
                  : 'Enter Coordinates (Auto-detect format)'
                }
              </label>
              <input
                id="coordinate-input"
                type="text"
                className="coordinate-input"
                placeholder={state.reverseMode 
                  ? "e.g., 45.5042, -122.6751"
                  : "e.g., N45°30'15\" W122°40'30\" or 45.5042, -122.6751"
                }
                value={state.input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                autoFocus
              />
              {formatDetectionDisplay()}
            </div>

            {/* Result Section */}
            {state.result && (
              <div className={`result-section visible`}>
                <div className="result-container">
                  <div className="result-label">
                    {state.reverseMode ? 'DMS Format' : 'Decimal Degrees'}
                  </div>
                  <div className="result-value">{state.result}</div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="action-bar">
              <button
                className="btn btn--primary"
                onClick={performConversion}
                disabled={state.isLoading || !state.input.trim()}
              >
                {state.isLoading ? (
                  <>
                    <svg className="btn-icon spinning" viewBox="0 0 24 24">
                      <path d="M12 2V6M12 18V22M4.93 4.93L7.76 7.76M16.24 16.24L19.07 19.07M2 12H6M18 12H22M4.93 19.07L7.76 16.24M16.24 7.76L19.07 4.93" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Converting...
                  </>
                ) : (
                  <>
                    <svg className="btn-icon" viewBox="0 0 24 24">
                      <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
                    </svg>
                    Convert
                  </>
                )}
              </button>
              
              <button
                className="btn"
                onClick={copyToClipboard}
                disabled={!state.result}
              >
                <svg className="btn-icon" viewBox="0 0 24 24">
                  <path d="M8 5H6C4.89543 5 4 5.89543 4 7V19C4 20.1046 4.89543 21 6 21H16C17.1046 21 18 20.1046 18 19V18M8 5C8 3.89543 8.89543 3 10 3H14C15.1046 3 16 3.89543 16 5V7C16 8.10457 15.1046 9 14 9H10C8.89543 9 8 8.10457 8 7V5ZM12 12H20M20 12L17 9M20 12L17 15" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Copy
              </button>
              
              <button
                className="btn"
                onClick={clearFields}
              >
                <svg className="btn-icon" viewBox="0 0 24 24">
                  <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7M10 11V17M14 11V17M15 7V4C15 3.44772 14.5523 3 14 3H10C9.44772 3 9 3.44772 9 4V7M4 7H20" stroke="currentColor" strokeWidth="2"/>
                </svg>
                Clear
              </button>
            </div>
          </main>

          {/* Sidebar */}
          <aside className="sidebar">
            {/* Status Card */}
            <div className="card status-card">
              <div className="status-header">
                <h3 className="status-title">Status</h3>
              </div>
              <div className={`status-indicator ${getStatusType()}`}>
                <span className="status-dot"></span>
                {state.status}
              </div>
            </div>

            {/* History Card */}
            {history.length > 0 && (
              <div className="card examples-card">
                <div className="examples-header">
                  <h3 className="examples-title">Recent Conversions</h3>
                  <button className="btn--sm" onClick={clearHistory}>Clear</button>
                </div>
                <div className="history-section">
                  {history.slice(0, 5).map((item) => (
                    <div 
                      key={item.id}
                      className="history-item"
                      onClick={() => loadFromHistory(item)}
                    >
                      <div className="history-input">{item.input.length > 20 ? item.input.substring(0, 20) + '...' : item.input}</div>
                      <div className="history-time">{item.timestamp.toLocaleTimeString()}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Examples Card */}
            <div className="card examples-card">
              <div className="examples-header">
                <h3 className="examples-title">Examples</h3>
                <p className="examples-subtitle">Click to try</p>
              </div>
              <div className="examples-list">
                {state.reverseMode ? (
                  <>
                    <div className="example-item" onClick={() => handleExampleClick('45.5042, -122.6751')}>
                      <div className="example-code">45.5042, -122.6751</div>
                      <div className="example-desc">Portland, Oregon</div>
                    </div>
                    <div className="example-item" onClick={() => handleExampleClick('40.7128, -74.0060')}>
                      <div className="example-code">40.7128, -74.0060</div>
                      <div className="example-desc">New York City</div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="example-item" onClick={() => handleExampleClick('N45°30\'15" W122°40\'30"')}>
                      <div className="example-code">N45°30'15" W122°40'30"</div>
                      <div className="example-desc">Standard DMS</div>
                    </div>
                    <div className="example-item" onClick={() => handleExampleClick('45.5042, -122.6751')}>
                      <div className="example-code">45.5042, -122.6751</div>
                      <div className="example-desc">Decimal degrees</div>
                    </div>
                    <div className="example-item" onClick={() => handleExampleClick('45°30\'15"N 122°40\'30"W')}>
                      <div className="example-code">45°30'15"N 122°40'30"W</div>
                      <div className="example-desc">Direction suffix</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </aside>
        </div>

        {/* Modals */}
        {activeModal === 'batch' && (
          <BatchProcessor onClose={() => setActiveModal(null)} />
        )}
        
        {activeModal === 'calculator' && (
          <CoordinateCalculator onClose={() => setActiveModal(null)} />
        )}
      </div>
    </ErrorBoundary>
  );
};

export default App;
