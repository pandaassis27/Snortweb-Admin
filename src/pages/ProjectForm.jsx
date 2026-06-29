import React, { useState, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { projectAPI } from "../services/api";
import { ShieldAlert, Save, ArrowLeft, Plus, X } from "lucide-react";

export default function ProjectForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditMode = !!id;

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("Web Development");
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState([]);
  const [imageUrl, setImageUrl] = useState("");
  const [liveUrl, setLiveUrl] = useState("");
  const [githubUrl, setGithubUrl] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      const fetchProject = async () => {
        try {
          const { data } = await projectAPI.getById(id);
          setTitle(data.title);
          setDescription(data.description);
          setCategory(data.category);
          setTags(data.tags || []);
          setImageUrl(data.imageUrl || "");
          setLiveUrl(data.liveUrl || "");
          setGithubUrl(data.githubUrl || "");
        } catch (err) {
          setError("Failed to fetch project details.");
          console.error(err);
        }
      };
      fetchProject();
    }
  }, [id, isEditMode]);

  const handleAddTag = (e) => {
    e.preventDefault();
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const projectData = {
      title,
      description,
      category,
      tags,
      imageUrl,
      liveUrl,
      githubUrl,
    };

    try {
      if (isEditMode) {
        await projectAPI.update(id, projectData);
      } else {
        await projectAPI.create(projectData);
      }
      navigate("/projects");
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.error || "Failed to save project. Ensure all fields are filled.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-2xl text-slate-300">
      {/* Back Button & Title */}
      <div className="space-y-4">
        <Link to="/projects" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-200 text-xs font-bold tracking-wider uppercase font-mono">
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to registry</span>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-wider text-slate-100 uppercase">
            {isEditMode ? "Modify Project Record" : "Register Project Record"}
          </h1>
          <p className="text-xs text-slate-400 mt-1">Configure project metadata and repository parameters</p>
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
        
        {/* Title */}
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Project Title</label>
          <input
            type="text"
            required
            placeholder="e.g. Aegis Cyber Shield"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-xs outline-none focus:border-amber-500 transition-colors text-slate-100 placeholder-slate-600"
          />
        </div>

        {/* Description */}
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Project Description</label>
          <textarea
            required
            placeholder="Outline project specifications and threats mitigated..."
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-xs outline-none focus:border-amber-500 transition-colors text-slate-100 placeholder-slate-600 resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-xs outline-none focus:border-amber-500 transition-colors text-slate-200 cursor-pointer"
          >
            <option value="Web Development">Web Development</option>
            <option value="Cybersecurity">Cybersecurity</option>
            <option value="Cloud Security">Cloud Security</option>
            <option value="Audit & Assessment">Audit & Assessment</option>
            <option value="Managed Support">Managed Support</option>
          </select>
        </div>

        {/* Tech Stack Tags Input */}
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Technology Stack (Tags)</label>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="e.g. React"
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              className="flex-1 bg-slate-950 border border-slate-800 rounded px-4 py-3 text-xs outline-none focus:border-amber-500 transition-colors text-slate-100 placeholder-slate-600"
            />
            <button
              onClick={handleAddTag}
              type="button"
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 px-4 rounded text-xs transition-colors flex items-center justify-center cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
          {/* Tags preview */}
          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tags.map((tag) => (
                <span key={tag} className="bg-slate-950 border border-slate-850 px-2.5 py-1 rounded text-[10px] font-mono text-slate-300 flex items-center gap-1.5">
                  <span>{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="hover:text-red-400 focus:outline-none text-[8px] cursor-pointer bg-transparent"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Links Group */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Live URL */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Live Production URL</label>
            <input
              type="url"
              placeholder="https://example.com"
              value={liveUrl}
              onChange={(e) => setLiveUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-xs outline-none focus:border-amber-500 transition-colors text-slate-100 placeholder-slate-600"
            />
          </div>
          {/* GitHub Repo URL */}
          <div>
            <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">GitHub Repository URL</label>
            <input
              type="url"
              placeholder="https://github.com/username/project"
              value={githubUrl}
              onChange={(e) => setGithubUrl(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-xs outline-none focus:border-amber-500 transition-colors text-slate-100 placeholder-slate-600"
            />
          </div>
        </div>

        {/* Image URL */}
        <div>
          <label className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block mb-1.5">Image Asset URL (Screenshot)</label>
          <input
            type="text"
            placeholder="https://example.com/screenshot.jpg"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded px-4 py-3 text-xs outline-none focus:border-amber-500 transition-colors text-slate-100 placeholder-slate-600"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-amber-500 hover:bg-amber-600 text-slate-950 py-3.5 px-4 rounded font-bold tracking-widest text-xs uppercase flex items-center justify-center gap-2 mt-6 transition-colors cursor-pointer"
        >
          <Save className="w-4 h-4" />
          <span>{loading ? "Saving Record..." : "Save Record"}</span>
        </button>

      </form>
    </div>
  );
}
