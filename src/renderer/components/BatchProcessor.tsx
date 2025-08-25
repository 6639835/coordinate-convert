import React, { useState, useCallback, useRef } from 'react';
import { CoordinateUtils, ConversionResult, ExportFormat } from '../utils/coordinateUtils';

interface BatchProcessorProps {
  onClose: () => void;
}

interface BatchState {
  inputs: string[];
  results: ConversionResult[];
  isProcessing: boolean;
  progress: number;
  operation: 'convert' | 'validate' | 'toUTM' | 'toDMS';
  exportFormat: ExportFormat;
}

export const BatchProcessor: React.FC<BatchProcessorProps> = ({ onClose }) => {
  const [state, setState] = useState<BatchState>({
    inputs: [],
    results: [],
    isProcessing: false,
    progress: 0,
    operation: 'convert',
    exportFormat: ExportFormat.CSV
  });

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const lines = e.target.value.split('\n').filter(line => line.trim());
    setState(prev => ({ ...prev, inputs: lines }));
  }, []);

  const handleFileUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const lines = text.split('\n').filter(line => line.trim());
      setState(prev => ({ ...prev, inputs: lines }));
      if (textareaRef.current) {
        textareaRef.current.value = lines.join('\n');
      }
    };
    reader.readAsText(file);
  }, []);

  const processBatch = useCallback(async () => {
    if (state.inputs.length === 0) return;

    setState(prev => ({ 
      ...prev, 
      isProcessing: true, 
      progress: 0, 
      results: [] 
    }));

    try {
      const results = await CoordinateUtils.batchProcess(
        state.inputs,
        state.operation,
        (progress) => setState(prev => ({ ...prev, progress }))
      );

      setState(prev => ({ 
        ...prev, 
        results, 
        isProcessing: false, 
        progress: 100 
      }));
    } catch (error) {
      console.error('Batch processing failed:', error);
      setState(prev => ({ 
        ...prev, 
        isProcessing: false, 
        progress: 0 
      }));
    }
  }, [state.inputs, state.operation]);

  const exportResults = useCallback(() => {
    if (state.results.length === 0) return;

    const successfulResults = state.results
      .filter(r => r.success)
      .map(r => r.data);

    if (successfulResults.length === 0) {
      alert('No successful results to export');
      return;
    }

    try {
      const exported = CoordinateUtils.exportData(
        successfulResults,
        state.exportFormat,
        'batch_coordinates'
      );

      const blob = new Blob([exported], { 
        type: state.exportFormat === ExportFormat.JSON ? 'application/json' : 'text/plain' 
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `batch_coordinates.${state.exportFormat}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Export failed. Please try again.');
    }
  }, [state.results, state.exportFormat]);

  const clearAll = useCallback(() => {
    setState(prev => ({ 
      ...prev, 
      inputs: [], 
      results: [], 
      progress: 0 
    }));
    if (textareaRef.current) {
      textareaRef.current.value = '';
    }
  }, []);

  const successCount = state.results.filter(r => r.success).length;
  const errorCount = state.results.filter(r => !r.success).length;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content batch-processor" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            <svg className="modal-icon" viewBox="0 0 24 24" fill="none">
              <path d="M9 12L11 14L15 10M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z" stroke="currentColor" strokeWidth="2"/>
            </svg>
            Batch Processor
          </h2>
          <button className="modal-close" onClick={onClose}>
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2"/>
            </svg>
          </button>
        </div>

        <div className="modal-body">
          {/* Input Section */}
          <div className="batch-section">
            <div className="batch-section-header">
              <h3>Input Coordinates</h3>
              <div className="batch-controls">
                <button 
                  className="btn btn--sm"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <svg className="btn-icon" viewBox="0 0 24 24">
                    <path d="M21 15V19C21 20.1046 20.1046 21 19 21H5C3.89543 21 3 20.1046 3 19V15M17 8L12 3M12 3L7 8M12 3V15" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Upload File
                </button>
                <button className="btn btn--sm" onClick={clearAll}>
                  <svg className="btn-icon" viewBox="0 0 24 24">
                    <path d="M19 7L18.1327 19.1425C18.0579 20.1891 17.187 21 16.1378 21H7.86224C6.81296 21 5.94208 20.1891 5.86732 19.1425L5 7" stroke="currentColor" strokeWidth="2"/>
                  </svg>
                  Clear
                </button>
              </div>
            </div>
            
            <textarea
              ref={textareaRef}
              className="batch-input"
              placeholder="Enter coordinates, one per line:&#10;N45°30'15&quot; W122°40'30&quot;&#10;40.7128, -74.0060&#10;N40 42 46 W74 0 21"
              onChange={handleInputChange}
              rows={8}
            />
            
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.csv"
              style={{ display: 'none' }}
              onChange={handleFileUpload}
            />
            
            <div className="batch-info">
              <span className="batch-count">{state.inputs.length} coordinates</span>
            </div>
          </div>

          {/* Operation Selection */}
          <div className="batch-section">
            <h3>Operation</h3>
            <div className="operation-grid">
              {[
                { value: 'convert', label: 'Convert to Decimal', icon: '🔄' },
                { value: 'validate', label: 'Validate Format', icon: '✓' },
                { value: 'toUTM', label: 'Convert to UTM', icon: '🗺️' },
                { value: 'toDMS', label: 'Convert to DMS', icon: '📐' }
              ].map(op => (
                <label key={op.value} className="operation-option">
                  <input
                    type="radio"
                    name="operation"
                    value={op.value}
                    checked={state.operation === op.value}
                    onChange={(e) => setState(prev => ({ 
                      ...prev, 
                      operation: e.target.value as any 
                    }))}
                  />
                  <span className="operation-card">
                    <span className="operation-icon">{op.icon}</span>
                    <span className="operation-label">{op.label}</span>
                  </span>
                </label>
              ))}
            </div>
          </div>

          {/* Processing */}
          <div className="batch-section">
            <div className="batch-section-header">
              <h3>Process</h3>
              <button 
                className="btn btn--primary"
                onClick={processBatch}
                disabled={state.isProcessing || state.inputs.length === 0}
              >
                {state.isProcessing ? 'Processing...' : 'Start Processing'}
              </button>
            </div>
            
            {state.isProcessing && (
              <div className="progress-section">
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${state.progress}%` }}
                  />
                </div>
                <span className="progress-text">{Math.round(state.progress)}%</span>
              </div>
            )}
          </div>

          {/* Results */}
          {state.results.length > 0 && (
            <div className="batch-section">
              <div className="batch-section-header">
                <h3>Results</h3>
                <div className="result-controls">
                  <select
                    value={state.exportFormat}
                    onChange={(e) => setState(prev => ({ 
                      ...prev, 
                      exportFormat: e.target.value as ExportFormat 
                    }))}
                    className="export-select"
                  >
                    <option value={ExportFormat.CSV}>CSV</option>
                    <option value={ExportFormat.JSON}>JSON</option>
                    <option value={ExportFormat.KML}>KML</option>
                    <option value={ExportFormat.GEOJSON}>GeoJSON</option>
                    <option value={ExportFormat.TXT}>Text</option>
                  </select>
                  <button 
                    className="btn btn--primary"
                    onClick={exportResults}
                    disabled={successCount === 0}
                  >
                    Export Results
                  </button>
                </div>
              </div>
              
              <div className="result-summary">
                <div className="result-stat result-stat--success">
                  <span className="result-stat-value">{successCount}</span>
                  <span className="result-stat-label">Successful</span>
                </div>
                <div className="result-stat result-stat--error">
                  <span className="result-stat-value">{errorCount}</span>
                  <span className="result-stat-label">Errors</span>
                </div>
              </div>

              <div className="result-list">
                {state.results.slice(0, 10).map((result, index) => (
                  <div 
                    key={index} 
                    className={`result-item ${result.success ? 'success' : 'error'}`}
                  >
                    <span className="result-index">{index + 1}</span>
                    <span className="result-content">
                      {result.success 
                        ? JSON.stringify(result.data)
                        : result.error
                      }
                    </span>
                  </div>
                ))}
                {state.results.length > 10 && (
                  <div className="result-more">
                    +{state.results.length - 10} more results...
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
