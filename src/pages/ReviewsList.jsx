import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { reviewAPI } from "../services/api";
import { Plus, Edit2, Trash2, ShieldCheck, ShieldAlert, Star } from "lucide-react";

export default function ReviewsList() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const fetchReviews = async () => {
    try {
      const { data } = await reviewAPI.getAll();
      setReviews(data);
    } catch (error) {
      console.error("Fetch reviews error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleToggleApproval = async (review) => {
    try {
      const updatedReview = { ...review, approved: !review.approved };
      const { data } = await reviewAPI.update(review._id, updatedReview);
      setReviews(reviews.map((r) => (r._id === review._id ? data : r)));
    } catch (error) {
      alert("Error toggling approval status: " + error.message);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this client review?")) {
      try {
        await reviewAPI.delete(id);
        setReviews(reviews.filter((r) => r._id !== id));
      } catch (error) {
        alert("Error deleting review: " + error.message);
      }
    }
  };

  const filteredReviews = reviews
    .filter((review) => {
      const matchSearch =
        review.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (review.clientCompany && review.clientCompany.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (review.clientDesignation && review.clientDesignation.toLowerCase().includes(searchTerm.toLowerCase())) ||
        review.comment.toLowerCase().includes(searchTerm.toLowerCase());

      const matchStatus =
        statusFilter === "All" ||
        (statusFilter === "Approved" && review.approved) ||
        (statusFilter === "Pending" && !review.approved);

      return matchSearch && matchStatus;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "rating-desc") return b.rating - a.rating;
      if (sortBy === "rating-asc") return a.rating - b.rating;
      return 0;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 font-mono text-xs">
        LOADING TESTIMONIAL DATA...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-6xl text-slate-300">
      {/* Header Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-slate-100 uppercase">Reviews & Testimonials</h1>
          <p className="text-xs text-slate-400 mt-1">Manage and moderate client feedback and ratings</p>
        </div>
        <Link
          to="/reviews/add"
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Review</span>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-sm">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by client name, company, designation, or comment..."
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-505 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-amber-500 cursor-pointer transition-colors"
          >
            <option value="All">All Statuses</option>
            <option value="Approved">Approved</option>
            <option value="Pending">Pending</option>
          </select>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
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
              <th className="py-4.5 px-6">Client Info</th>
              <th className="py-4.5 px-6">Feedback Comment</th>
              <th className="py-4.5 px-6">Rating</th>
              <th className="py-4.5 px-6">Status</th>
              <th className="py-4.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredReviews.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 px-6 text-center text-slate-500 font-mono">
                  No testimonials found matching the filters.
                </td>
              </tr>
            ) : (
              filteredReviews.map((review) => (
                <tr key={review._id} className="hover:bg-slate-950/40 transition-colors">
                  {/* Client Info */}
                  <td className="py-4.5 px-6">
                    <div className="font-bold text-slate-200">{review.clientName}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5">
                      {review.clientDesignation} at {review.clientCompany || "Freelance"}
                    </div>
                  </td>
                  {/* Comment */}
                  <td className="py-4.5 px-6 max-w-xs truncate italic">
                    "{review.comment}"
                  </td>
                  {/* Rating */}
                  <td className="py-4.5 px-6">
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-3.5 h-3.5 ${
                            i < review.rating ? "fill-amber-500" : "text-slate-700"
                          }`}
                        />
                      ))}
                    </div>
                  </td>
                  {/* Status */}
                  <td className="py-4.5 px-6">
                    <button
                      onClick={() => handleToggleApproval(review)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[9px] font-mono font-bold uppercase transition-colors cursor-pointer border ${
                        review.approved
                          ? "bg-emerald-950/30 border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/60"
                          : "bg-red-950/30 border-red-500/20 text-red-400 hover:bg-red-950/60"
                      }`}
                    >
                      {review.approved ? (
                        <>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          <span>Approved</span>
                        </>
                      ) : (
                        <>
                          <ShieldAlert className="w-3.5 h-3.5" />
                          <span>Pending</span>
                        </>
                      )}
                    </button>
                  </td>
                  {/* Actions */}
                  <td className="py-4.5 px-6 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <Link
                        to={`/reviews/edit/${review._id}`}
                        className="p-2 border border-slate-700 text-slate-300 hover:border-amber-500 hover:text-amber-500 rounded transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(review._id)}
                        className="p-2 border border-slate-700 text-slate-300 hover:border-red-500 hover:text-red-500 rounded transition-colors cursor-pointer bg-transparent"
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

    </div>
  );
}
