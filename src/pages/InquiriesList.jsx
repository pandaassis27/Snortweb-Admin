import React, { useState, useEffect } from "react";
import { inquiryAPI } from "../services/api";
import { Inbox, Eye, Trash2, Check, Mail, Copy, ExternalLink, X, RefreshCw } from "lucide-react";

export default function InquiriesList() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all"); // "all" | "unread" | "read"
  const [selectedInquiry, setSelectedInquiry] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedService, setSelectedService] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchInquiries = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const { data } = await inquiryAPI.getAll();
      setInquiries(data);
    } catch (error) {
      console.error("Fetch inquiries error:", error.message);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchInquiries(true);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchInquiries(false);
    }, 10000); // 10s auto-refresh
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleToggleRead = async (inquiry, e) => {
    if (e) e.stopPropagation();
    try {
      const updated = { ...inquiry, read: !inquiry.read };
      const { data } = await inquiryAPI.update(inquiry._id, updated);
      setInquiries(inquiries.map((i) => (i._id === inquiry._id ? data : i)));
      
      // Update selected inquiry modal state if open
      if (selectedInquiry && selectedInquiry._id === inquiry._id) {
        setSelectedInquiry(data);
      }
    } catch (error) {
      alert("Error updating inquiry status: " + error.message);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadList = inquiries.filter((i) => !i.read);
    if (unreadList.length === 0) return;

    try {
      const promises = unreadList.map((i) =>
        inquiryAPI.update(i._id, { ...i, read: true })
      );
      await Promise.all(promises);
      
      setInquiries(inquiries.map((i) => ({ ...i, read: true })));
    } catch (error) {
      alert("Error marking all as read: " + error.message);
    }
  };

  const handleDelete = async (id, e) => {
    if (e) e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this inquiry?")) {
      try {
        await inquiryAPI.delete(id);
        setInquiries(inquiries.filter((i) => i._id !== id));
        if (selectedInquiry && selectedInquiry._id === id) {
          setSelectedInquiry(null);
        }
      } catch (error) {
        alert("Error deleting inquiry: " + error.message);
      }
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const servicesList = ["All", ...new Set(inquiries.map((i) => i.service))];

  const filteredInquiries = inquiries
    .filter((inquiry) => {
      // 1. Read/Unread filter
      const matchFilter =
        filter === "all" ||
        (filter === "unread" && !inquiry.read) ||
        (filter === "read" && inquiry.read);

      // 2. Service category filter
      const matchService = selectedService === "All" || inquiry.service === selectedService;

      // 3. Search query filter
      const matchSearch =
        inquiry.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inquiry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (inquiry.company && inquiry.company.toLowerCase().includes(searchTerm.toLowerCase())) ||
        inquiry.message.toLowerCase().includes(searchTerm.toLowerCase());

      return matchFilter && matchService && matchSearch;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "name-asc") return a.name.localeCompare(b.name);
      if (sortBy === "name-desc") return b.name.localeCompare(a.name);
      return 0;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 font-mono text-xs select-none">
        LOADING INCOMING CHANNELS...
      </div>
    );
  }

  const unreadCount = inquiries.filter((i) => !i.read).length;

  return (
    <div className="p-8 space-y-6 max-w-6xl text-slate-300">
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
          {unreadCount > 0 && (
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
            { key: "all", label: "All Messages", count: inquiries.length },
            { key: "unread", label: "Unread", count: unreadCount, badgeColor: "bg-purple-500/20 text-purple-400" },
            { key: "read", label: "Read", count: inquiries.length - unreadCount }
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-4 py-2.5 text-xs font-bold tracking-wider uppercase border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                filter === tab.key
                  ? "border-amber-500 text-amber-500 font-extrabold"
                  : "border-transparent text-slate-400 hover:text-slate-200"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold ${
                tab.badgeColor || "bg-slate-800 text-slate-400"
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Search & Filters Controls */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-sm">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by sender name, email, company, or message query..."
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-505 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-amber-500 cursor-pointer transition-colors max-w-[180px]"
          >
            <option value="All">All Services</option>
            {servicesList.filter(s => s !== "All").map((service) => (
              <option key={service} value={service}>
                {service}
              </option>
            ))}
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
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
              <th className="py-4.5 px-6">Sender / Company</th>
              <th className="py-4.5 px-6">Service Interest</th>
              <th className="py-4.5 px-6">Budget</th>
              <th className="py-4.5 px-6">Received At</th>
              <th className="py-4.5 px-6">Status</th>
              <th className="py-4.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredInquiries.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-12 px-6 text-center text-slate-500 font-mono">
                  No inquiries found matching the "{filter}" filter.
                </td>
              </tr>
            ) : (
              filteredInquiries.map((inquiry) => (
                <tr
                  key={inquiry._id}
                  onClick={() => setSelectedInquiry(inquiry)}
                  className={`hover:bg-slate-950/40 transition-colors cursor-pointer ${
                    !inquiry.read ? "bg-slate-950/10 font-medium" : ""
                  }`}
                >
                  {/* Sender Info */}
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
                  {/* Service */}
                  <td className="py-4.5 px-6">
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-500 font-medium tracking-wide">
                      {inquiry.service}
                    </span>
                  </td>
                  {/* Budget */}
                  <td className="py-4.5 px-6">
                    <span className="font-mono text-slate-300">{inquiry.budget}</span>
                  </td>
                  {/* Date */}
                  <td className="py-4.5 px-6 text-slate-400 font-mono text-[10px]">
                    {new Date(inquiry.createdAt).toLocaleString()}
                  </td>
                  {/* Status */}
                  <td className="py-4.5 px-6">
                    <button
                      onClick={(e) => handleToggleRead(inquiry, e)}
                      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-[8px] font-mono font-bold uppercase transition-colors border cursor-pointer ${
                        inquiry.read
                          ? "bg-slate-850 border-slate-700/50 text-slate-400 hover:bg-slate-800"
                          : "bg-purple-950/30 border-purple-500/20 text-purple-400 hover:bg-purple-950/60 animate-pulse"
                      }`}
                    >
                      {inquiry.read ? "Read" : "Unread"}
                    </button>
                  </td>
                  {/* Actions */}
                  <td className="py-4.5 px-6 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-2.5">
                      <button
                        onClick={() => setSelectedInquiry(inquiry)}
                        title="View Details"
                        className="p-2 border border-slate-800 text-slate-400 hover:border-slate-650 hover:text-slate-100 rounded transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleToggleRead(inquiry, e)}
                        title={inquiry.read ? "Mark as Unread" : "Mark as Read"}
                        className="p-2 border border-slate-800 text-slate-400 hover:border-slate-650 hover:text-slate-100 rounded transition-colors cursor-pointer"
                      >
                        <Check className={`w-3.5 h-3.5 ${!inquiry.read ? "text-emerald-500" : ""}`} />
                      </button>
                      <button
                        onClick={(e) => handleDelete(inquiry._id, e)}
                        title="Delete Inquiry"
                        className="p-2 border border-slate-800 text-slate-400 hover:border-red-950/60 hover:text-red-400 rounded transition-colors cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
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
                onClick={() => setSelectedInquiry(null)}
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
                <a
                  href={`mailto:${selectedInquiry.email}?subject=Snortweb Technology - Re: Inquiry about ${selectedInquiry.service}`}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition-all cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  <span>Reply</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
