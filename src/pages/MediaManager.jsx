import React, { useState, useEffect, useRef, useCallback } from "react";
import { mediaAPI } from "../services/api";
import { UploadCloud, Search, Trash2, Copy, FileText, Image as ImageIcon, Video, Box, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";

export default function MediaManager() {
  const [media, setMedia] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Pagination & Filters
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  
  // Upload State
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  
  const fileInputRef = useRef(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1); // Reset to first page on search
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchMedia = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await mediaAPI.getAll({
        page,
        limit: 10,
        search: debouncedSearch,
        type: selectedType
      });
      setMedia(data.media);
      setTotalPages(data.pages || 1);
    } catch (err) {
      console.error(err);
      setError("Failed to load media gallery.");
    } finally {
      setLoading(false);
    }
  }, [page, debouncedSearch, selectedType]);

  useEffect(() => {
    fetchMedia();
  }, [fetchMedia]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUpload(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleUpload(e.target.files);
    }
  };

  const handleUpload = async (files) => {
    const formData = new FormData();
    let hasValidFiles = false;

    // Validate size on frontend before sending
    for (let i = 0; i < files.length; i++) {
      if (files[i].size > 50 * 1024 * 1024) {
        toast.error(`${files[i].name} is too large. Max 50MB.`);
        continue;
      }
      formData.append("files", files[i]);
      hasValidFiles = true;
    }

    if (!hasValidFiles) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      await mediaAPI.upload(formData, {
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadProgress(percentCompleted);
        }
      });
      toast.success("Media uploaded successfully!");
      setPage(1);
      fetchMedia();
    } catch (err) {
      toast.error(err.response?.data?.message || "Upload failed.");
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this media file permanently?")) {
      try {
        await mediaAPI.delete(id);
        toast.success("Media deleted.");
        fetchMedia();
      } catch (err) {
        toast.error("Failed to delete media.");
      }
    }
  };

  const copyToClipboard = (url) => {
    // Generate full URL based on the API base or keep it relative based on requirements.
    // The backend stores url like "/uploads/xxx.jpg". We'll construct full URL assuming standard setup.
    const fullUrl = `${window.location.origin}${url}`;
    navigator.clipboard.writeText(fullUrl);
    toast.success("URL copied to clipboard!");
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (type) => {
    switch (type) {
      case "image": return <ImageIcon className="w-5 h-5 text-blue-400" />;
      case "video": return <Video className="w-5 h-5 text-purple-400" />;
      case "3d_model": return <Box className="w-5 h-5 text-amber-400" />;
      default: return <FileText className="w-5 h-5 text-slate-400" />;
    }
  };

  return (
    <div className="p-8 space-y-6 max-w-7xl mx-auto">
      <div>
        <h1 className="text-xl font-bold tracking-wider text-slate-100 uppercase">Media Manager</h1>
        <p className="text-xs text-slate-400 mt-1">Upload and manage application assets centrally.</p>
      </div>

      {/* Upload Zone */}
      <div 
        className={`border-2 border-dashed rounded-lg p-10 flex flex-col items-center justify-center transition-colors cursor-pointer relative overflow-hidden ${
          isDragging ? "border-amber-500 bg-amber-500/10" : "border-slate-700 bg-slate-900/50 hover:bg-slate-900"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        <input 
          type="file" 
          multiple 
          className="hidden" 
          ref={fileInputRef} 
          onChange={handleFileInput}
          accept=".jpg,.jpeg,.png,.webp,.svg,.mp4,.glb,.gltf"
          disabled={isUploading}
        />
        
        {isUploading ? (
          <div className="text-center w-full max-w-md">
            <UploadCloud className="w-12 h-12 text-amber-500 mx-auto mb-3 animate-pulse" />
            <p className="text-sm text-slate-300 font-bold tracking-widest uppercase mb-2">Uploading... {uploadProgress}%</p>
            <div className="w-full bg-slate-800 rounded-full h-2">
              <div className="bg-amber-500 h-2 rounded-full transition-all duration-300" style={{ width: `${uploadProgress}%` }}></div>
            </div>
          </div>
        ) : (
          <div className="text-center">
            <UploadCloud className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-sm text-slate-300 font-bold tracking-widest uppercase">Click or Drag & Drop to Upload</p>
            <p className="text-xs text-slate-500 mt-2 font-mono">JPG, PNG, WEBP, SVG, MP4, GLB (Max: 50MB)</p>
          </div>
        )}
      </div>

      {/* Filters and Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900 border border-slate-800 p-4 rounded-lg shadow-sm">
        <div className="flex-1 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by filename..."
            className="w-full bg-slate-950 border border-slate-800 rounded pl-10 pr-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <select
          value={selectedType}
          onChange={(e) => { setSelectedType(e.target.value); setPage(1); }}
          className="bg-slate-950 border border-slate-800 rounded px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-amber-500 cursor-pointer"
        >
          <option value="All">All Types</option>
          <option value="image">Images</option>
          <option value="video">Videos</option>
          <option value="3d_model">3D Models</option>
          <option value="document">Documents</option>
        </select>
      </div>

      {/* Media Table */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-md">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs text-slate-300">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                <th className="py-4 px-6 w-16">Preview</th>
                <th className="py-4 px-6">File Details</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Size</th>
                <th className="py-4 px-6">Uploaded At</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="py-4 px-6"><div className="w-10 h-10 bg-slate-800 rounded"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-48 mb-2"></div><div className="h-3 bg-slate-800 rounded w-32"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-16"></div></td>
                    <td className="py-4 px-6"><div className="h-4 bg-slate-800 rounded w-24"></div></td>
                    <td className="py-4 px-6"><div className="flex justify-end gap-2"><div className="w-8 h-8 bg-slate-800 rounded"></div><div className="w-8 h-8 bg-slate-800 rounded"></div></div></td>
                  </tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-red-400 font-mono">
                    {error}
                  </td>
                </tr>
              ) : media.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-slate-500 font-mono">
                    No media files found. Upload some to get started.
                  </td>
                </tr>
              ) : (
                media.map((item) => (
                  <tr key={item._id} className="hover:bg-slate-950/40 transition-colors">
                    <td className="py-3 px-6">
                      {item.type === "image" ? (
                        <div className="w-10 h-10 rounded border border-slate-700 overflow-hidden bg-slate-950 flex items-center justify-center">
                          <img src={item.webpUrl || item.url} alt={item.originalName} className="object-cover w-full h-full" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded border border-slate-700 bg-slate-950 flex items-center justify-center">
                          {getFileIcon(item.type)}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-6">
                      <div className="font-bold text-slate-200 truncate max-w-xs" title={item.originalName}>{item.originalName}</div>
                      <div className="text-[10px] font-mono text-slate-500 truncate max-w-xs">{item.url}</div>
                    </td>
                    <td className="py-3 px-6">
                      <span className="flex items-center gap-1.5 uppercase tracking-wider text-[10px] font-bold">
                        {getFileIcon(item.type)}
                        {item.type}
                      </span>
                    </td>
                    <td className="py-3 px-6 font-mono text-slate-400">{formatSize(item.size)}</td>
                    <td className="py-3 px-6 font-mono text-slate-400">{new Date(item.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => copyToClipboard(item.url)}
                          className="p-2 border border-slate-700 text-slate-300 hover:border-amber-500 hover:text-amber-500 rounded transition-colors"
                          title="Copy URL"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(item._id)}
                          className="p-2 border border-slate-700 text-slate-300 hover:border-red-500 hover:text-red-500 rounded transition-colors"
                          title="Delete Permanently"
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
