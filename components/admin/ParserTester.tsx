"use client";

import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';

interface ParserMetadata {
  version: string;
  name: string;
  description: string;
}

interface CellDebugInfo {
  row: number;
  col: number;
  rawValue: string;
  interpretation: {
    type: string;
    parsedValue: any;
    confidence: number;
    matchedEntity?: {
      id?: string;
      name: string;
      alias?: string;
      source?: string;
    };
  };
  warnings: string[];
  errors: string[];
  context?: {
    section?: string;
    group?: string;
    date?: string;
  };
}

interface ParseStats {
  totalCells: number;
  parsedCells: number;
  emptyCells: number;
  errorCells: number;
  totalEntries: number;
  successfulParses: number;
  failedParses: number;
  unknownInstructors: Array<{
    value: string;
    occurrences: number;
    contexts: string[];
  }>;
  unknownSubjects: Array<{
    value: string;
    occurrences: number;
    contexts: string[];
  }>;
  processingTime: number;
}

interface ParseResult {
  schedule: {
    sections: Array<{
      kierunek: string;
      stopien: string;
      rok: number;
      semestr: number;
      tryb: string;
      groups: string[];
      entryCount: number;
    }>;
    lastUpdated: string;
  };
  stats: ParseStats;
  debugInfo: CellDebugInfo[];
  parserVersion: string;
  parserName: string;
}

