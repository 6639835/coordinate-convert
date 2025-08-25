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
      {/* App Header */}
      <header className="app-header">
        <div className="app-header__container">
          <div className="app-header__left">
            <svg className="app-icon" height="32" viewBox="0 0 24 24" width="32">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
            </svg>
            <span className="app-header__title">Coordinate Converter</span>
          </div>
          <div className="app-header__right">
            <span className="app-version">v1.0.0</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="main-container">
        {/* Main Content */}
        <main className="main-content">
          {/* Content Header */}
          <div className="content-header">
            <div className="content-header__left">
              <span className="content-icon">🌍</span>
              <span className="content-title">DMS Coordinate Converter</span>
            </div>
            <div className="content-header__right">
              <span className="content-status">Ready to convert</span>
            </div>
          </div>

          {/* Input Section - GitHub File Style */}
          <div className="file-content">
            <div className="code-editor">
              <div className="code-line">
                <span className="line-number">1</span>
                <div className="code-input">
                  <input
                    type="text"
                    className="coordinate-input"
                    placeholder="Enter DMS coordinates (e.g., N45°30'15&quot; W122°40'30&quot;)"
                    value={state.input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    autoFocus
                  />
                </div>
              </div>
              
              {state.result && (
                <div className="code-line result-line">
                  <span className="line-number">2</span>
                  <div className="code-output">
                    <span className="output-label">// Decimal degrees:</span>
                    <span className="output-value">{state.result}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="action-bar">
            <button
              className="app-btn app-btn--primary"
              onClick={convertDMS}
              disabled={!state.input.trim()}
            >
              <svg className="btn-icon" width="16" height="16" viewBox="0 0 16 16">
                <path d="M8 4a4 4 0 1 1 0 8 4 4 0 0 1 0-8Z"/>
              </svg>
              Convert
            </button>
            
            <button
              className="app-btn"
              onClick={copyToClipboard}
              disabled={!state.result}
            >
              <svg className="btn-icon" width="16" height="16" viewBox="0 0 16 16">
                <path d="M0 6.75C0 5.784.784 5 1.75 5h1.5a.75.75 0 0 1 0 1.5h-1.5a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-1.5a.75.75 0 0 1 1.5 0v1.5A1.75 1.75 0 0 1 9.25 16h-7.5A1.75 1.75 0 0 1 0 14.25Z"/>
                <path d="M5 1.75C5 .784 5.784 0 6.75 0h7.5C15.216 0 16 .784 16 1.75v7.5A1.75 1.75 0 0 1 14.25 11h-7.5A1.75 1.75 0 0 1 5 9.25Zm1.75-.25a.25.25 0 0 0-.25.25v7.5c0 .138.112.25.25.25h7.5a.25.25 0 0 0 .25-.25v-7.5a.25.25 0 0 0-.25-.25Z"/>
              </svg>
              Copy
            </button>
            
            <button
              className="app-btn"
              onClick={clearFields}
            >
              <svg className="btn-icon" width="16" height="16" viewBox="0 0 16 16">
                <path d="M11 1.75V3h2.25a.75.75 0 0 1 0 1.5H2.75a.75.75 0 0 1 0-1.5H5V1.75C5 .784 5.784 0 6.75 0h2.5C10.216 0 11 .784 11 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.748 1.748 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 1.75V3h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25Z"/>
              </svg>
              Clear
            </button>
          </div>

          {/* Examples Section */}
          <div className="examples-section">
            <div className="examples-header">
              <h3>📋 Supported Formats</h3>
            </div>
            <div className="examples-grid">
              <div className="example-item">
                <code>N45°30'15" W122°40'30"</code>
                <span className="example-desc">Standard DMS notation</span>
              </div>
              <div className="example-item">
                <code>N4530.25 W12240.5</code>
                <span className="example-desc">Decimal minutes</span>
              </div>
              <div className="example-item">
                <code>45°30'15"N 122°40'30"W</code>
                <span className="example-desc">Direction suffix</span>
              </div>
              <div className="example-item">
                <code>N45 30 15 W122 40 30</code>
                <span className="example-desc">Space separated</span>
              </div>
            </div>
          </div>
        </main>

        {/* Sidebar */}
        <aside className="app-sidebar">
          <div className="sidebar-section">
            <h3>About</h3>
            <p>Convert DMS coordinates to decimal degrees with precision and ease.</p>
          </div>
          
          <div className="sidebar-section">
            <h3>Quick Actions</h3>
            <div className="quick-actions">
              <kbd>Enter</kbd> Convert
              <kbd>Esc</kbd> Clear
              <kbd>Ctrl+C</kbd> Copy
            </div>
          </div>
          
          <div className="sidebar-section">
            <h3>Status</h3>
            <div className={`status-indicator ${state.isError ? 'error' : 'success'}`}>
              <span className="status-dot"></span>
              {state.status}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default App;
