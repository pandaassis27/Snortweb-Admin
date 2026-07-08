import React, { useState, useEffect } from "react";
import API from "../services/api";
import { Link2, Plus, Trash2, Save, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

export default function Settings() {
  const { token } = useAuth();
  const [socialLinks, setSocialLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [newLink, setNewLink] = useState({ platform: "", url: "", icon: "linkedin" });
  const [isAdding, setIsAdding] = useState(false);

  const iconsList = ["linkedin", "twitter", "github", "instagram", "facebook", "youtube"];

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await API.get("/settings");
      if (res.data && res.data.socialLinks) {
        setSocialLinks(res.data.socialLinks);
      }
    } catch (err) {
      setError("Failed to fetch settings.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (updatedLinks) => {
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const res = await API.put("/settings", { socialLinks: updatedLinks });
      setSocialLinks(res.data.socialLinks);
      setSuccess("Settings saved successfully.");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Failed to save settings.");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const addLink = () => {
    if (!newLink.platform || !newLink.url) {
      setError("Platform and URL are required.");
      return;
    }
    const updated = [...socialLinks, newLink];
    handleSave(updated);
    setIsAdding(false);
    setNewLink({ platform: "", url: "", icon: "linkedin" });
  };

  const removeLink = (index) => {
    const updated = socialLinks.filter((_, i) => i !== index);
    handleSave(updated);
  };

  if (loading) {
    return (
      <div className="p-8 text-slate-400 font-mono text-sm flex items-center justify-center min-h-[50vh]">
        <div className="animate-pulse">Loading settings...</div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-4xl mx-auto w-full">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-100 tracking-wider flex items-center gap-3">
          <Link2 className="w-6 h-6 text-amber-500" />
          Settings
        </h1>
        <p className="text-slate-400 text-sm mt-2">Manage website global settings.</p>
      </div>

      {error && <div className="mb-6 p-4 bg-red-950/40 border border-red-900/50 rounded-lg text-red-400 text-sm font-semibold">{error}</div>}
      {success && <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-900/50 rounded-lg text-emerald-400 text-sm font-semibold">{success}</div>}

      <div className="bg-slate-900 border border-slate-800 rounded-lg overflow-hidden shadow-xl">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-100">Social Media Links</h2>
            <p className="text-xs text-slate-400 mt-1">These links appear in the footer and contact page.</p>
          </div>
          <button
            onClick={() => setIsAdding(!isAdding)}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center gap-2"
          >
            {isAdding ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {isAdding ? "Cancel" : "Add Link"}
          </button>
        </div>

        {isAdding && (
          <div className="p-6 border-b border-slate-800 bg-slate-800/50">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Platform Name</label>
                <input
                  type="text"
                  value={newLink.platform}
                  onChange={(e) => setNewLink({ ...newLink, platform: e.target.value })}
                  placeholder="e.g. LinkedIn"
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-slate-200 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">URL</label>
                <input
                  type="url"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder="https://..."
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-slate-200 text-sm focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Icon</label>
                <select
                  value={newLink.icon}
                  onChange={(e) => setNewLink({ ...newLink, icon: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded p-2.5 text-slate-200 text-sm focus:border-amber-500 focus:outline-none"
                >
                  {iconsList.map(icon => (
                    <option key={icon} value={icon}>{icon}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="mt-4 flex justify-end">
              <button
                onClick={addLink}
                disabled={saving}
                className="px-6 py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-950 font-bold text-xs uppercase tracking-wider rounded transition-colors flex items-center gap-2"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Link"}
              </button>
            </div>
          </div>
        )}

        <div className="divide-y divide-slate-800">
          {socialLinks.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm italic">No social links added yet.</div>
          ) : (
            socialLinks.map((link, index) => (
              <div key={index} className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-800/30 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded bg-slate-800 flex items-center justify-center text-amber-500 font-bold uppercase text-xs">
                    {link.icon.substring(0, 2)}
                  </div>
                  <div>
                    <h3 className="text-slate-200 font-bold text-sm">{link.platform}</h3>
                    <a href={link.url} target="_blank" rel="noreferrer" className="text-slate-400 text-xs hover:text-amber-500 transition-colors">
                      {link.url}
                    </a>
                  </div>
                </div>
                <button
                  onClick={() => removeLink(index)}
                  disabled={saving}
                  className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-400/10 rounded transition-colors"
                  title="Remove Link"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
