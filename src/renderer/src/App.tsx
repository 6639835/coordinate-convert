import React, { useState, useEffect, useCallback } from 'react';
import { DMSConverter } from '../utils/dmsConverter';
import './App.css';

interface ConversionState {
  input: string;
  result: string;
  status: string;
  isError: boolean;
}

const App: React.FC = () => {
  const [state, setState] = useState<ConversionState>({
    input: '',
    result: '',
    status: 'Ready',
    isError: false,
  });

  const updateState = useCallback((updates: Partial<ConversionState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const convertDMS = useCallback(() => {
    if (!state.input.trim()) {
      updateState({
        status: 'Please enter coordinates',
        isError: true,
        result: '',
      });
      return;
    }

    try {
      const { latitude, longitude } = DMSConverter.parseCoordinatePair(state.input);
      const result = DMSConverter.formatDecimalDegrees(latitude, longitude, 9);
      
      updateState({
        result,
        status: 'Conversion successful',
        isError: false,
      });
    } catch (error) {
      updateState({
        status: error instanceof Error ? error.message : 'Conversion failed',
        isError: true,
        result: '',
      });
    }
  }, [state.input, updateState]);

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
    updateState({
      input: value,
      status: value.trim() ? 'Ready to convert' : 'Ready',
      isError: false,
    });
  }, [updateState]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      convertDMS();
    } else if (e.key === 'Escape') {
      clearFields();
    }
  }, [convertDMS, clearFields]);

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

  return (
    <div className="app">
      <div className="app__container">
        {/* Header */}
        <header className="app__header">
          <div className="app__header-content">
            <h1 className="app__title">
              <span className="app__title-icon">🌍</span>
              Coordinate Converter
            </h1>
            <p className="app__subtitle">
              Convert DMS (Degrees, Minutes, Seconds) coordinates to decimal degrees
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="app__main">
          {/* Input Section */}
          <section className="card">
            <div className="card__header">
              <h2 className="card__title">Input Coordinates</h2>
              <p className="card__description">
                Enter latitude and longitude in DMS format
              </p>
            </div>
            
            <div className="card__content">
              <div className="input-group">
                <label htmlFor="coordinates" className="input-label">
                  DMS Coordinates
                </label>
                <input
                  id="coordinates"
                  type="text"
                  className="input input--primary"
                  placeholder="N45°30'15&quot; W122°40'30&quot;"
                  value={state.input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  autoFocus
                />
              </div>

              <div className="examples">
                <h3 className="examples__title">Supported Formats:</h3>
                <ul className="examples__list">
                  <li className="examples__item">
                    <code>N45°30'15" W122°40'30"</code>
                  </li>
                  <li className="examples__item">
                    <code>N4530.25 W12240.5</code>
                  </li>
                  <li className="examples__item">
                    <code>45°30'15"N 122°40'30"W</code>
                  </li>
                  <li className="examples__item">
                    <code>N45 30 15 W122 40 30</code>
                  </li>
                </ul>
              </div>
            </div>
          </section>

          {/* Actions */}
          <section className="actions">
            <button
              className="btn btn--primary"
              onClick={convertDMS}
              disabled={!state.input.trim()}
            >
              <span className="btn__icon">⚡</span>
              Convert
              <span className="btn__shortcut">Enter</span>
            </button>
            
            <button
              className="btn btn--secondary"
              onClick={copyToClipboard}
              disabled={!state.result}
            >
              <span className="btn__icon">📋</span>
              Copy
              <span className="btn__shortcut">Ctrl+C</span>
            </button>
            
            <button
              className="btn btn--tertiary"
              onClick={clearFields}
            >
              <span className="btn__icon">🗑️</span>
              Clear
              <span className="btn__shortcut">Esc</span>
            </button>
          </section>

          {/* Result Section */}
          <section className="card">
            <div className="card__header">
              <h2 className="card__title">Decimal Degrees</h2>
              <p className="card__description">
                Converted coordinates in decimal format
              </p>
            </div>
            
            <div className="card__content">
              <div className="input-group">
                <label htmlFor="result" className="input-label">
                  Result
                </label>
                <input
                  id="result"
                  type="text"
                  className="input input--readonly"
                  value={state.result}
                  readOnly
                  placeholder="Converted coordinates will appear here..."
                />
              </div>
            </div>
          </section>
        </main>

        {/* Status Bar */}
        <footer className="app__footer">
          <div className={`status ${state.isError ? 'status--error' : 'status--success'}`}>
            <span className="status__indicator"></span>
            <span className="status__text">{state.status}</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default App;
