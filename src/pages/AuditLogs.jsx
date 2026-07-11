import React, { useState, useEffect, useCallback } from "react";
import { auditAPI } from "../services/api";
import { Search, Filter, Download, ChevronLeft, ChevronRight, Activity, Shield, LogIn, AlertCircle } from "lucide-react";
import toast from "react-hot-toast";

export default function AuditLogs() {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [resourceFilter, setResourceFilter] = useState("All");
  
  // Sorting
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await auditAPI.getAll({
        page,
        limit: 15,
        search: debouncedSearch,
        status: statusFilter,
        resource: resourceFilter,
        sortBy,
        sortOrder
      });
      setLogs(data.logs);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error(err);
      setError("Failed to load audit logs.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, resourceFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleExportCSV = async () => {
    try {
      // For CSV, fetch up to 1000 logs based on current filters
      const { data } = await auditAPI.getAll({
        page: 1,
        limit: 1000,
        search: debouncedSearch,
        status: statusFilter,
        resource: resourceFilter,
        sortBy,
        sortOrder
      });
      
      const csvData = data.logs.map(log => ({
        Date: new Date(log.createdAt).toLocaleString(),
        Admin: log.admin?.username || log.username || "Unknown",
        Action: log.action,
        Resource: log.resource,
        Status: log.status,
        IP: log.ipAddress || "N/A",
        UserAgent: log.userAgent || "N/A"
      }));

      if (csvData.length === 0) {
        toast.error("No data to export.");
        return;
      }

      const headers = Object.keys(csvData[0]).join(",");
      const rows = csvData.map(obj => 
        Object.values(obj).map(val => `"${String(val).replace(/"/g, '""')}"`).join(",")
      ).join("\n");
      
      const csvString = `${headers}\n${rows}`;
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `audit_logs_${new Date().getTime()}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success("CSV Exported successfully.");
    } catch (error) {
      console.error(error);
      toast.error("Failed to export CSV.");
    }
  };

  const getActionIcon = (action) => {
    if (action.includes("LOGIN") || action.includes("AUTH")) return <LogIn className="w-4 h-4 text-blue-400" />;
    if (action.includes("CREATE")) return <Activity className="w-4 h-4 text-green-400" />;
    if (action.includes("UPDATE")) return <Activity className="w-4 h-4 text-amber-400" />;
    if (action.includes("DELETE")) return <AlertCircle className="w-4 h-4 text-red-400" />;
    return <Shield className="w-4 h-4 text-slate-400" />;
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-slate-100 uppercase">Audit Logs</h1>
          <p className="text-xs text-slate-400 mt-1">Immutable record of all administrative actions and security events.</p>
        </div>
        <button
          onClick={handleExportCSV}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 py-2.5 rounded font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by action or username..."
            className="w-full bg-slate-950 border border-slate-800 rounded pl-10 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={resourceFilter}
            onChange={(e) => { setResourceFilter(e.target.value); setPage(1); }}
            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="All">All Resources</option>
            <option value="AUTH">Authentication</option>
            <option value="PROJECT">Projects</option>
            <option value="ADMIN">Admin Users</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
          >
            <option value="All">All Statuses</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-300 whitespace-nowrap">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                <th className="py-4 px-6 cursor-pointer hover:text-amber-500 transition-colors" onClick={() => { setSortBy('createdAt'); setSortOrder(sortOrder === 'desc' ? 'asc' : 'desc'); }}>Date / Time</th>
                <th className="py-4 px-6">Admin User</th>
                <th className="py-4 px-6">Action</th>
                <th className="py-4 px-6">Resource</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">IP / Agent</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-24"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-32"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-20"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                    <td className="py-4 px-6"><div className="h-5 bg-slate-800 rounded-full w-16"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-32"></div></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-red-400 font-mono">
                    {error}
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 font-mono">
                    No audit logs match your current filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log._id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-3 px-6 font-mono text-[10px] text-slate-400">
                      <div>{new Date(log.createdAt).toLocaleDateString()}</div>
                      <div>{new Date(log.createdAt).toLocaleTimeString()}</div>
                    </td>
                    <td className="py-3 px-6">
                      <div className="font-bold text-slate-200">{log.admin?.username || log.username || "Unknown"}</div>
                      <div className="text-[10px] font-mono text-slate-500">{log.admin?.email || "N/A"}</div>
                    </td>
                    <td className="py-3 px-6">
                      <span className="flex items-center gap-2 font-mono font-bold tracking-wide">
                        {getActionIcon(log.action)}
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-6 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                      {log.resource}
                    </td>
                    <td className="py-3 px-6">
                      <span className={`px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-widest ${
                        log.status === "success" 
                          ? "bg-green-500/10 text-green-400 border border-green-500/20" 
                          : "bg-red-500/10 text-red-400 border border-red-500/20"
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-6 font-mono text-[10px] text-slate-500">
                      <div>{log.ipAddress || "Unknown IP"}</div>
                      <div className="truncate max-w-[200px]" title={log.userAgent}>{log.userAgent || "Unknown Device"}</div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {!loading && !error && totalPages > 1 && (
          <div className="p-4 border-t border-slate-800 bg-slate-950 flex items-center justify-between">
            <span className="text-[10px] font-mono text-slate-500 uppercase tracking-widest">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 border border-slate-800 rounded text-slate-400 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 border border-slate-800 rounded text-slate-400 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
