import React, { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { projectAPI } from "../services/api";
import { Plus, Edit2, Trash2, ExternalLink, Search, Trash, AlertTriangle } from "lucide-react";
import toast from "react-hot-toast";

const ProjectRow = React.memo(({ project, isSelected, onSelect, onDelete }) => (
  <tr className="hover:bg-slate-950/40 transition-colors group">
    <td className="py-4.5 px-6">
      <input
        type="checkbox"
        checked={isSelected}
        onChange={() => onSelect(project._id)}
        className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950 cursor-pointer"
      />
    </td>
    <td className="py-4.5 px-6 font-bold text-slate-200">{project.title}</td>
    <td className="py-4.5 px-6">
      <span className="bg-slate-800 text-slate-300 px-2.5 py-1 rounded-sm text-[10px] uppercase font-bold tracking-wider">
        {project.category}
      </span>
    </td>
    <td className="py-4.5 px-6">
      <div className="flex flex-wrap gap-1.5">
        {project.tags.slice(0, 3).map((tag, idx) => (
          <span key={idx} className="bg-slate-800/50 text-slate-400 px-2 py-0.5 rounded-sm text-[10px] uppercase tracking-wider">
            {tag}
          </span>
        ))}
        {project.tags.length > 3 && (
          <span className="text-slate-500 text-[10px] ml-1">+{project.tags.length - 3}</span>
        )}
      </div>
    </td>
    <td className="py-4.5 px-6">
      <div className="flex items-center gap-3">
        {project.liveUrl && (
          <a href={project.liveUrl} target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-amber-500 transition-colors" title="Live Site">
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
      </div>
    </td>
    <td className="py-4.5 px-6 text-right">
      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
        <Link to={`/projects/edit/${project._id}`} className="text-slate-500 hover:text-amber-500 transition-colors p-1" title="Edit">
          <Edit2 className="w-4 h-4" />
        </Link>
        <button onClick={() => onDelete(project._id)} className="text-slate-500 hover:text-red-500 transition-colors p-1" title="Delete">
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </td>
  </tr>
));

export default function ProjectsList() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Server-side options
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
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

  const fetchProjects = useCallback(async () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setLoading(true);
    try {
      const { data } = await projectAPI.getAll({
        paginate: true,
        page,
        limit: 10,
        search: debouncedSearch,
        category: selectedCategory,
        sortBy,
        sortOrder
      }, { signal: abortControllerRef.current.signal });
      
      setProjects(data.data);
      setTotalPages(data.totalPages || 1);
      setSelectedIds([]); // Clear selection on page/filter change
    } catch (error) {
      if (error.name !== 'CanceledError') {
        toast.error("Failed to load projects.");
      }
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedCategory, sortBy, sortOrder]);

  useEffect(() => {
    fetchProjects();
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, [fetchProjects]);

  const handleDelete = useCallback(async (id) => {
    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        await projectAPI.delete(id);
        toast.success("Project deleted successfully");
        fetchProjects();
        setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
      } catch (error) {
        toast.error(error.response?.data?.error || "Error deleting project");
      }
    }
  }, [fetchProjects]);

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedIds.length} projects? This action cannot be undone.`)) {
      return;
    }
    setIsDeleting(true);
    try {
      await projectAPI.bulkDelete(selectedIds);
      toast.success(`${selectedIds.length} projects deleted successfully`);
      fetchProjects();
    } catch (error) {
      toast.error(error.response?.data?.error || "Error performing bulk delete. Make sure you have SuperAdmin privileges.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(projects.map(p => p._id));
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
    else if (val === "title-asc") { setSortBy("title"); setSortOrder("asc"); }
    else if (val === "title-desc") { setSortBy("title"); setSortOrder("desc"); }
    setPage(1);
  };

  return (
    <div className="p-8 space-y-6 max-w-6xl mx-auto">
      {/* Header Bar */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-slate-100 uppercase">Projects Registry</h1>
          <p className="text-xs text-slate-400 mt-1">Manage Snortweb showcase portfolio entries</p>
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
            to="/projects/add"
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 px-4 py-2.5 rounded font-bold text-xs tracking-wider uppercase flex items-center gap-2 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add Project</span>
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
            placeholder="Search by title or tags..."
            className="w-full bg-slate-950 border border-slate-800 rounded px-3 py-2 pl-9 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div className="flex gap-4">
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer transition-colors"
          >
            <option value="All">All Categories</option>
            <option value="Web Development">Web Development</option>
            <option value="Mobile App">Mobile App</option>
            <option value="UI/UX Design">UI/UX Design</option>
            <option value="SEO">SEO</option>
            <option value="Other">Other</option>
          </select>
          <select
            onChange={handleSortChange}
            className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer transition-colors"
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
              <th className="py-4.5 px-6 w-12">
                <input
                  type="checkbox"
                  checked={projects.length > 0 && selectedIds.length === projects.length}
                  onChange={handleSelectAll}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-amber-500 focus:ring-amber-500 focus:ring-offset-slate-950 cursor-pointer"
                />
              </th>
              <th className="py-4.5 px-6">Title</th>
              <th className="py-4.5 px-6">Category</th>
              <th className="py-4.5 px-6">Tech Stack</th>
              <th className="py-4.5 px-6">Links</th>
              <th className="py-4.5 px-6 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="animate-pulse bg-slate-900/50">
                  <td className="py-4.5 px-6"><div className="w-4 h-4 bg-slate-800 rounded"></div></td>
                  <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-3/4"></div></td>
                  <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-1/2"></div></td>
                  <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-2/3"></div></td>
                  <td className="py-4.5 px-6"><div className="w-4 h-4 bg-slate-800 rounded"></div></td>
                  <td className="py-4.5 px-6"><div className="h-4 bg-slate-800 rounded w-8 ml-auto"></div></td>
                </tr>
              ))
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan="6" className="py-16 px-6 text-center text-slate-500">
                  <div className="flex flex-col items-center justify-center space-y-3">
                    <AlertTriangle className="w-8 h-8 text-slate-600" />
                    <p className="font-mono">No projects found matching the criteria.</p>
                  </div>
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <ProjectRow 
                  key={project._id} 
                  project={project} 
                  isSelected={selectedIds.includes(project._id)}
                  onSelect={handleSelectOne}
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
