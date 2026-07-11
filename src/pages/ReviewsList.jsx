import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { reviewAPI } from "../services/api";
import { Plus, Edit2, Trash2, ShieldCheck, ShieldAlert, Star, Search, Trash, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

const ReviewRow = React.memo(({ review, isSelected, onSelect, onToggleApproval, onDelete }) => (
  <tr className="hover:bg-slate-950/40 transition-colors group">
    <td className="py-4.5 px-6">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelect(review._id)}
        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950 cursor-pointer"
      />
    </td>
    <td className="py-4.5 px-6">
      <div className="font-bold text-slate-200">{review.clientName}</div>
      <div className="text-slate-400 text-[10px] mt-0.5 uppercase tracking-wider">
        {review.clientDesignation} {review.clientCompany ? `@ ${review.clientCompany}` : ""}
      </div>
    </td>
    <td className="py-4.5 px-6">
      <p className="text-slate-400 line-clamp-2 max-w-xs">{review.comment}</p>
    </td>
    <td className="py-4.5 px-6">
      <div className="flex gap-0.5">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`w-3.5 h-3.5 ${
              i < review.rating ? "fill-amber-500 text-amber-500" : "fill-slate-800 text-slate-800"
            }`}
          />
        ))}
      </div>
    </td>
    <td className="py-4.5 px-6">
      <button
        onClick={() => onToggleApproval(review)}
        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-sm text-[10px] uppercase font-bold tracking-wider transition-colors cursor-pointer ${
          review.approved
            ? "bg-green-500/10 text-green-500 hover:bg-green-500/20"
            : "bg-red-500/10 text-red-500 hover:bg-red-500/20"
        }`}
      >
        {review.approved ? <ShieldCheck className="w-3.5 h-3.5" /> : <ShieldAlert className="w-3.5 h-3.5" />}
        {review.approved ? "Approved" : "Pending"}
      </button>
    </td>
    <td className="py-4.5 px-6 text-right">
      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link to={`/reviews/edit/${review._id}`} className="text-slate-500 hover:text-amber-500 transition-colors p-1" title="Edit">
          <Edit2 className="w-4 h-4" />
        </Link>
        <button onClick={() => onDelete(review._id)} className="text-slate-500 hover:text-red-500 transition-colors p-1" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </td>
  </tr>
));

export default function ReviewsList() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Server-side Options
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Bulk Actions
  const [selectedIds, setSelectedIds] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const abortControllerRef = useRef(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchReviews = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      const { data } = await reviewAPI.getAll({
        paginate: true,
        page,
        limit: 10,
        search: debouncedSearch,
        approved: statusFilter === "All" ? "" : statusFilter === "Approved" ? "true" : "false",
        sortBy,
        sortOrder
      }, { signal: abortControllerRef.current.signal });
      
      setReviews(data.data);
      setTotalPages(data.totalPages || 1);
      setSelectedIds([]);
    } catch (error) {
      if (error.name !== 'CanceledError') {
        toast.error("Failed to load reviews.");
      }
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchReviews();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchReviews]);

  const handleToggleApproval = useCallback(async (review) => {
    try {
      const updatedReview = { ...review, approved: !review.approved };
      await reviewAPI.update(review._id, updatedReview);
      toast.success(`Review ${updatedReview.approved ? 'approved' : 'marked pending'}`);
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error toggling approval status");
    }
  }, [fetchReviews]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm("Are you sure you want to delete this client review?")) {
      try {
        await reviewAPI.delete(id);
        toast.success("Review deleted successfully");
        fetchReviews();
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      } catch (error) {
        toast.error(error.response?.data?.error || "Error deleting review");
      }
    }
  }, [fetchReviews]);

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} reviews? This action cannot be undone.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await reviewAPI.bulkDelete(selectedIds);
      toast.success(`${selectedIds.length} reviews deleted successfully`);
      fetchReviews();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error performing bulk delete. Make sure you have SuperAdmin privileges.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(reviews.map(p => p._id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = useCallback((id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  }, []);

  const handleSortChange = (e) => {
    const val = e.target.value;
    if (val === "newest") { setSortBy("createdAt"); setSortOrder("desc"); }
    else if (val === "oldest") { setSortBy("createdAt"); setSortOrder("asc"); }
    else if (val === "rating-desc") { setSortBy("rating"); setSortOrder("desc"); }
    else if (val === "rating-asc") { setSortBy("rating"); setSortOrder("asc"); }
    setPage(1);
  };

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto text-slate-300">
      {/* Header Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-slate-100 uppercase">Reviews & Testimonials</h1>
          <p className="text-xs text-slate-400 mt-1">Manage and moderate client feedback and ratings</p>
        </div>
        <div className="flex items-center gap-3">
          {selectedIds.length > 0 && (
            <button
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/30 px-4 py-2.5 rounded font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Trash className="w-4 h-4" />
              <span>Delete Selected ({selectedIds.length})</span>
            </button>
          )}
          <Link
            to="/reviews/add"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Review</span>
          </Link>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client name, company, designation, or comment..."
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 pl-9 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-amber-500 cursor-pointer transition-colors"
          >
            <option value="All">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
          </select>
          <select
            onChange={handleSortChange}
            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-amber-500 cursor-pointer transition-colors"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="rating-desc">Highest Rating</option>
            <option value="rating-asc">Lowest Rating</option>
          </select>
        </div>
      </div>

      {/* Reviews Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
        <table className="w-full text-left border-collapse text-xs text-slate-300">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
              <th className="py-4.5 px-6 w-12">
                <input
                  type="checkbox"
                  checked={reviews.length > 0 && selectedIds.length === reviews.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950 cursor-pointer"
                />
              </th>
              <th className="py-4.5 px-6">Client Info</th>
              <th className="py-4.5 px-6">Feedback Comment</th>
              <th className="py-4.5 px-6">Rating</th>
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
                  <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-full"></div></td>
                  <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                  <td className="py-4.5 px-6"><div className="h-6 bg-slate-800 rounded w-16"></div></td>
                  <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-8 ml-auto"></div></td>
                </tr>
              ))
            ) : reviews.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-16 px-6 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <AlertTriangle className="w-8 h-8 text-slate-600" />
                    <p className="font-mono">No reviews found matching the criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              reviews.map((review) => (
                <ReviewRow 
                  key={review._id} 
                  review={review}
                  isSelected={selectedIds.includes(review._id)}
                  onSelect={handleSelectOne}
                  onToggleApproval={handleToggleApproval}
                  onDelete={handleDelete}
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
    </div>
  );
}
