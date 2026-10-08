import React, { useState, useEffect } from 'react';
import {
  Database,
  RefreshCw,
  Server,
  Play,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Download,
  Copy,
  Check,
  Code,
  Layers,
  Zap,
  Terminal,
  Activity,
  Info,
  Clock,
  ShieldCheck,
  FolderGit2,
  Table,
  Search,
  Plus,
  Edit2,
  Trash2,
  FileCode,
  Save,
  FilePlus,
  Send,
  Eye,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sliders,
  Radio
} from 'lucide-react';
import { api } from '../../../services/api';

type NeextPlayDbTab = 'tables' | 'sql_console' | 'master_files' | 'process_sre';

export const NeextPlaySqlDatabaseManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NeextPlayDbTab>('tables');
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // -------------------------------------------------------------
  // TAB 1: TABLES & RECORDS STATE
  // -------------------------------------------------------------
  const [tablesList, setTablesList] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('operators');
  const [tableData, setTableData] = useState<any>(null);
  const [isTableLoading, setIsTableLoading] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [recordModalMode, setRecordModalMode] = useState<'create' | 'edit' | null>(null);
  const [activeRecord, setActiveRecord] = useState<any>(null);
  const [recordFormData, setRecordFormData] = useState<any>({});
  const [isSavingRecord, setIsSavingRecord] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | number | null>(null);

  // -------------------------------------------------------------
  // TAB 2: SQL CONSOLE STATE
  // -------------------------------------------------------------
  const [sqlQuery, setSqlQuery] = useState<string>("SELECT * FROM operators LIMIT 10;");
  const [isRunningSql, setIsRunningSql] = useState(false);
  const [sqlResult, setSqlResult] = useState<any>(null);

  // -------------------------------------------------------------
  // TAB 3: MASTER BACKEND FILES STATE
  // -------------------------------------------------------------
  const [backendFiles, setBackendFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('neextplay/api.php');
  const [fileContent, setFileContent] = useState<string>('');
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [isSavingFile, setIsSavingFile] = useState(false);
  const [fileSaveFeedback, setFileSaveFeedback] = useState<string | null>(null);
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [newFileContent, setNewFileContent] = useState('<?php\n\n');

  // -------------------------------------------------------------
  // TAB 4: MASTER PROCESS & SRE
  // -------------------------------------------------------------
  const [isRunningProcess, setIsRunningProcess] = useState(false);
  const [processResult, setProcessResult] = useState<any>(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);

  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await api.phpDb.getStatus();
      setStatus(res);
    } catch (e: any) {
      console.warn('Could not fetch PHP database status:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTables = async () => {
    try {
      const res = await api.mysqlDb.getTables('neextplay');
      if (res.tables) {
        setTablesList(res.tables);
        if (res.tables.length > 0 && !res.tables.some(t => t.name === selectedTable)) {
          setSelectedTable(res.tables[0].name);
        }
      }
    } catch (e) {
      console.warn('Error loading neextplay tables:', e);
    }
  };

  const loadTableData = async (table = selectedTable, page = currentPage, search = tableSearch) => {
    setIsTableLoading(true);
    try {
      const res = await api.mysqlDb.getTableRows('neextplay', table, { page, limit: 15, search });
      setTableData(res);
    } catch (e) {
      console.warn('Error loading table rows:', e);
    } finally {
      setIsTableLoading(false);
    }
  };

  const loadBackendFiles = async () => {
    try {
      const res = await api.dbMaster.listFiles();
      if (res.files) {
        // Filter or prioritize neextplay and common files
        setBackendFiles(res.files);
        if (!selectedFile && res.files.length > 0) {
          const npFile = res.files.find((f: any) => f.path.startsWith('neextplay/')) || res.files[0];
          loadFileContent(npFile.path);
        }
      }
    } catch (e) {
      console.warn('Error loading backend files:', e);
    }
  };

  const loadFileContent = async (filePath: string) => {
    setIsFileLoading(true);
    setSelectedFile(filePath);
    setFileSaveFeedback(null);
    try {
      const res = await api.dbMaster.getFile(filePath);
      setFileContent(res.content || '');
    } catch (e: any) {
      alert('Error reading file: ' + (e.message || String(e)));
    } finally {
      setIsFileLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    loadTables();
    loadBackendFiles();
    loadFileContent('neextplay/api.php');
  }, []);

  useEffect(() => {
    if (selectedTable) {
      setCurrentPage(1);
      loadTableData(selectedTable, 1, tableSearch);
    }
  }, [selectedTable]);

  // Save File via Master API
  const handleSaveFile = async () => {
    if (!selectedFile) return;
    setIsSavingFile(true);
    setFileSaveFeedback(null);
    try {
      const res = await api.dbMaster.saveFile(selectedFile, fileContent);
      setFileSaveFeedback(`Saved successfully (${res.size} bytes). ${res.remoteMsg || ''}`);
      await loadBackendFiles();
    } catch (e: any) {
      alert('Failed to save file: ' + (e.message || String(e)));
    } finally {
      setIsSavingFile(false);
    }
  };

  // Create New File via Master API
  const handleCreateNewFile = async () => {
    if (!newFilePath.trim()) return;
    setIsSavingFile(true);
    try {
      await api.dbMaster.saveFile(newFilePath.trim(), newFileContent);
      setIsNewFileModalOpen(false);
      setNewFilePath('');
      await loadBackendFiles();
      loadFileContent(newFilePath.trim());
    } catch (e: any) {
      alert('Failed to create file: ' + (e.message || String(e)));
    } finally {
      setIsSavingFile(false);
    }
  };

  // Delete File via Master API
  const handleDeleteFile = async (path: string) => {
    if (!confirm(`Are you sure you want to delete '${path}' from backend-database?`)) return;
    try {
      await api.dbMaster.deleteFile(path);
      await loadBackendFiles();
      if (selectedFile === path) {
        setSelectedFile('');
        setFileContent('');
      }
    } catch (e: any) {
      alert('Failed to delete file: ' + (e.message || String(e)));
    }
  };

  // Execute SQL Query
  const handleRunSql = async () => {
    if (!sqlQuery.trim()) return;
    setIsRunningSql(true);
    try {
      const res = await api.mysqlDb.runQuery('neextplay', sqlQuery.trim());
      setSqlResult(res);
      if (!/^\s*SELECT/i.test(sqlQuery)) {
        loadTableData();
      }
    } catch (e: any) {
      setSqlResult({ success: false, error: e.message || String(e) });
    } finally {
      setIsRunningSql(false);
    }
  };

  // Save Record (Insert / Edit)
  const handleSaveRecord = async () => {
    setIsSavingRecord(true);
    try {
      const pkField = tableData?.pk || 'id';
      if (recordModalMode === 'create') {
        await api.mysqlDb.insertRow('neextplay', selectedTable, recordFormData);
      } else if (recordModalMode === 'edit') {
        const id = activeRecord[pkField];
        await api.mysqlDb.updateRow('neextplay', selectedTable, id, recordFormData);
      }
      setRecordModalMode(null);
      loadTableData();
    } catch (e: any) {
      alert('Error saving record: ' + (e.message || String(e)));
    } finally {
      setIsSavingRecord(false);
    }
  };

  // Delete Record
  const handleDeleteRecord = async (id: string | number) => {
    try {
      await api.mysqlDb.deleteRow('neextplay', selectedTable, id);
      setDeleteConfirmId(null);
      loadTableData();
    } catch (e: any) {
      alert('Error deleting record: ' + (e.message || String(e)));
    }
  };

  // Run Master Process
  const handleRunProcess = async () => {
    setIsRunningProcess(true);
    try {
      const res = await api.phpDb.runProcess();
      setProcessResult(res);
      setIsProcessModalOpen(true);
      await fetchStatus();
      await loadTables();
    } catch (e: any) {
      alert('Error running process: ' + (e.message || String(e)));
    } finally {
      setIsRunningProcess(false);
    }
  };

  const isConnected = status?.connected ?? false;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-950 border border-indigo-500/30 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-500/10">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                NeextPlay MySQL Database & Master Backend Suite
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase ${
                  isConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                }`}>
                  {isConnected ? '✓ MySQL Backend Online' : 'MySQL Engine Active'}
                </span>
              </h2>
              <p className="text-xs text-slate-300 mt-1">
                Dedicated MySQL B2B Database (<code className="text-cyan-300 font-mono font-bold">neextplay_db</code>) with full Table CRUD, SQL Console, and Master File API Editor.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2.5 shrink-0 flex-wrap">
          <button
            type="button"
            onClick={fetchStatus}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            <span>Check Ping</span>
          </button>

          <button
            type="button"
            onClick={handleRunProcess}
            disabled={isRunningProcess}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 text-white text-xs font-black flex items-center gap-1.5 shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${isRunningProcess ? 'animate-spin' : 'fill-white'}`} />
            <span>{isRunningProcess ? 'Processing...' : 'Run Master Process'}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('tables')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tables'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>MySQL Tables & CRUD (neextplay_db)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sql_console')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'sql_console'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>Interactive SQL Console</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('master_files')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'master_files'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>Master Backend Files (neextplay/*)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('process_sre')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'process_sre'
              ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/20'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <Activity className="w-4 h-4" />
          <span>GLI-19 Compliance & SRE Health</span>
        </button>
      </div>

      {/* =============================================================
          TAB 1: TABLES & RECORDS (CRUD)
          ============================================================= */}
      {activeTab === 'tables' && (
        <div className="space-y-4">
          {/* Table List & Actions Bar */}
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Database:</span>
              <span className="px-3 py-1 rounded-lg bg-cyan-950 border border-cyan-500/40 text-xs font-mono font-bold text-cyan-300">
                neextplay_db
              </span>
            </div>

            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search table rows..."
                  value={tableSearch}
                  onChange={e => {
                    setTableSearch(e.target.value);
                    setCurrentPage(1);
                    loadTableData(selectedTable, 1, e.target.value);
                  }}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setRecordModalMode('create');
                  setActiveRecord(null);
                  setRecordFormData({});
                }}
                className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Record</span>
              </button>
            </div>
          </div>

          {/* Tables Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {tablesList.map(t => {
              const isSelected = selectedTable === t.name;
              return (
                <button
                  key={t.name}
                  type="button"
                  onClick={() => setSelectedTable(t.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-1.5 transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                      : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800'
                  }`}
                >
                  <span>{t.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isSelected ? 'bg-black/20 text-black' : 'bg-slate-950 text-cyan-400'}`}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Data Grid */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
            <div className="p-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <span>Table: <code className="text-cyan-400 font-mono">{selectedTable}</code></span>
                <span className="text-slate-400">({tableData?.total || 0} records)</span>
              </span>

              <button
                type="button"
                onClick={() => loadTableData()}
                className="p-1.5 hover:bg-slate-800 rounded-lg text-slate-300 cursor-pointer"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isTableLoading ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {isTableLoading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-2 text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                <span>Loading records...</span>
              </div>
            ) : !tableData?.rows || tableData.rows.length === 0 ? (
              <div className="p-12 text-center text-slate-400 text-xs">
                No records found in table {selectedTable}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-slate-300">
                  <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-2.5 px-3">Actions</th>
                      {tableData.columns?.map((c: any) => (
                        <th key={c.name} className="py-2.5 px-3 whitespace-nowrap">
                          {c.name} {c.isPrimary && <span className="text-cyan-400 font-bold">[PK]</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {tableData.rows.map((row: any, idx: number) => {
                      const pkVal = row[tableData.pk || 'id'];
                      return (
                        <tr key={idx} className="hover:bg-slate-800/40 transition-colors">
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveRecord(row);
                                  setRecordFormData({ ...row });
                                  setRecordModalMode('edit');
                                }}
                                className="p-1 bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-300 rounded cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(pkVal)}
                                className="p-1 bg-rose-500/20 hover:bg-rose-500/40 text-rose-400 rounded cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </td>
                          {tableData.columns?.map((c: any) => {
                            const val = row[c.name];
                            return (
                              <td key={c.name} className="py-2 px-3 whitespace-nowrap font-mono text-[11px] max-w-xs truncate">
                                {typeof val === 'object' ? JSON.stringify(val) : String(val ?? '')}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {tableData && tableData.totalPages > 1 && (
              <div className="p-3 bg-slate-950 border-t border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  Page {tableData.page} of {tableData.totalPages} (Total {tableData.total})
                </span>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    disabled={tableData.page <= 1}
                    onClick={() => {
                      const prev = tableData.page - 1;
                      setCurrentPage(prev);
                      loadTableData(selectedTable, prev, tableSearch);
                    }}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 disabled:opacity-40 text-white cursor-pointer"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    disabled={tableData.page >= tableData.totalPages}
                    onClick={() => {
                      const next = tableData.page + 1;
                      setCurrentPage(next);
                      loadTableData(selectedTable, next, tableSearch);
                    }}
                    className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800 disabled:opacity-40 text-white cursor-pointer"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =============================================================
          TAB 2: SQL CONSOLE
          ============================================================= */}
      {activeTab === 'sql_console' && (
        <div className="space-y-4">
          <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-cyan-400" />
                <span>Execute SQL Query on <code className="text-cyan-300 font-mono">neextplay_db</code></span>
              </span>

              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSqlQuery("SELECT * FROM operators LIMIT 10;")}
                  className="px-2 py-1 rounded bg-slate-950 text-cyan-300 hover:text-white border border-slate-800 cursor-pointer"
                >
                  operators
                </button>
                <button
                  type="button"
                  onClick={() => setSqlQuery("SELECT * FROM players ORDER BY last_active DESC LIMIT 10;")}
                  className="px-2 py-1 rounded bg-slate-950 text-cyan-300 hover:text-white border border-slate-800 cursor-pointer"
                >
                  players
                </button>
                <button
                  type="button"
                  onClick={() => setSqlQuery("SELECT * FROM round_bets LIMIT 10;")}
                  className="px-2 py-1 rounded bg-slate-950 text-cyan-300 hover:text-white border border-slate-800 cursor-pointer"
                >
                  round_bets
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={sqlQuery}
              onChange={e => setSqlQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-cyan-300 focus:outline-none focus:border-cyan-400"
              placeholder="SELECT * FROM operators WHERE status='ACTIVE' LIMIT 10;"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleRunSql}
                disabled={isRunningSql || !sqlQuery.trim()}
                className="px-5 py-2.5 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:brightness-110 text-white font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
              >
                {isRunningSql ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-white" />}
                <span>Execute SQL Query</span>
              </button>
            </div>
          </div>

          {/* SQL Output Results */}
          {sqlResult && (
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-slate-800">
                <span className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Execution Result ({sqlResult.executionTimeMs || 0}ms)</span>
                </span>
                {sqlResult.totalRows !== undefined && (
                  <span className="text-slate-400 font-mono">{sqlResult.totalRows} rows returned</span>
                )}
              </div>

              {sqlResult.error ? (
                <div className="p-3 bg-rose-950/60 border border-rose-500/40 text-rose-300 rounded-xl text-xs font-mono">
                  Error: {sqlResult.error}
                </div>
              ) : sqlResult.rows && sqlResult.rows.length > 0 ? (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs text-slate-300">
                    <thead className="bg-slate-950 text-slate-400 font-mono uppercase text-[10px] sticky top-0">
                      <tr>
                        {sqlResult.columns?.map((c: string) => (
                          <th key={c} className="py-2 px-3 whitespace-nowrap">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 font-mono text-[11px]">
                      {sqlResult.rows.map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-slate-800/40">
                          {sqlResult.columns?.map((c: string) => (
                            <td key={c} className="py-1.5 px-3 whitespace-nowrap max-w-xs truncate">
                              {typeof r[c] === 'object' ? JSON.stringify(r[c]) : String(r[c] ?? '')}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="p-3 bg-emerald-950/40 text-emerald-300 rounded-xl text-xs font-mono">
                  {sqlResult.message || 'Query executed successfully with zero result rows.'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =============================================================
          TAB 3: MASTER BACKEND FILES (NEEXTPLAY)
          ============================================================= */}
      {activeTab === 'master_files' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Left Files List */}
            <div className="p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FolderGit2 className="w-4 h-4 text-cyan-400" />
                  <span>NeextPlay Backend Files</span>
                </span>

                <button
                  type="button"
                  onClick={() => setIsNewFileModalOpen(true)}
                  className="p-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded cursor-pointer"
                  title="Create New File"
                >
                  <FilePlus className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-1 max-h-[500px] overflow-y-auto pr-1">
                {backendFiles.map(f => {
                  const isCurrent = selectedFile === f.path;
                  return (
                    <div
                      key={f.path}
                      onClick={() => loadFileContent(f.path)}
                      className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer transition-all ${
                        isCurrent
                          ? 'bg-cyan-500 text-slate-950 font-black shadow-md'
                          : 'bg-slate-950 hover:bg-slate-850 text-slate-300 border border-slate-800/80'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FileCode className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-black' : 'text-cyan-400'}`} />
                        <span className="truncate">{f.path}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <span className={`text-[10px] font-mono ${isCurrent ? 'text-black/70' : 'text-slate-500'}`}>
                          {f.lineCount}L
                        </span>
                        {!['index.php', 'process.php', 'common/cors.php', 'common/db_helper.php', 'neextplay/api.php'].includes(f.path) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(f.path);
                            }}
                            className="p-0.5 hover:text-rose-400 text-slate-500 cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Right Editor */}
            <div className="lg:col-span-3 p-4 bg-slate-900 rounded-2xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-cyan-300">
                    {selectedFile || 'No file selected'}
                  </span>
                  {fileSaveFeedback && (
                    <span className="text-[11px] text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> {fileSaveFeedback}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => selectedFile && loadFileContent(selectedFile)}
                    disabled={isFileLoading || !selectedFile}
                    className="p-1.5 bg-slate-950 hover:bg-slate-850 text-slate-300 rounded-lg border border-slate-800 cursor-pointer"
                    title="Reload"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFileLoading ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveFile}
                    disabled={isSavingFile || !selectedFile}
                    className="px-4 py-1.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-cyan-500/20 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingFile ? 'Saving...' : 'Save File (Master API)'}</span>
                  </button>
                </div>
              </div>

              {isFileLoading ? (
                <div className="h-96 flex flex-col items-center justify-center text-xs text-slate-400">
                  <RefreshCw className="w-6 h-6 animate-spin text-cyan-400 mb-2" />
                  <span>Loading file content...</span>
                </div>
              ) : (
                <textarea
                  rows={20}
                  value={fileContent}
                  onChange={e => setFileContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-cyan-100 focus:outline-none focus:border-cyan-400 leading-relaxed resize-y"
                  spellCheck={false}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* =============================================================
          TAB 4: GLI-19 COMPLIANCE & SRE HEALTH
          ============================================================= */}
      {activeTab === 'process_sre' && (
        <div className="space-y-4">
          <div className="p-5 bg-slate-900 border border-slate-800 rounded-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-bold text-white text-sm flex items-center gap-2">
                <Database className="w-4 h-4 text-emerald-400" />
                MySQL Database Infrastructure & GLI-19 Certified Engine
              </h3>
              <span className="px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-mono font-bold">
                neextplay_db Live
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">Database Engine</span>
                <p className="text-sm font-bold text-emerald-400">MySQL Server (InnoDB)</p>
                <span className="text-[10px] text-slate-500 font-mono">neextplay_db</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">Database Collation</span>
                <p className="text-sm font-bold text-indigo-400 font-mono">utf8mb4_unicode_ci</p>
                <span className="text-[10px] text-slate-500">Full UTF-8 Multilingual</span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-1">
                <span className="text-[11px] text-slate-400">RNG Certification</span>
                <p className="text-sm font-bold text-amber-400">GLI-19 Compliant</p>
                <span className="text-[10px] text-slate-500">Provably Fair SHA-512</span>
              </div>
            </div>

            <div className="space-y-2 text-xs">
              <div className="p-3 bg-slate-950 rounded-xl flex justify-between items-center border border-slate-800/80">
                <span className="text-slate-300">Connected B2B Tables</span>
                <span className="text-emerald-400 font-bold font-mono">
                  operators, api_keys, players, game_definitions, round_bets, ledger_entries, win_control_configs, audit_logs
                </span>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl flex justify-between items-center border border-slate-800/80">
                <span className="text-slate-300">Master Process Runner</span>
                <button
                  type="button"
                  onClick={handleRunProcess}
                  disabled={isRunningProcess}
                  className="px-3 py-1 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Play className="w-3 h-3 fill-white" />
                  <span>Run Auto-Migration</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================
          MODAL 1: ADD / EDIT RECORD MODAL
          ============================================================= */}
      {recordModalMode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-slate-900 border border-cyan-500/50 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Table className="w-4 h-4 text-cyan-400" />
                <span>{recordModalMode === 'create' ? 'Add New Record' : 'Edit Record'} ({selectedTable})</span>
              </h3>
              <button
                type="button"
                onClick={() => setRecordModalMode(null)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              {tableData?.columns?.map((c: any) => {
                const val = recordFormData[c.name] ?? '';
                const isPk = c.isPrimary && recordModalMode === 'edit';
                return (
                  <div key={c.name}>
                    <label className="text-xs font-bold text-slate-300 block mb-1">
                      {c.name} {c.isPrimary && <span className="text-cyan-400">[Primary Key]</span>}:
                    </label>
                    <input
                      type="text"
                      disabled={isPk}
                      value={typeof val === 'object' ? JSON.stringify(val) : String(val)}
                      onChange={e => {
                        setRecordFormData({
                          ...recordFormData,
                          [c.name]: e.target.value
                        });
                      }}
                      className="w-full bg-slate-950 border border-slate-800 disabled:opacity-50 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setRecordModalMode(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSaveRecord}
                disabled={isSavingRecord}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSavingRecord && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>Save Record</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================
          MODAL 2: CONFIRM DELETE RECORD
          ============================================================= */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-rose-500/50 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto border border-rose-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">Delete Record?</h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to permanently delete record <code className="text-rose-400 font-mono">{String(deleteConfirmId)}</code> from <code className="text-cyan-400">{selectedTable}</code>?
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 rounded-xl bg-white/10 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteRecord(deleteConfirmId)}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-black text-xs cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================
          MODAL 3: CREATE NEW BACKEND FILE
          ============================================================= */}
      {isNewFileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-slate-900 border border-cyan-500/50 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-cyan-400" />
                <span>Create New Backend File</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewFileModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Relative File Path (e.g. neextplay/custom_api.php):
                </label>
                <input
                  type="text"
                  placeholder="neextplay/my_script.php"
                  value={newFilePath}
                  onChange={e => setNewFilePath(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-300 block mb-1">
                  Initial Code Content:
                </label>
                <textarea
                  rows={6}
                  value={newFileContent}
                  onChange={e => setNewFileContent(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs font-mono text-cyan-200 focus:outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsNewFileModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-slate-300 font-bold text-xs cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateNewFile}
                disabled={isSavingFile || !newFilePath.trim()}
                className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs cursor-pointer disabled:opacity-50"
              >
                Create File
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================
          MODAL 4: PROCESS RESULTS MODAL
          ============================================================= */}
      {isProcessModalOpen && processResult && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-slate-900 border border-cyan-500/50 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>Master Process Execution Result</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsProcessModalOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
              {processResult.message || 'Database auto-process and migrations completed successfully!'}
            </div>

            <pre className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-mono text-slate-300 overflow-x-auto max-h-72">
              {JSON.stringify(processResult, null, 2)}
            </pre>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsProcessModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
