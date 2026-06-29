import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { projectAPI } from "../services/api";
import { Plus, Edit2, Trash2, ExternalLink } from "lucide-react";

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [sortBy, setSortBy] = useState("newest");

  const fetchProjects = async () => {
    try {
      const { data } = await projectAPI.getAll();
      setProjects(data);
    } catch (error) {
      console.error("Fetch projects error:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await projectAPI.delete(id);
        setProjects(projects.filter((p) => p._id !== id));
      } catch (error) {
        alert("Error deleting project: " + error.message);
      }
    }
  };

  const categories = ["All", ...new Set(projects.map((p) => p.category))];

  const filteredProjects = projects
    .filter((project) => {
      const matchSearch =
        project.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (project.tags && project.tags.some((t) => t.toLowerCase().includes(searchTerm.toLowerCase())));
      const matchCategory = selectedCategory === "All" || project.category === selectedCategory;
      return matchSearch && matchCategory;
    })
    .sort((a, b) => {
      if (sortBy === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortBy === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortBy === "title-asc") return a.title.localeCompare(b.title);
      if (sortBy === "title-desc") return b.title.localeCompare(a.title);
      return 0;
    });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 font-mono text-xs">
        LOADING PROJECT DATA...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-6xl">
      {/* Header Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-slate-100 uppercase">Projects Registry</h1>
          <p className="text-xs text-slate-400 mt-1">Manage Snortweb showcase portfolio entries</p>
        </div>
        <Link
          to="/projects/add"
          className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add Project</span>
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-sm">
        <div className="flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by project title or technology tag..."
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-200 placeholder-slate-505 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-350 focus:outline-none focus:border-amber-500 cursor-pointer transition-colors"
          >
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat === "All" ? "All Categories" : cat}
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
            <option value="title-asc">Title (A-Z)</option>
            <option value="title-desc">Title (Z-A)</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
        <table className="w-full text-left border-collapse text-xs text-slate-300">
          <thead>
            <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
              <th className="py-4.5 px-6">Title</th>
              <th className="py-4.5 px-6">Category</th>
              <th className="py-4.5 px-6">Tech Stack</th>
              <th className="py-4.5 px-6">Links</th>
              <th className="py-4.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {filteredProjects.length === 0 ? (
              <tr>
                <td colSpan="5" className="py-8 px-6 text-center text-slate-500 font-mono">
                  No projects found matching the filters.
                </td>
              </tr>
            ) : (
              filteredProjects.map((project) => (
                <tr key={project._id} className="hover:bg-slate-950/40 transition-colors">
                  <td className="py-4.5 px-6 font-bold text-slate-200">{project.title}</td>
                  <td className="py-4.5 px-6 text-amber-500 font-mono font-medium">{project.category}</td>
                  <td className="py-4.5 px-6">
                    <div className="flex flex-wrap gap-1.5 max-w-xs">
                      {project.tags.map((tag) => (
                        <span key={tag} className="bg-slate-800 border border-slate-700/60 px-2 py-0.5 rounded text-[9px] font-mono text-slate-300">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-4.5 px-6">
                    <div className="flex items-center gap-3 text-slate-400">
                      {project.liveUrl && (
                        <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 flex items-center gap-1 font-mono text-[10px]">
                          <span>Live</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                      {project.githubUrl && (
                        <a href={project.githubUrl} target="_blank" rel="noopener noreferrer" className="hover:text-amber-500 flex items-center gap-1 font-mono text-[10px]">
                          <span>Repo</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="py-4.5 px-6 text-right">
                    <div className="flex items-center justify-end gap-2.5">
                      <Link
                        to={`/projects/edit/${project._id}`}
                        className="p-2 border border-slate-700 text-slate-300 hover:border-amber-500 hover:text-amber-500 rounded transition-colors cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => handleDelete(project._id)}
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
