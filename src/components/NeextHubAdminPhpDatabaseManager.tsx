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
  Filter
} from 'lucide-react';
import { api } from '../services/api';

type ManagerTab = 'tables' | 'sql_runner' | 'files_master' | 'process' | 'schema';

export const NeextHubAdminPhpDatabaseManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ManagerTab>('tables');
  const [status, setStatus] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // -------------------------------------------------------------
  // TAB 1: TABLES & RECORDS STATE
  // -------------------------------------------------------------
  const [selectedDb, setSelectedDb] = useState<'bengalbet' | 'neextplay'>('bengalbet');
  const [tablesList, setTablesList] = useState<any[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('users');
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
  // TAB 2: SQL RUNNER STATE
  // -------------------------------------------------------------
  const [sqlQuery, setSqlQuery] = useState<string>("SELECT * FROM users LIMIT 10;");
  const [isRunningSql, setIsRunningSql] = useState(false);
  const [sqlResult, setSqlResult] = useState<any>(null);

  // -------------------------------------------------------------
  // TAB 3: MASTER BACKEND FILES STATE
  // -------------------------------------------------------------
  const [backendFiles, setBackendFiles] = useState<any[]>([]);
  const [selectedFile, setSelectedFile] = useState<string>('bengalbet/api.php');
  const [fileContent, setFileContent] = useState<string>('');
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [isSavingFile, setIsSavingFile] = useState(false);
  const [fileSaveFeedback, setFileSaveFeedback] = useState<string | null>(null);
  const [isNewFileModalOpen, setIsNewFileModalOpen] = useState(false);
  const [newFilePath, setNewFilePath] = useState('');
  const [newFileContent, setNewFileContent] = useState('<?php\n\n');

  // -------------------------------------------------------------
  // TAB 4: MASTER PROCESS STATE
  // -------------------------------------------------------------
  const [customUrl, setCustomUrl] = useState('https://deserver.neexthub.site/backend-database');
  const [isSavingUrl, setIsSavingUrl] = useState(false);
  const [isRunningProcess, setIsRunningProcess] = useState(false);
  const [processResult, setProcessResult] = useState<any>(null);
  const [isProcessModalOpen, setIsProcessModalOpen] = useState(false);

  // =============================================================
  // FETCH STATUS & INITIAL LOAD
  // =============================================================
  const fetchStatus = async () => {
    setIsLoading(true);
    try {
      const res = await api.phpDb.getStatus();
      setStatus(res);
      if (res.baseUrl) setCustomUrl(res.baseUrl);
    } catch (e: any) {
      console.warn('Could not fetch PHP database status:', e);
    } finally {
      setIsLoading(false);
    }
  };

  const loadTables = async (db = selectedDb) => {
    try {
      const res = await api.mysqlDb.getTables(db);
      if (res.tables) {
        setTablesList(res.tables);
        if (res.tables.length > 0 && !res.tables.some(t => t.name === selectedTable)) {
          setSelectedTable(res.tables[0].name);
        }
      }
    } catch (e) {
      console.warn('Error loading tables:', e);
    }
  };

  const loadTableData = async (table = selectedTable, page = currentPage, search = tableSearch) => {
    setIsTableLoading(true);
    try {
      const res = await api.mysqlDb.getTableRows(selectedDb, table, { page, limit: 15, search });
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
        setBackendFiles(res.files);
        if (!selectedFile && res.files.length > 0) {
          loadFileContent(res.files[0].path);
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
    loadTables(selectedDb);
    loadBackendFiles();
  }, []);

  useEffect(() => {
    loadTables(selectedDb);
  }, [selectedDb]);

  useEffect(() => {
    if (selectedTable) {
      setCurrentPage(1);
      loadTableData(selectedTable, 1, tableSearch);
    }
  }, [selectedTable, selectedDb]);

  // Handle Save File via Master API
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

  // Handle Create New File via Master API
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

  // Handle Delete File via Master API
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
      const res = await api.mysqlDb.runQuery(selectedDb, sqlQuery.trim());
      setSqlResult(res);
      // Refresh current table if modified
      if (!/^\s*SELECT/i.test(sqlQuery)) {
        loadTableData();
      }
    } catch (e: any) {
      setSqlResult({ success: false, error: e.message || String(e) });
    } finally {
      setIsRunningSql(false);
    }
  };

  // Handle Save Record (Insert / Edit)
  const handleSaveRecord = async () => {
    setIsSavingRecord(true);
    try {
      const pkField = tableData?.pk || 'id';
      if (recordModalMode === 'create') {
        await api.mysqlDb.insertRow(selectedDb, selectedTable, recordFormData);
      } else if (recordModalMode === 'edit') {
        const id = activeRecord[pkField];
        await api.mysqlDb.updateRow(selectedDb, selectedTable, id, recordFormData);
      }
      setRecordModalMode(null);
      loadTableData();
    } catch (e: any) {
      alert('Error saving record: ' + (e.message || String(e)));
    } finally {
      setIsSavingRecord(false);
    }
  };

  // Handle Delete Record
  const handleDeleteRecord = async (id: string | number) => {
    try {
      await api.mysqlDb.deleteRow(selectedDb, selectedTable, id);
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

  // Save Custom PHP URL
  const handleSaveUrl = async () => {
    if (!customUrl.trim()) return;
    setIsSavingUrl(true);
    try {
      await api.phpDb.updateConfig(customUrl.trim());
      await fetchStatus();
    } catch (e: any) {
      alert(e.message || 'Failed to update URL');
    } finally {
      setIsSavingUrl(false);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const isConnected = status?.connected ?? false;

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-6 rounded-3xl bg-gradient-to-r from-[#061e14] via-[#09291b] to-[#04160e] border border-emerald-500/30 shadow-2xl flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-yellow-400/20 border border-yellow-400/40 flex items-center justify-center text-yellow-400 shadow-lg shadow-yellow-500/10">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white flex items-center gap-2">
                BengalBet MySQL Database & Master Backend Hub
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-mono font-bold uppercase ${
                  isConnected ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {isConnected ? '✓ MySQL Backend Online' : 'MySQL Engine Active'}
                </span>
              </h2>
              <p className="text-xs text-emerald-300/80 mt-1">
                Pure MySQL Database Architecture (<code className="text-yellow-300">bengalbet_db</code> & <code className="text-cyan-300">neextplay_db</code>) with full Table CRUD, Interactive SQL Runner, and Master File API Editor.
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
            className="px-3.5 py-2 rounded-xl bg-emerald-950/80 hover:bg-emerald-900 border border-emerald-600/40 text-emerald-200 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-yellow-400' : ''}`} />
            <span>চেক স্ট্যাটাস</span>
          </button>

          <button
            type="button"
            onClick={handleRunProcess}
            disabled={isRunningProcess}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-300 hover:to-amber-400 text-black text-xs font-black flex items-center gap-1.5 shadow-lg shadow-yellow-400/20 transition-all cursor-pointer"
          >
            <Play className={`w-3.5 h-3.5 ${isRunningProcess ? 'animate-spin' : 'fill-black'}`} />
            <span>{isRunningProcess ? 'প্রসেসিং হচ্ছে...' : 'রান মাস্টার প্রসেস'}</span>
          </button>
        </div>
      </div>

      {/* 2. Main Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-emerald-800/40 pb-2 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('tables')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'tables'
              ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20'
              : 'text-emerald-300 hover:text-white hover:bg-emerald-950/60'
          }`}
        >
          <Table className="w-4 h-4" />
          <span>MySQL টেবিল ও রেকর্ডস (CRUD)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('sql_runner')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'sql_runner'
              ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20'
              : 'text-emerald-300 hover:text-white hover:bg-emerald-950/60'
          }`}
        >
          <Terminal className="w-4 h-4" />
          <span>ইন্টারেক্টিভ SQL কনসোল</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('files_master')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'files_master'
              ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20'
              : 'text-emerald-300 hover:text-white hover:bg-emerald-950/60'
          }`}
        >
          <FolderGit2 className="w-4 h-4" />
          <span>মাস্টার ফাইল এডিটর (Backend Files)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('process')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'process'
              ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20'
              : 'text-emerald-300 hover:text-white hover:bg-emerald-950/60'
          }`}
        >
          <Server className="w-4 h-4" />
          <span>মাস্টার প্রসেস ও সার্ভার স্ট্যাটাস</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('schema')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
            activeTab === 'schema'
              ? 'bg-yellow-400 text-black shadow-lg shadow-yellow-400/20'
              : 'text-emerald-300 hover:text-white hover:bg-emerald-950/60'
          }`}
        >
          <Code className="w-4 h-4" />
          <span>SQL স্কিমা ফাইল</span>
        </button>
      </div>

      {/* =============================================================
          TAB 1: TABLES & RECORDS (CRUD)
          ============================================================= */}
      {activeTab === 'tables' && (
        <div className="space-y-4">
          {/* Database Switcher & Table List Bar */}
          <div className="p-4 bg-[#09291b] rounded-2xl border border-emerald-700/40 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-gray-300">ডাটাবেস সিলেক্ট:</span>
              <div className="flex items-center gap-1.5 bg-[#051c13] p-1 rounded-xl border border-emerald-800">
                <button
                  type="button"
                  onClick={() => setSelectedDb('bengalbet')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    selectedDb === 'bengalbet' ? 'bg-yellow-400 text-black' : 'text-emerald-300 hover:text-white'
                  }`}
                >
                  🐬 bengalbet_db
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedDb('neextplay')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all ${
                    selectedDb === 'neextplay' ? 'bg-cyan-400 text-black' : 'text-emerald-300 hover:text-white'
                  }`}
                >
                  🎮 neextplay_db
                </button>
              </div>
            </div>

            {/* Quick Search & Add Row */}
            <div className="flex items-center gap-2.5 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="টেবিলে সার্চ করুন..."
                  value={tableSearch}
                  onChange={e => {
                    setTableSearch(e.target.value);
                    setCurrentPage(1);
                    loadTableData(selectedTable, 1, e.target.value);
                  }}
                  className="w-full bg-[#051c13] border border-emerald-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-yellow-400"
                />
              </div>

              <button
                type="button"
                onClick={() => {
                  setRecordModalMode('create');
                  setActiveRecord(null);
                  setRecordFormData({});
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>নতুন রেকর্ড যোগ</span>
              </button>
            </div>
          </div>

          {/* Tables Pills Bar */}
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
                      ? 'bg-yellow-400 text-black shadow-md'
                      : 'bg-[#09291b] hover:bg-[#0d3825] text-emerald-300 border border-emerald-800/60'
                  }`}
                >
                  <span>{t.name}</span>
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${isSelected ? 'bg-black/20 text-black' : 'bg-emerald-950 text-emerald-400'}`}>
                    {t.count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Table Data Grid */}
          <div className="bg-[#09291b] rounded-2xl border border-emerald-700/40 overflow-hidden shadow-xl">
            <div className="p-3 bg-[#061e14] border-b border-emerald-800/80 flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-2">
                <span>টেবিল: <code className="text-yellow-400 font-mono">{selectedTable}</code></span>
                <span className="text-gray-400">({tableData?.total || 0} টি রেকর্ড)</span>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => loadTableData()}
                  className="p-1.5 hover:bg-emerald-900 rounded-lg text-emerald-300"
                  title="রিফ্রেশ"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTableLoading ? 'animate-spin' : ''}`} />
                </button>
              </div>
            </div>

            {isTableLoading ? (
              <div className="p-12 flex flex-col items-center justify-center gap-2 text-emerald-300 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-yellow-400" />
                <span>ডাটা লোড হচ্ছে...</span>
              </div>
            ) : !tableData?.rows || tableData.rows.length === 0 ? (
              <div className="p-12 text-center text-gray-400 text-xs">
                কোনো রেকর্ড পাওয়া যায়নি
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-gray-300">
                  <thead className="bg-[#051a12] text-gray-400 font-mono uppercase text-[10px] border-b border-emerald-800/60">
                    <tr>
                      <th className="py-2.5 px-3">অ্যাকশন</th>
                      {tableData.columns?.map((c: any) => (
                        <th key={c.name} className="py-2.5 px-3 whitespace-nowrap">
                          {c.name} {c.isPrimary && <span className="text-yellow-400 font-bold">[PK]</span>}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-emerald-900/40">
                    {tableData.rows.map((row: any, idx: number) => {
                      const pkVal = row[tableData.pk || 'id'];
                      return (
                        <tr key={idx} className="hover:bg-emerald-950/40 transition-colors">
                          <td className="py-2 px-3 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => {
                                  setActiveRecord(row);
                                  setRecordFormData({ ...row });
                                  setRecordModalMode('edit');
                                }}
                                className="p-1 bg-yellow-400/20 hover:bg-yellow-400/40 text-yellow-300 rounded cursor-pointer"
                                title="এডিট"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeleteConfirmId(pkVal)}
                                className="p-1 bg-red-500/20 hover:bg-red-500/40 text-red-400 rounded cursor-pointer"
                                title="মুছে ফেলুন"
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
              <div className="p-3 bg-[#061e14] border-t border-emerald-800/60 flex items-center justify-between text-xs">
                <span className="text-gray-400">
                  পৃষ্ঠা {tableData.page} এর {tableData.totalPages} (মোট {tableData.total})
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
                    className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 disabled:opacity-40 text-white cursor-pointer"
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
                    className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-800 disabled:opacity-40 text-white cursor-pointer"
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
          TAB 2: SQL RUNNER
          ============================================================= */}
      {activeTab === 'sql_runner' && (
        <div className="space-y-4">
          <div className="p-4 bg-[#09291b] rounded-2xl border border-emerald-700/40 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Terminal className="w-4 h-4 text-yellow-400" />
                <span>MySQL কোয়েরি এক্সিকিউটর ({selectedDb === 'bengalbet' ? 'bengalbet_db' : 'neextplay_db'})</span>
              </span>

              {/* Sample Queries */}
              <div className="flex items-center gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => setSqlQuery("SELECT * FROM users LIMIT 10;")}
                  className="px-2 py-1 rounded bg-[#051c13] text-emerald-300 hover:text-white border border-emerald-800 cursor-pointer"
                >
                  users
                </button>
                <button
                  type="button"
                  onClick={() => setSqlQuery("SELECT * FROM transactions ORDER BY created_at DESC LIMIT 10;")}
                  className="px-2 py-1 rounded bg-[#051c13] text-emerald-300 hover:text-white border border-emerald-800 cursor-pointer"
                >
                  transactions
                </button>
                <button
                  type="button"
                  onClick={() => setSqlQuery("SELECT * FROM bets LIMIT 10;")}
                  className="px-2 py-1 rounded bg-[#051c13] text-emerald-300 hover:text-white border border-emerald-800 cursor-pointer"
                >
                  bets
                </button>
              </div>
            </div>

            <textarea
              rows={4}
              value={sqlQuery}
              onChange={e => setSqlQuery(e.target.value)}
              className="w-full bg-[#051a12] border border-emerald-800 rounded-xl p-3 text-xs font-mono text-yellow-300 focus:outline-none focus:border-yellow-400"
              placeholder="SELECT * FROM users WHERE status='active' LIMIT 10;"
            />

            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleRunSql}
                disabled={isRunningSql || !sqlQuery.trim()}
                className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs rounded-xl flex items-center gap-2 shadow-lg shadow-yellow-400/20 cursor-pointer disabled:opacity-50"
              >
                {isRunningSql ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-black" />}
                <span>কোয়েরি রান করুন (Execute SQL)</span>
              </button>
            </div>
          </div>

          {/* SQL Output Results */}
          {sqlResult && (
            <div className="p-4 bg-[#09291b] rounded-2xl border border-emerald-700/40 space-y-3">
              <div className="flex items-center justify-between text-xs pb-2 border-b border-emerald-800">
                <span className="font-bold text-white flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>রেজাল্ট ({sqlResult.executionTimeMs || 0}ms)</span>
                </span>
                {sqlResult.totalRows !== undefined && (
                  <span className="text-gray-400 font-mono">{sqlResult.totalRows} টি রো প্রাপ্ত হয়েছে</span>
                )}
              </div>

              {sqlResult.error ? (
                <div className="p-3 bg-red-950/60 border border-red-500/40 text-red-300 rounded-xl text-xs font-mono">
                  ত্রুটি: {sqlResult.error}
                </div>
              ) : sqlResult.rows && sqlResult.rows.length > 0 ? (
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs text-gray-300">
                    <thead className="bg-[#051a12] text-gray-400 font-mono uppercase text-[10px] sticky top-0">
                      <tr>
                        {sqlResult.columns?.map((c: string) => (
                          <th key={c} className="py-2 px-3 whitespace-nowrap">{c}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-emerald-900/40 font-mono text-[11px]">
                      {sqlResult.rows.map((r: any, idx: number) => (
                        <tr key={idx} className="hover:bg-emerald-950/40">
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
                  {sqlResult.message || 'কোয়েরি সফলভাবে সম্পন্ন হয়েছে। কোনো ডাটা রিটার্ন হয়নি।'}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* =============================================================
          TAB 3: MASTER BACKEND FILES EDITOR
          ============================================================= */}
      {activeTab === 'files_master' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Left File Tree Panel */}
            <div className="p-4 bg-[#09291b] rounded-2xl border border-emerald-700/40 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FolderGit2 className="w-4 h-4 text-yellow-400" />
                  <span>backend-database/ ফাইলসমূহ</span>
                </span>

                <button
                  type="button"
                  onClick={() => setIsNewFileModalOpen(true)}
                  className="p-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer"
                  title="নতুন ফাইল তৈরি"
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
                          ? 'bg-yellow-400 text-black font-bold shadow-md'
                          : 'bg-[#051c13] hover:bg-[#072418] text-gray-300 border border-emerald-900/60'
                      }`}
                    >
                      <div className="flex items-center gap-1.5 truncate">
                        <FileCode className={`w-3.5 h-3.5 shrink-0 ${isCurrent ? 'text-black' : 'text-emerald-400'}`} />
                        <span className="truncate">{f.path}</span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-1">
                        <span className={`text-[10px] font-mono ${isCurrent ? 'text-black/70' : 'text-gray-500'}`}>
                          {f.lineCount}L
                        </span>
                        {!['index.php', 'process.php', 'common/cors.php', 'common/db_helper.php', 'bengalbet/api.php'].includes(f.path) && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(f.path);
                            }}
                            className="p-0.5 hover:text-red-400 text-gray-500 cursor-pointer"
                            title="মুছে ফেলুন"
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

            {/* Right Editor Panel */}
            <div className="lg:col-span-3 p-4 bg-[#09291b] rounded-2xl border border-emerald-700/40 space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-emerald-800">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono font-bold text-yellow-400">
                    {selectedFile || 'কোনো ফাইল সিলেক্ট করা নেই'}
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
                    className="p-1.5 bg-[#051c13] hover:bg-[#072418] text-emerald-300 rounded-lg border border-emerald-800 cursor-pointer"
                    title="রিলোড"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isFileLoading ? 'animate-spin' : ''}`} />
                  </button>

                  <button
                    type="button"
                    onClick={handleSaveFile}
                    disabled={isSavingFile || !selectedFile}
                    className="px-4 py-1.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-yellow-400/20 cursor-pointer disabled:opacity-50"
                  >
                    <Save className="w-3.5 h-3.5" />
                    <span>{isSavingFile ? 'সেভ হচ্ছে...' : 'সেভ করুন (Save via Master API)'}</span>
                  </button>
                </div>
              </div>

              {isFileLoading ? (
                <div className="h-96 flex flex-col items-center justify-center text-xs text-emerald-300">
                  <RefreshCw className="w-6 h-6 animate-spin text-yellow-400 mb-2" />
                  <span>ফাইল কোড লোড হচ্ছে...</span>
                </div>
              ) : (
                <textarea
                  rows={20}
                  value={fileContent}
                  onChange={e => setFileContent(e.target.value)}
                  className="w-full bg-[#05140d] border border-emerald-800/80 rounded-xl p-3 text-xs font-mono text-emerald-200 focus:outline-none focus:border-yellow-400 leading-relaxed resize-y"
                  spellCheck={false}
                />
              )}
            </div>
          </div>
        </div>
      )}

      {/* =============================================================
          TAB 4: MASTER PROCESS & SERVER CONNECTIVITY
          ============================================================= */}
      {activeTab === 'process' && (
        <div className="space-y-6">
          {/* Server Config Card */}
          <div className="p-6 rounded-3xl bg-[#09291b] border border-emerald-700/40 shadow-xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-yellow-400" />
              <span>PHP MySQL ব্যাকএন্ড সার্ভার কনফিগারেশন</span>
            </h3>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <input
                type="text"
                value={customUrl}
                onChange={e => setCustomUrl(e.target.value)}
                placeholder="https://deserver.neexthub.site/backend-database"
                className="flex-1 bg-[#051c13] border border-emerald-800 rounded-xl px-4 py-2.5 text-xs text-white font-mono placeholder-gray-500 focus:outline-none focus:border-yellow-400 w-full"
              />
              <button
                type="button"
                onClick={handleSaveUrl}
                disabled={isSavingUrl}
                className="px-5 py-2.5 bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shrink-0 disabled:opacity-50"
              >
                {isSavingUrl ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>URL আপডেট করুন</span>
              </button>
            </div>
          </div>

          {/* Master Process Runner Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-[#0d3827] via-[#082218] to-[#04160f] border border-emerald-500/40 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="space-y-2">
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                <span>মাস্টার ডাটাবেস অটো-প্রসেস ও মাইগ্রেশন ইঞ্জিন</span>
              </h3>
              <p className="text-xs text-emerald-200/90 max-w-2xl leading-relaxed">
                এই বাটনে ক্লিক করলে <code className="text-yellow-300">process.php</code> এক্সিকিউট হয়, যা স্বয়ংক্রিয়ভাবে <b>bengalbet_db</b> এবং <b>neextplay_db</b> উভয়ের টেবিল ও ডিফল্ট ডাটা সিনক্রোনাইজ করে।
              </p>
            </div>

            <button
              type="button"
              onClick={handleRunProcess}
              disabled={isRunningProcess}
              className="px-6 py-3 bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-500 hover:brightness-110 text-black font-black text-xs rounded-2xl flex items-center gap-2 shadow-xl shadow-yellow-400/25 shrink-0 cursor-pointer"
            >
              <Play className={`w-4 h-4 ${isRunningProcess ? 'animate-spin' : 'fill-black'}`} />
              <span>{isRunningProcess ? 'মাইগ্রেশন চলছে...' : 'মাস্টার প্রসেস রান করুন'}</span>
            </button>
          </div>
        </div>
      )}

      {/* =============================================================
          TAB 5: SCHEMA FILES
          ============================================================= */}
      {activeTab === 'schema' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-6 bg-[#09291b] rounded-3xl border border-emerald-700/40 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-yellow-400" />
              <span>BengalBet Database Schema (bengalbet_db)</span>
            </h3>
            <p className="text-xs text-gray-300">
              Complete MySQL Schema for users, transactions, bets, messages, wallets, VIP rewards, and promo codes.
            </p>
            <a
              href="/api/php-db/schema/bengalbet"
              download="bengalbet_schema.sql"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download bengalbet_schema.sql</span>
            </a>
          </div>

          <div className="p-6 bg-[#09291b] rounded-3xl border border-emerald-700/40 space-y-3">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Code className="w-4 h-4 text-cyan-400" />
              <span>NeextPlay Database Schema (neextplay_db)</span>
            </h3>
            <p className="text-xs text-gray-300">
              Dedicated MySQL Schema for operators, API keys, players, game definitions, sessions, rounds, and audit logs.
            </p>
            <a
              href="/api/php-db/schema/neextplay"
              download="neextplay_schema.sql"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs rounded-xl shadow"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download neextplay_schema.sql</span>
            </a>
          </div>
        </div>
      )}

      {/* =============================================================
          MODAL 1: ADD / EDIT RECORD MODAL
          ============================================================= */}
      {recordModalMode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-[#09291b] border border-emerald-500/50 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Table className="w-4 h-4 text-yellow-400" />
                <span>{recordModalMode === 'create' ? 'নতুন রেকর্ড যুক্ত করুন' : 'রেকর্ড এডিট করুন'} ({selectedTable})</span>
              </h3>
              <button
                type="button"
                onClick={() => setRecordModalMode(null)}
                className="text-gray-400 hover:text-white"
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
                    <label className="text-xs font-bold text-gray-300 block mb-1">
                      {c.name} {c.isPrimary && <span className="text-yellow-400">[Primary Key]</span>}:
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
                      className="w-full bg-[#051c13] border border-emerald-800 disabled:opacity-50 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-400"
                    />
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end gap-2 pt-3 border-t border-emerald-800">
              <button
                type="button"
                onClick={() => setRecordModalMode(null)}
                className="px-4 py-2 rounded-xl bg-white/10 text-gray-300 font-bold text-xs cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleSaveRecord}
                disabled={isSavingRecord}
                className="px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs cursor-pointer flex items-center gap-1.5"
              >
                {isSavingRecord && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                <span>সেভ করুন</span>
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
          <div className="w-full max-w-sm bg-[#09291b] border border-red-500/50 rounded-3xl p-6 shadow-2xl space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto border border-red-500/30">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-white">রেকর্ড মুছে ফেলতে চান?</h3>
            <p className="text-xs text-gray-300">
              টেবিল <code className="text-yellow-400">{selectedTable}</code> থেকে আইডি <code className="text-red-400 font-mono">{String(deleteConfirmId)}</code> সম্পূর্ণ মুছে ফেলা হবে।
            </p>
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 rounded-xl bg-white/10 text-gray-300 font-bold text-xs cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={() => handleDeleteRecord(deleteConfirmId)}
                className="flex-1 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs cursor-pointer"
              >
                মুছে ফেলুন
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =============================================================
          MODAL 3: CREATE NEW BACKEND FILE MODAL
          ============================================================= */}
      {isNewFileModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#09291b] border border-emerald-500/50 rounded-3xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-emerald-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FilePlus className="w-4 h-4 text-yellow-400" />
                <span>নতুন ব্যাকএন্ড ফাইল তৈরি করুন</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsNewFileModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  ফাইলের রিলেটিভ পাথ (e.g. bengalbet/custom_helper.php):
                </label>
                <input
                  type="text"
                  placeholder="bengalbet/my_script.php"
                  value={newFilePath}
                  onChange={e => setNewFilePath(e.target.value)}
                  className="w-full bg-[#051c13] border border-emerald-800 rounded-xl px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-300 block mb-1">
                  প্রাথমিক কোড কনটেন্ট:
                </label>
                <textarea
                  rows={6}
                  value={newFileContent}
                  onChange={e => setNewFileContent(e.target.value)}
                  className="w-full bg-[#051c13] border border-emerald-800 rounded-xl p-3 text-xs font-mono text-emerald-200 focus:outline-none focus:border-yellow-400"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2 border-t border-emerald-800">
              <button
                type="button"
                onClick={() => setIsNewFileModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/10 text-gray-300 font-bold text-xs cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="button"
                onClick={handleCreateNewFile}
                disabled={isSavingFile || !newFilePath.trim()}
                className="px-5 py-2 rounded-xl bg-yellow-400 hover:bg-yellow-300 text-black font-black text-xs cursor-pointer disabled:opacity-50"
              >
                তৈরি ও সেভ করুন
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
          <div className="w-full max-w-2xl bg-[#09291b] border border-emerald-500/50 rounded-3xl p-6 shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-800">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                <span>মাস্টার প্রসেস রান ফলাফল</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsProcessModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="p-3 bg-emerald-950/60 border border-emerald-500/30 rounded-xl text-xs text-emerald-300">
              {processResult.message || 'ডাটাবেস মাইগ্রেশন সফলভাবে এক্সিকিউট হয়েছে!'}
            </div>

            <pre className="p-4 bg-[#05140d] border border-emerald-900 rounded-xl text-[11px] font-mono text-gray-300 overflow-x-auto max-h-72">
              {JSON.stringify(processResult, null, 2)}
            </pre>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsProcessModalOpen(false)}
                className="px-5 py-2 rounded-xl bg-yellow-400 text-black font-bold text-xs cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
