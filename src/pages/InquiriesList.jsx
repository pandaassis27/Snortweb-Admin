import React, { useState, useEffect, useCallback, useRef } from "react";
import { inquiryAPI } from "../services/api";
import { Inbox, Eye, Trash2, Check, Mail, Copy, ExternalLink, X, RefreshCw, Trash, AlertTriangle, Search } from "lucide-react";
import toast from "react-hot-toast";

const InquiryRow = React.memo(({ inquiry, isSelected, onSelect, onToggleRead, onDelete, onSelectInquiry }) => (
  <tr
    onClick={() => onSelectInquiry(inquiry)}
    className={`hover:bg-slate-950/40 transition-colors cursor-pointer group ${
      !inquiry.read ? "bg-slate-950/10 font-medium" : ""
    }`}
  >
    <td className="py-4.5 px-6" onClick={(e) => e.stopPropagation()}>
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelect(inquiry._id)}
        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950 cursor-pointer"
      />
    </td>
    <td className="py-4.5 px-6">
      <div className={`font-bold ${!inquiry.read ? "text-slate-100" : "text-slate-300"}`}>
        {inquiry.name}
      </div>
      <div className="text-[10px] text-slate-500 mt-0.5 flex items-center gap-1.5">
        <span>{inquiry.company || "Freelance / Indiv."}</span>
        <span className="text-slate-700">•</span>
        <span className="font-mono text-slate-400">{inquiry.email}</span>
      </div>
    </td>
    <td className="py-4.5 px-6">
      <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-500 font-medium tracking-wide">
        {inquiry.service}
      </span>
    </td>
    <td className="py-4.5 px-6">
      <span className="font-mono text-slate-300">{inquiry.budget}</span>
    </td>
    <td className="py-4.5 px-6 text-slate-400 font-mono text-[10px]">
      {new Date(inquiry.createdAt).toLocaleString()}
    </td>
    <td className="py-4.5 px-6" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => onToggleRead(inquiry, e)}
        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-colors border cursor-pointer ${
          inquiry.read
            ? "bg-slate-850 border-slate-700/50 text-slate-400 hover:bg-slate-800"
            : "bg-purple-950/30 border-purple-500/20 text-purple-400 hover:bg-purple-950/60 animate-pulse"
        }`}
      >
        {inquiry.read ? "Read" : "Unread"}
      </button>
    </td>
    <td className="py-4.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center justify-end gap-2.5 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={() => onSelectInquiry(inquiry)}
          title="View Details"
          className="p-2 border border-slate-800 text-slate-400 hover:border-slate-650 hover:text-slate-100 rounded transition-colors cursor-pointer"
        >
          <Eye className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={(e) => onToggleRead(inquiry, e)}
          title={inquiry.read ? "Mark as Unread" : "Mark as Read"}
          className="p-2 border border-slate-800 text-slate-400 hover:border-slate-650 hover:text-slate-100 rounded transition-colors cursor-pointer"
        >
          <Check className={`w-3.5 h-3.5 ${!inquiry.read ? "text-emerald-500" : ""}`} />
        </button>
        <button
          onClick={(e) => onDelete(inquiry._id, e)}
          title="Delete Inquiry"
          className="p-2 border border-slate-800 text-slate-400 hover:border-red-950/60 hover:text-red-400 rounded transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </td>
  </tr>
));

export default function InquiriesList() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Server-side options
  const [filter, setFilter] = useState("all"); // "all" | "unread" | "read"
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedService, setSelectedService] = useState("All");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0); // From dashboard stats if needed, or approx
  const [totalCount, setTotalCount] = useState(0);

  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Detail Modal
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [replyCopied, setReplyCopied] = useState(false);
  const [showReplyDropdown, setShowReplyDropdown] = useState(false);

  const abortControllerRef = useRef(null);
  
  // Service list could be static or fetched. We will keep standard static ones
  const servicesList = ["Web Development", "Mobile App", "UI/UX Design", "SEO", "Other"];

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchInquiries = useCallback(async (isInitial = true) => {
    if (document.hidden) return; // Do not fetch if page is hidden (optimization)
    
    if (isInitial && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (isInitial) abortControllerRef.current = new AbortController();

    if (isInitial) setLoading(true);
    try {
      const { data } = await inquiryAPI.getAll({
        paginate: true,
        page,
        limit: 10,
        search: debouncedSearch,
        read: filter === "all" ? "" : filter === "read" ? "true" : "false",
        sortBy,
        sortOrder
      }, { signal: isInitial ? abortControllerRef.current.signal : undefined });
      
      setInquiries(data.data);
      setTotalPages(data.totalPages || 1);
      setTotalCount(data.total || 0);
      
      // Keep selection if possible, otherwise clear it on page change
      if (isInitial) setSelectedIds([]);
    } catch (error) {
      if (error.name !== 'CanceledError') {
        if (isInitial) toast.error("Failed to load inquiries.");
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  }, [page, debouncedSearch, filter, sortBy, sortOrder]);

  // Initial load
  useEffect(() => {
    fetchInquiries(true);
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchInquiries]);

  // Auto-refresh interval (polling)
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchInquiries(false); // background fetch
    }, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, [autoRefresh, fetchInquiries]);

  const handleToggleRead = useCallback(async (inquiry, e) => {
    if (e) e.stopPropagation();
    try {
      const updated = { ...inquiry, read: !inquiry.read };
      await inquiryAPI.update(inquiry._id, updated);
      fetchInquiries(false);
      
      if (selectedInquiry && selectedInquiry._id === inquiry._id) {
        setSelectedInquiry(updated);
      }
    } catch (error) {
      toast.error(error.response?.data?.error || "Error updating inquiry status");
    }
  }, [fetchInquiries, selectedInquiry]);

  const handleMarkAllAsRead = async () => {
    if (!window.confirm("Are you sure you want to mark all unread inquiries as read?")) return;
    // We will do a generic update or loop over visible ones.
    const unreadList = inquiries.filter((i) => !i.read);
    if (unreadList.length === 0) return;

    try {
      const promises = unreadList.map((i) =>
        inquiryAPI.update(i._id, { ...i, read: true })
      );
      await Promise.all(promises);
      toast.success("Marked as read");
      fetchInquiries(false);
    } catch (error) {
      toast.error("Error marking all as read.");
    }
  };

  const handleDelete = useCallback(async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this inquiry?")) {
      try {
        await inquiryAPI.delete(id);
        toast.success("Inquiry deleted");
        fetchInquiries(false);
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        if (selectedInquiry && selectedInquiry._id === id) {
          setSelectedInquiry(null);
          setShowReplyDropdown(false);
        }
      } catch (error) {
        toast.error(error.response?.data?.error || "Error deleting inquiry");
      }
    }
  }, [fetchInquiries, selectedInquiry]);

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} inquiries? This action cannot be undone.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await inquiryAPI.bulkDelete(selectedIds);
      toast.success(`${selectedIds.length} inquiries deleted successfully`);
      fetchInquiries(true);
    } catch (error) {
      toast.error(error.response?.data?.error || "Error performing bulk delete. Make sure you have SuperAdmin privileges.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(inquiries.map(p => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = useCallback((id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  }, []);

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleReplyClick = (email) => {
    navigator.clipboard.writeText(email);
    setReplyCopied(true);
    setTimeout(() => setReplyCopied(false), 3000);
  };

  const getGmailUrl = () => {
    if (!selectedInquiry) return "";
    const subject = encodeURIComponent(`Snortweb Technology - Re: Inquiry about ${selectedInquiry.service}`);
    const body = encodeURIComponent(`Hi ${selectedInquiry.name},\n\nThank you for contacting Snortweb Technology. We received your inquiry regarding "${selectedInquiry.service}".\n\n[Write your reply here]\n\nBest regards,\nSnortweb Technology Team`);
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${selectedInquiry.email}&su=${subject}&body=${body}`;
  };

  const getOutlookUrl = () => {
    if (!selectedInquiry) return "";
    const subject = encodeURIComponent(`Snortweb Technology - Re: Inquiry about ${selectedInquiry.service}`);
    const body = encodeURIComponent(`Hi ${selectedInquiry.name},\n\nThank you for contacting Snortweb Technology. We received your inquiry regarding "${selectedInquiry.service}".\n\n[Write your reply here]\n\nBest regards,\nSnortweb Technology Team`);
    return `https://outlook.live.com/mail/0/deeplink/compose?to=${selectedInquiry.email}&subject=${subject}&body=${body}`;
  };

  const getMailtoUrl = () => {
    if (!selectedInquiry) return "";
    const subject = encodeURIComponent(`Snortweb Technology - Re: Inquiry about ${selectedInquiry.service}`);
    const body = encodeURIComponent(`Hi ${selectedInquiry.name},\n\nThank you for contacting Snortweb Technology. We received your inquiry regarding "${selectedInquiry.service}".\n\n[Write your reply here]\n\nBest regards,\nSnortweb Technology Team`);
    return `mailto:${selectedInquiry.email}?subject=${subject}&body=${body}`;
  };

  const handleSortChange = (e) => {
    const val = e.target.value;
    if (val === "newest") { setSortBy("createdAt"); setSortOrder("desc"); }
    else if (val === "oldest") { setSortBy("createdAt"); setSortOrder("asc"); }
    else if (val === "name-asc") { setSortBy("name"); setSortOrder("asc"); }
    else if (val === "name-desc") { setSortBy("name"); setSortOrder("desc"); }
    setPage(1);
  };

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto text-slate-300">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-slate-100 uppercase">Contact Inquiries</h1>
          <p className="text-xs text-slate-400 mt-1">
            Review, moderate and reply to client inquiries and message submissions
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${autoRefresh ? "animate-spin text-amber-500" : ""}`} />
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={() => setAutoRefresh(!autoRefresh)}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:height-3 after:width-3 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-slate-950 peer-checked:after:border-slate-950 relative after:h-3 after:w-3"></div>
              <span className="text-[10px] font-mono uppercase tracking-wider text-slate-450 peer-checked:text-amber-500">
                Auto-Refresh
              </span>
            </label>
          </div>
          {selectedIds.length > 0 ? (
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-2.5 rounded font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash className="w-4 h-4" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          ) : (
            <button
              onClick={handleMarkAllAsRead}
              className="bg-slate-800 border border-slate-700 hover:border-slate-600 hover:text-slate-100 text-slate-300 px-4 py-2.5 rounded font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition-colors cursor-pointer"
            >
              <Check className="w-4 h-4 text-emerald-500" />
              <span>Mark all as read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs & Stats summary */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-2">
        <div className="flex gap-2">
          {[
            { key: "all", label: "All Messages" },
            { key: "unread", label: "Unread", badgeColor: "bg-purple-500/20 text-purple-400" },
            { key: "read", label: "Read" }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => { setFilter(tab.key); setPage(1); }}
              className={`px-4 py-2.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                filter === tab.key
                  ? "border-amber-500 text-amber-500 font-extrabold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filters Controls */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by sender name, email, company, or message..."
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 pl-9 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={selectedService}
            onChange={(e) => { setSelectedService(e.target.value); setPage(1); }}
            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-amber-500 cursor-pointer transition-colors max-w-[180px]"
          >
            <option value="All">All Services</option>
            {servicesList.map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
          <select
            onChange={handleSortChange}
            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-amber-500 cursor-pointer transition-colors"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="name-asc">Sender (A-Z)</option>
            <option value="name-desc">Sender (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Inquiries Table Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
        <table className="w-full text-left border-collapse text-xs text-slate-300">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400 select-none">
              <th className="py-4.5 px-6 w-12">
                <input
                  type="checkbox"
                  checked={inquiries.length > 0 && selectedIds.length === inquiries.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950 cursor-pointer"
                />
              </th>
              <th className="py-4.5 px-6">Sender / Company</th>
              <th className="py-4.5 px-6">Service Interest</th>
              <th className="py-4.5 px-6">Budget</th>
              <th className="py-4.5 px-6">Received At</th>
              <th className="py-4.5 px-6">Status</th>
              <th className="py-4.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse bg-slate-900/50">
                  <td className="py-4.5 px-6"><div className="w-4 h-4 bg-slate-800 rounded"></div></td>
                  <td className="py-4.5 px-6"><div className="h-8 bg-slate-800 rounded w-3/4"></div></td>
                  <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                  <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                  <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-24"></div></td>
                  <td className="py-4.5 px-6"><div className="h-6 bg-slate-800 rounded w-16"></div></td>
                  <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-8 ml-auto"></div></td>
                </tr>
              ))
            ) : inquiries.length === 0 ? (
              <tr>
                <td colSpan="7" className="py-16 px-6 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <AlertTriangle className="w-8 h-8 text-slate-600" />
                    <p className="font-mono">No inquiries found matching the criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              inquiries.map((inquiry) => (
                <InquiryRow 
                  key={inquiry._id} 
                  inquiry={inquiry}
                  isSelected={selectedIds.includes(inquiry._id)}
                  onSelect={handleSelectOne}
                  onToggleRead={handleToggleRead}
                  onDelete={handleDelete}
                  onSelectInquiry={(inq) => { setSelectedInquiry(inq); setShowReplyDropdown(false); }}
                />
              ))
            )}
          </tbody>
        </table>
        
        {/* Pagination Controls */}
        {!loading && totalPages > 1 && (
          <div className="bg-slate-950/50 border-t border-slate-800 p-4 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-mono">
              PAGE {page} OF {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                disabled={page === 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-300 disabled:opacity-50 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                PREV
              </button>
              <button
                disabled={page === totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="px-3 py-1.5 rounded bg-slate-900 border border-slate-700 text-xs text-slate-300 disabled:opacity-50 hover:bg-slate-800 transition-colors cursor-pointer"
              >
                NEXT
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Inquiry Detail Modal */}
      {selectedInquiry && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm select-text">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-2xl rounded-lg shadow-xl overflow-hidden animate-in fade-in zoom-in duration-200">
            {/* Modal Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-slate-800 bg-slate-950/50">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-amber-500" />
                <span className="font-bold text-xs uppercase tracking-wider text-slate-200">
                  Inquiry Details
                </span>
              </div>
              <button
                onClick={() => {
                  setSelectedInquiry(null);
                  setShowReplyDropdown(false);
                }}
                className="text-slate-500 hover:text-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-6 text-xs">
              {/* Metadata Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-950 p-4 border border-slate-800/80 rounded">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Sender Name</span>
                  <div className="text-slate-200 font-semibold text-sm mt-0.5">{selectedInquiry.name}</div>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Company Name</span>
                  <div className="text-slate-200 font-semibold text-sm mt-0.5">
                    {selectedInquiry.company || "Freelance / Individual"}
                  </div>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Email Address</span>
                  <div className="text-slate-200 font-mono mt-0.5 flex items-center gap-2">
                    <span>{selectedInquiry.email}</span>
                    <button
                      onClick={() => handleCopyToClipboard(selectedInquiry.email)}
                      className="text-slate-500 hover:text-slate-200 p-0.5 rounded cursor-pointer"
                      title="Copy email"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    {copySuccess && <span className="text-[9px] text-emerald-500 font-sans">Copied!</span>}
                  </div>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Submitted On</span>
                  <div className="text-slate-200 font-mono mt-0.5">
                    {new Date(selectedInquiry.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Service Interest</span>
                  <div className="mt-1">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-amber-500 font-medium">
                      {selectedInquiry.service}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Budget Range</span>
                  <div className="mt-1">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/60 text-slate-200 font-mono">
                      {selectedInquiry.budget}
                    </span>
                  </div>
                </div>
              </div>

              {/* Message Content */}
              <div className="space-y-2">
                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">Full Message</span>
                <div className="bg-slate-950 p-4 border-l-2 border-amber-500 text-slate-300 whitespace-pre-line text-sm leading-relaxed rounded-r max-h-60 overflow-y-auto font-sans-body">
                  "{selectedInquiry.message}"
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex justify-between items-center px-6 py-4 border-t border-slate-800 bg-slate-950/50">
              <button
                onClick={(e) => handleDelete(selectedInquiry._id, e)}
                className="bg-red-950/20 border border-red-500/20 hover:border-red-500/50 hover:bg-red-950/40 text-red-400 px-4 py-2.5 rounded font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>Delete</span>
              </button>

              <div className="flex gap-3">
                <button
                  onClick={(e) => handleToggleRead(selectedInquiry, e)}
                  className="bg-slate-800 border border-slate-700 hover:border-slate-650 hover:text-slate-100 text-slate-300 px-4 py-2.5 rounded font-bold text-xs tracking-wider uppercase transition-all cursor-pointer"
                >
                  Mark as {selectedInquiry.read ? "Unread" : "Read"}
                </button>
                <div className="relative">
                  <button
                    onClick={() => setShowReplyDropdown(!showReplyDropdown)}
                    className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer min-w-[100px] justify-center"
                  >
                    <Mail className="w-4 h-4" />
                    <span>{replyCopied ? "Email Copied!" : "Reply"}</span>
                    <ExternalLink className="w-3 h-3" />
                  </button>

                  {showReplyDropdown && (
                    <div className="absolute right-0 bottom-full mb-2 w-52 bg-slate-950 border border-slate-800 rounded-md shadow-2xl py-1.5 z-50 animate-in fade-in slide-in-from-bottom-2 duration-200">
                      <div className="px-3 py-1.5 border-b border-slate-900 text-[10px] text-slate-500 font-bold uppercase tracking-wider text-left">
                        Choose Reply Channel
                      </div>
                      <a
                        href={getGmailUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowReplyDropdown(false)}
                        className="flex items-center gap-2 px-3 py-2 text-[11px] text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-red-400" />
                        <span>Gmail (Web)</span>
                      </a>
                      <a
                        href={getOutlookUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => setShowReplyDropdown(false)}
                        className="flex items-center gap-2 px-3 py-2 text-[11px] text-slate-300 hover:bg-slate-900 hover:text-white transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-blue-400" />
                        <span>Outlook (Web)</span>
                      </a>
                      <a
                        href={getMailtoUrl()}
                        onClick={() => setShowReplyDropdown(false)}
                        className="flex items-center gap-2 px-3 py-2 text-[11px] text-slate-300 hover:bg-slate-900 hover:text-white transition-colors border-t border-slate-900"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                        <span>Default Mail App</span>
                      </a>
                      <button
                        onClick={() => {
                          handleReplyClick(selectedInquiry.email);
                          setShowReplyDropdown(false);
                        }}
                        className="w-full text-left flex items-center gap-2 px-3 py-2 text-[11px] text-slate-300 hover:bg-slate-900 hover:text-white transition-colors border-t border-slate-900 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Copy Email Address</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
