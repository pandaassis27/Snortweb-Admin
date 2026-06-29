import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { reviewAPI } from "../services/api";
import { ShieldAlert, Save, ArrowLeft, Star } from "lucide-react";

export default function ReviewForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [clientName, setClientName] = useState("");
  const [clientCompany, setClientCompany] = useState("");
  const [clientDesignation, setClientDesignation] = useState("");
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [approved, setApproved] = useState(true);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const fetchReview = async () => {
        try {
          const { data } = await reviewAPI.getById(id);
          setClientName(data.clientName);
          setClientCompany(data.clientCompany || "");
          setClientDesignation(data.clientDesignation || "");
          setRating(data.rating);
          setComment(data.comment);
          setApproved(data.approved !== undefined ? data.approved : true);
        } catch (err) {
          setError("Failed to fetch review details.");
          console.error(err);
        }
      };
      fetchReview();
    }
  }, [id, isEditMode]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const reviewData = {
      clientName,
      clientCompany,
      clientDesignation,
      rating: Number(rating),
      comment,
      approved,
    };

    try {
      if (isEditMode) {
        await reviewAPI.update(id, reviewData);
      } else {
        await reviewAPI.create(reviewData);
      }
      navigate("/reviews");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to save review. Ensure all fields are filled.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-2xl text-slate-300">
      {/* Back Button & Title */}
      <div className="space-y-4">
        <Link to="/reviews" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-xs font-bold tracking-wider uppercase font-mono">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to moderation</span>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-wider text-slate-100 uppercase">
            {isEditMode ? "Modify Testimonial Record" : "Register Testimonial Record"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">Configure client feedback credentials and approval status</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-950/40 border border-red-500/30 text-red-400 p-4 rounded text-xs font-semibold flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Form Card */}
      <form onSubmit={handleSubmit} className="bg-slate-900 border border-slate-800 p-6 rounded-lg shadow-md space-y-5">
        
        {/* Client Name */}
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Client Name</label>
          <input
            type="text"
            required
            placeholder="e.g. John Doe"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-xs outline-none focus:border-amber-500 transition-colors text-slate-100 placeholder-slate-600"
          />
        </div>

        {/* Company & Designation Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Client Company */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Client Company</label>
            <input
              type="text"
              placeholder="e.g. Acme Corp"
              value={clientCompany}
              onChange={(e) => setClientCompany(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-xs outline-none focus:border-amber-500 transition-colors text-slate-100 placeholder-slate-600"
            />
          </div>
          {/* Designation */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Client Designation</label>
            <input
              type="text"
              placeholder="e.g. CTO / Managing Director"
              value={clientDesignation}
              onChange={(e) => setClientDesignation(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-xs outline-none focus:border-amber-500 transition-colors text-slate-100 placeholder-slate-600"
            />
          </div>
        </div>

        {/* Rating Select (1-5 stars) */}
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Rating (1-5 Stars)</label>
          <div className="flex gap-1.5 mt-1 text-slate-500">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className="hover:scale-110 transition-transform focus:outline-none cursor-pointer bg-transparent"
              >
                <Star
                  className={`w-7 h-7 ${
                    star <= rating ? "text-amber-500 fill-amber-500" : "text-slate-700"
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        {/* Comment Textarea */}
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Feedback Comment</label>
          <textarea
            required
            placeholder="Input client's direct review comment here..."
            rows={4}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-xs outline-none focus:border-amber-500 transition-colors text-slate-100 placeholder-slate-600 resize-none"
          />
        </div>

        {/* Approved Toggle */}
        <div className="flex items-center gap-3 py-1">
          <input
            type="checkbox"
            id="approved"
            checked={approved}
            onChange={(e) => setApproved(e.target.checked)}
            className="w-4 h-4 bg-slate-950 border border-slate-800 rounded text-amber-500 focus:ring-0 focus:ring-offset-0 focus:outline-none cursor-pointer accent-amber-500"
          />
          <label htmlFor="approved" className="text-xs font-bold text-slate-300 uppercase tracking-wider cursor-pointer">
            Approve Testimonial immediately for display
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 py-3.5 px-4 rounded font-bold tracking-widest text-xs uppercase flex items-center justify-center gap-2 mt-6 transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? "Saving Testimonial..." : "Save Testimonial"}</span>
        </button>

      </form>
    </div>
  );
}
