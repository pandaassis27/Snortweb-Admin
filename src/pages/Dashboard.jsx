import React, { useState, useEffect, useRef } from "react";
import { dashboardAPI } from "../services/api";
import { 
  Briefcase, MessageSquare, ShieldCheck, Inbox, 
  RefreshCw, Activity, Server, Database, HardDrive, Users
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import toast from "react-hot-toast";

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-700 p-3 rounded shadow-xl">
        <p className="text-slate-300 text-xs font-bold mb-1">{label}</p>
        <p className="text-purple-400 font-mono text-[11px]">
          Volume: {payload[0].value} messages
        </p>
      </div>
    );
  }
  return null;
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalProjects: 0,
    totalReviews: 0,
    approvedReviews: 0,
    pendingReviews: 0,
    totalInquiries: 0,
    unreadInquiries: 0,
    totalMedia: 0,
    totalAdmins: 0,
  });
  
  const [recentActivity, setRecentActivity] = useState({
    projects: [],
    reviews: [],
    inquiries: [],
    logs: [],
  });
  
  const [charts, setCharts] = useState({
    weeklyInquiries: [],
  });
  
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const abortControllerRef = useRef(null);

  const fetchDashboardData = async (isInitial = false) => {
    if (document.hidden) return; // Optimization: don't poll if hidden
    
    if (isInitial && abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    if (isInitial) abortControllerRef.current = new AbortController();

    if (isInitial) setLoading(true);
    
    try {
      const { data } = await dashboardAPI.getStats({
        signal: isInitial ? abortControllerRef.current?.signal : undefined
      });
      
      setStats(data.stats);
      setRecentActivity(data.recentActivity);
      setCharts(data.charts);
      
    } catch (error) {
      if (error.name !== "CanceledError") {
        console.error("Dashboard stats fetch error:", error);
        if (isInitial) toast.error("Failed to load dashboard metrics");
      }
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
    return () => {
      if (abortControllerRef.current) abortControllerRef.current.abort();
    };
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 10000); // 10s refresh rate
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const statCards = [
    { title: "Total Projects", value: stats.totalProjects, icon: Briefcase, color: "bg-blue-500/10 border-blue-500/30 text-blue-500" },
    { title: "Total Reviews", value: stats.totalReviews, icon: MessageSquare, color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500" },
    { title: "Approved Reviews", value: stats.approvedReviews, icon: ShieldCheck, color: "bg-amber-500/10 border-amber-500/30 text-amber-500" },
    { title: "Pending Reviews", value: stats.pendingReviews, icon: ShieldCheck, color: "bg-red-500/10 border-red-500/30 text-red-500" },
    { title: "Total Inquiries", value: stats.totalInquiries, icon: Inbox, color: "bg-purple-500/10 border-purple-500/30 text-purple-500" },
    { title: "New Inquiries", value: stats.unreadInquiries, icon: Inbox, color: "bg-pink-500/10 border-pink-500/30 text-pink-500" },
    { title: "Uploaded Media", value: stats.totalMedia, icon: HardDrive, color: "bg-indigo-500/10 border-indigo-500/30 text-indigo-500" },
    { title: "Total Admins", value: stats.totalAdmins, icon: Users, color: "bg-cyan-500/10 border-cyan-500/30 text-cyan-500" },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 font-mono text-xs">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-6 h-6 animate-spin text-amber-500" />
          <span>LOADING CONSOLE METRICS...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 pb-2 border-b border-slate-800/60">
        <div>
          <h1 className="text-xl font-bold tracking-wider text-slate-100 uppercase">Dashboard Metrics</h1>
          <p className="text-xs text-slate-400 mt-1">Real-time status overview of Snortweb systems</p>
        </div>
        <div className="flex items-center gap-3">
          <RefreshCw className={`w-3.5 h-3.5 text-slate-500 ${autoRefresh ? "animate-spin text-amber-500" : ""}`} />
          <label className="inline-flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={() => setAutoRefresh(!autoRefresh)}
              className="sr-only peer"
            />
            <div className="w-8 h-4 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-300 after:border after:rounded-full after:height-3 after:width-3 after:transition-all peer-checked:bg-amber-500 peer-checked:after:bg-slate-950 peer-checked:after:border-slate-950 relative after:h-3 after:w-3"></div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 peer-checked:text-amber-500">
              Auto-Refresh
            </span>
          </label>
        </div>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`p-4 md:p-6 border rounded-lg bg-slate-900 flex items-center justify-between shadow-md ${card.color.split(" ")[1]}`}
            >
              <div>
                <span className="text-[9px] md:text-[10px] uppercase font-bold tracking-wider text-slate-400 block truncate">{card.title}</span>
                <span className="text-xl md:text-3xl font-extrabold text-slate-100 mt-1 block">{card.value}</span>
              </div>
              <div className={`p-3 md:p-4 border rounded-lg ${card.color.split(" ")[0]} ${card.color.split(" ")[2]}`}>
                <Icon className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Analytics Chart */}
        <div className="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-md flex flex-col">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-6">
            <div>
              <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase">Weekly Inquiries Volume</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">Total incoming messages plotted over the last 7 days</p>
            </div>
            <span className="text-[9px] font-mono font-bold tracking-widest uppercase bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded flex items-center gap-1.5">
              <Activity className="w-3 h-3" />
              Live Feed
            </span>
          </div>

          <div className="w-full h-[300px] flex-1">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.weeklyInquiries} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="day" stroke="#64748b" tick={{fill: '#64748b', fontSize: 10, fontFamily: 'monospace'}} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" tick={{fill: '#64748b', fontSize: 10, fontFamily: 'monospace'}} tickLine={false} axisLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#a855f7" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorCount)" 
                  activeDot={{ r: 6, fill: '#c084fc', stroke: '#1e1b4b', strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* System Health Widget */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex flex-col">
          <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-6">
            <div>
              <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase">System Status</h2>
              <p className="text-[10px] text-slate-400 mt-0.5">API and Database Health</p>
            </div>
            <span className="flex h-3 w-3 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>
          
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-300 font-bold flex items-center gap-2"><Server className="w-4 h-4 text-emerald-500"/> API Server</span>
                <span className="text-emerald-500 font-mono">Online</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            
            <div>
              <div className="flex justify-between text-xs mb-2">
                <span className="text-slate-300 font-bold flex items-center gap-2"><Database className="w-4 h-4 text-emerald-500"/> Database</span>
                <span className="text-emerald-500 font-mono">Connected</span>
              </div>
              <div className="w-full bg-slate-800 rounded-full h-1.5">
                <div className="bg-emerald-500 h-1.5 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>

            <div className="mt-8">
              <h3 className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-4">Recent Audit Activity</h3>
              <div className="space-y-3">
                {recentActivity.logs.length === 0 ? (
                  <p className="text-slate-500 text-xs font-mono text-center">No activity logged.</p>
                ) : (
                  recentActivity.logs.slice(0, 4).map((log, idx) => (
                    <div key={idx} className="flex gap-3">
                      <div className="w-2 h-2 mt-1.5 rounded-full bg-slate-700 shrink-0"></div>
                      <div>
                        <p className="text-[11px] text-slate-300">
                          <span className="text-amber-500">{log.admin?.username || 'System'}</span> {log.action.toLowerCase().replace(/_/g, ' ')}
                        </p>
                        <p className="text-[9px] font-mono text-slate-500 mt-0.5">
                          {new Date(log.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lists Summary Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-12">
        {/* Recent Projects */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase">Recent Projects</h2>
              <Briefcase className="text-slate-500 w-4 h-4" />
            </div>
            <div className="space-y-4">
              {recentActivity.projects.length === 0 ? (
                <div className="text-slate-500 text-xs py-4 font-mono text-center">No projects added yet</div>
              ) : (
                recentActivity.projects.map((project) => (
                  <div key={project._id} className="flex justify-between items-center bg-slate-950 p-3.5 border border-slate-800 rounded">
                    <div>
                      <div className="text-xs font-bold text-slate-200">{project.title}</div>
                      <div className="text-[10px] text-amber-500 font-mono mt-0.5">{project.category}</div>
                    </div>
                    <span className="text-[9px] font-mono text-slate-500">
                      {new Date(project.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Reviews */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase">Recent Reviews</h2>
              <MessageSquare className="text-slate-500 w-4 h-4" />
            </div>
            <div className="space-y-4">
              {recentActivity.reviews.length === 0 ? (
                <div className="text-slate-500 text-xs py-4 font-mono text-center">No reviews added yet</div>
              ) : (
                recentActivity.reviews.map((review) => (
                  <div key={review._id} className="bg-slate-950 p-3.5 border border-slate-800 rounded space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-bold text-slate-200">{review.clientName}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {review.clientDesignation} at {review.clientCompany || "Freelance"}
                        </div>
                      </div>
                      <span className={`text-[8px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${
                        review.approved ? "bg-emerald-500/10 text-emerald-500" : "bg-red-500/10 text-red-500"
                      }`}>
                        {review.approved ? "Approved" : "Pending"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 italic leading-relaxed truncate">"{review.comment}"</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Recent Inquiries */}
        <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-800 mb-4">
              <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase">Recent Inquiries</h2>
              <Inbox className="text-slate-500 w-4 h-4" />
            </div>
            <div className="space-y-4">
              {recentActivity.inquiries.length === 0 ? (
                <div className="text-slate-500 text-xs py-4 font-mono text-center">No inquiries received yet</div>
              ) : (
                recentActivity.inquiries.map((inquiry) => (
                  <div key={inquiry._id} className="bg-slate-950 p-3.5 border border-slate-800 rounded space-y-2">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="text-xs font-bold text-slate-200">{inquiry.name}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {inquiry.company ? `${inquiry.company} | ` : ""}{inquiry.service}
                        </div>
                      </div>
                      <span className={`text-[8px] font-mono font-bold tracking-widest uppercase px-2 py-0.5 rounded-full ${
                        inquiry.read ? "bg-slate-800 text-slate-400" : "bg-purple-500/10 text-purple-400"
                      }`}>
                        {inquiry.read ? "Read" : "New"}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 italic leading-relaxed truncate">"{inquiry.message}"</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