export function ParserTester() {
  const [parsers, setParsers] = useState<ParserMetadata[]>([]);
  const [selectedParser, setSelectedParser] = useState<string>('');
  const [file, setFile] = useState<File | null>(null);
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<ParseResult | null>(null);
  const [selectedCell, setSelectedCell] = useState<CellDebugInfo | null>(null);
  const [excelData, setExcelData] = useState<any[][] | null>(null);
  const [activeTab, setActiveTab] = useState<'stats' | 'visualization' | 'unknown'>('stats');

  useEffect(() => {
    loadParsers();
  }, []);

  const loadParsers = async () => {
    try {
      const res = await fetch('/api/admin/parser-test');
      const data = await res.json();
      if (data.success) {
        setParsers(data.parsers);
        if (data.parsers.length > 0) {
          setSelectedParser(data.parsers[0].version);
        }
      }
    } catch (error) {
      toast.error('Błąd ładowania parserów');
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setResult(null);

      // Read Excel for visualization
      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const data: any[][] = XLSX.utils.sheet_to_json(firstSheet, {
          header: 1,
          defval: '',
          raw: false,
        });
        setExcelData(data);
      } catch (error) {
        toast.error('Błąd odczytu pliku Excel');
      }
    }
  };

  const handleTest = async () => {
    if (!file) {
      toast.error('Wybierz plik');
      return;
    }

    setTesting(true);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('parserVersion', selectedParser);

      const res = await fetch('/api/admin/parser-test', {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        setResult(data.result);
        toast.success('Parser przetestowany!');
      } else {
        toast.error(data.error || 'Błąd parsowania');
      }
    } catch (error) {
      console.error('Error testing parser:', error);
      toast.error('Błąd testowania parsera');
    } finally {
      setTesting(false);
    }
  };

  const getCellColor = (row: number, col: number): string => {
    if (!result) return 'bg-white';

    const cellInfo = result.debugInfo.find(d => d.row === row && d.col === col);
    if (!cellInfo) return 'bg-gray-50';

    if (cellInfo.errors.length > 0) return 'bg-red-100';
    if (cellInfo.warnings.length > 0) return 'bg-yellow-100';

    const confidence = cellInfo.interpretation.confidence;
    if (confidence >= 0.9) return 'bg-green-100';
    if (confidence >= 0.7) return 'bg-blue-100';
    if (confidence >= 0.5) return 'bg-yellow-50';
    return 'bg-gray-100';
  };

  const getCellInfo = (row: number, col: number): CellDebugInfo | null => {
    if (!result) return null;
    return result.debugInfo.find(d => d.row === row && d.col === col) || null;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">Parser Tester</h2>
        <p className="text-sm text-gray-600 mb-4">
          Test różnych wersji parsera i zobacz jak interpretują komórki Excel
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Wybierz parser
            </label>
            <select
              value={selectedParser}
              onChange={(e) => setSelectedParser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500"
            >
              {parsers.map(parser => (
                <option key={parser.version} value={parser.version}>
                  {parser.name} (v{parser.version})
                </option>
              ))}
            </select>
            {parsers.find(p => p.version === selectedParser) && (
              <p className="text-xs text-gray-500 mt-1">
                {parsers.find(p => p.version === selectedParser)?.description}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Plik Excel
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 text-gray-900 focus:outline-none focus:border-blue-500"
            />
          </div>
        </div>

        <button
          onClick={handleTest}
          disabled={!file || testing}
          className="mt-4 px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 transition-colors disabled:bg-gray-400"
        >
          {testing ? 'Testowanie...' : 'Testuj Parser'}
        </button>
      </div>

      {/* Results */}
      {result && (
        <>
          {/* Tabs */}
          <div className="bg-white border border-gray-200">
            <div className="flex border-b border-gray-200">
              <button
                onClick={() => setActiveTab('stats')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'stats'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Statystyki
              </button>
              <button
                onClick={() => setActiveTab('visualization')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'visualization'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Wizualizacja
              </button>
              <button
                onClick={() => setActiveTab('unknown')}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === 'unknown'
                    ? 'text-blue-600 border-b-2 border-blue-600'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Nierozpoznane ({result.stats.unknownInstructors.length + result.stats.unknownSubjects.length})
              </button>
            </div>

            {/* Stats Tab */}
            {activeTab === 'stats' && (
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Statystyki parsowania - {result.parserName}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-blue-50 p-4 border border-blue-200">
                    <div className="text-2xl font-bold text-blue-900">{result.stats.totalEntries}</div>
                    <div className="text-sm text-blue-700">Wpisy</div>
                  </div>
                  <div className="bg-green-50 p-4 border border-green-200">
                    <div className="text-2xl font-bold text-green-900">{result.stats.parsedCells}</div>
                    <div className="text-sm text-green-700">Sparsowane komórki</div>
                  </div>
                  <div className="bg-red-50 p-4 border border-red-200">
                    <div className="text-2xl font-bold text-red-900">{result.stats.errorCells}</div>
                    <div className="text-sm text-red-700">Błędy</div>
                  </div>
                  <div className="bg-purple-50 p-4 border border-purple-200">
                    <div className="text-2xl font-bold text-purple-900">{result.stats.processingTime}ms</div>
                    <div className="text-sm text-purple-700">Czas przetwarzania</div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="font-bold text-gray-900 mb-3">Sekcje</h4>
                  <div className="space-y-2">
                    {result.schedule.sections.map((section, idx) => (
                      <div key={idx} className="p-3 bg-gray-50 border border-gray-200 text-sm">
                        <span className="font-medium">
                          {section.kierunek} {section.stopien}st. R{section.rok} S{section.semestr} ({section.tryb})
                        </span>
                        <span className="text-gray-600 ml-2">
                          - {section.entryCount} wpisów, grupy: {section.groups.join(', ')}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Visualization Tab */}
            {activeTab === 'visualization' && excelData && (
              <div className="p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-4">Wizualizacja parsowania</h3>
                <div className="mb-4 p-3 bg-gray-50 border border-gray-200 text-sm">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-green-100 border border-gray-300"></div>
                      <span>Wysokie zaufanie (&gt;90%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-blue-100 border border-gray-300"></div>
                      <span>Średnie zaufanie (70-90%)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-yellow-100 border border-gray-300"></div>
                      <span>Niskie zaufanie lub ostrzeżenia</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 bg-red-100 border border-gray-300"></div>
                      <span>Błędy</span>
                    </div>
                  </div>
                </div>
                <div className="overflow-auto max-h-[600px] border border-gray-200">
                  <table className="text-xs">
                    <tbody>
                      {excelData.map((row, rowIdx) => (
                        <tr key={rowIdx}>
                          {row.map((cell, colIdx) => {
                            const cellInfo = getCellInfo(rowIdx, colIdx);
                            return (
                              <td
                                key={colIdx}
                                className={`border border-gray-300 px-2 py-1 cursor-pointer hover:opacity-75 ${getCellColor(rowIdx, colIdx)}`}
                                onClick={() => cellInfo && setSelectedCell(cellInfo)}
                                title={cellInfo ? `${cellInfo.interpretation.type} (${Math.round(cellInfo.interpretation.confidence * 100)}%)` : ''}
                              >
                                {String(cell || '').substring(0, 20)}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Unknown Tab */}
            {activeTab === 'unknown' && (
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Nierozpoznani wykładowcy ({result.stats.unknownInstructors.length})
                    </h3>
                    {result.stats.unknownInstructors.length === 0 ? (
                      <p className="text-sm text-gray-500">Wszyscy wykładowcy rozpoznani ✓</p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {result.stats.unknownInstructors.map((instructor, idx) => (
                          <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1">
                                <div className="font-mono text-sm text-gray-900">{instructor.value}</div>
                                <div className="text-xs text-gray-600 mt-1">
                                  Wystąpień: {instructor.occurrences} | Konteksty: {instructor.contexts.slice(0, 2).join(', ')}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const data = {
                                    type: 'unknown_instructor',
                                    value: instructor.value,
                                    occurrences: instructor.occurrences,
                                    contexts: instructor.contexts,
                                  };
                                  navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                                  toast.success('Skopiowano');
                                }}
                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs transition-colors"
                                title="Kopiuj dane"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4">
                      Nierozpoznane przedmioty ({result.stats.unknownSubjects.length})
                    </h3>
                    {result.stats.unknownSubjects.length === 0 ? (
                      <p className="text-sm text-gray-500">Wszystkie przedmioty rozpoznane ✓</p>
                    ) : (
                      <div className="space-y-2 max-h-96 overflow-y-auto">
                        {result.stats.unknownSubjects.map((subject, idx) => (
                          <div key={idx} className="p-3 bg-yellow-50 border border-yellow-200">
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1">
                                <div className="font-mono text-sm text-gray-900">{subject.value}</div>
                                <div className="text-xs text-gray-600 mt-1">
                                  Wystąpień: {subject.occurrences} | Konteksty: {subject.contexts.slice(0, 2).join(', ')}
                                </div>
                              </div>
                              <button
                                onClick={() => {
                                  const data = {
                                    type: 'unknown_subject',
                                    value: subject.value,
                                    occurrences: subject.occurrences,
                                    contexts: subject.contexts,
                                  };
                                  navigator.clipboard.writeText(JSON.stringify(data, null, 2));
                                  toast.success('Skopiowano');
                                }}
                                className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs transition-colors"
                                title="Kopiuj dane"
                              >
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* Cell Details Modal */}
      {selectedCell && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-gray-200 w-full max-w-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-gray-900">
                Szczegóły komórki [{selectedCell.row}, {selectedCell.col}]
              </h3>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const debugData = {
                      position: { row: selectedCell.row, col: selectedCell.col },
                      rawValue: selectedCell.rawValue,
                      interpretation: {
                        type: selectedCell.interpretation.type,
                        confidence: selectedCell.interpretation.confidence,
                        parsedValue: selectedCell.interpretation.parsedValue,
                        matchedEntity: selectedCell.interpretation.matchedEntity,
                      },
                      warnings: selectedCell.warnings,
                      errors: selectedCell.errors,
                      context: selectedCell.context,
                    };
                    navigator.clipboard.writeText(JSON.stringify(debugData, null, 2));
                    toast.success('Skopiowano do schowka');
                  }}
                  className="px-3 py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm transition-colors flex items-center gap-1"
                  title="Kopiuj dane debugowania"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  COPY
                </button>
                <button
                  onClick={() => setSelectedCell(null)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Wartość</label>
                <div className="mt-1 p-2 bg-gray-50 border border-gray-200 font-mono text-sm">
                  {selectedCell.rawValue}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-700">Interpretacja</label>
                <div className="mt-1 p-2 bg-gray-50 border border-gray-200 text-sm">
                  <div>Typ: <span className="font-mono">{selectedCell.interpretation.type}</span></div>
                  <div>Zaufanie: <span className="font-mono">{Math.round(selectedCell.interpretation.confidence * 100)}%</span></div>
                </div>
              </div>

              {selectedCell.interpretation.matchedEntity && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Dopasowana encja</label>
                  <div className="mt-1 p-2 bg-blue-50 border border-blue-200 text-sm">
                    <div>Nazwa: {selectedCell.interpretation.matchedEntity.name}</div>
                    {selectedCell.interpretation.matchedEntity.alias && (
                      <div>Alias: {selectedCell.interpretation.matchedEntity.alias}</div>
                    )}
                    {selectedCell.interpretation.matchedEntity.source && (
                      <div>Źródło: {selectedCell.interpretation.matchedEntity.source}</div>
                    )}
                  </div>
                </div>
              )}

              {selectedCell.warnings.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Ostrzeżenia</label>
                  <div className="mt-1 space-y-1">
                    {selectedCell.warnings.map((warning, idx) => (
                      <div key={idx} className="p-2 bg-yellow-50 border border-yellow-200 text-sm">
                        {warning}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedCell.errors.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-gray-700">Błędy</label>
                  <div className="mt-1 space-y-1">
                    {selectedCell.errors.map((error, idx) => (
                      <div key={idx} className="p-2 bg-red-50 border border-red-200 text-sm">
                        {error}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
