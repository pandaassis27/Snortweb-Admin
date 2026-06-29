import React, { useState, useEffect } from "react";
import { projectAPI, reviewAPI, inquiryAPI } from "../services/api";
import { LayoutDashboard, Briefcase, MessageSquare, Clock, ShieldCheck, HelpCircle, Inbox, RefreshCw } from "lucide-react";

export default function Dashboard() {
  const [stats, setStats] = useState({
    projectsCount: 0,
    reviewsCount: 0,
    approvedReviewsCount: 0,
    inquiriesCount: 0,
    unreadInquiriesCount: 0,
    recentProjects: [],
    recentReviews: [],
    recentInquiries: [],
    allInquiries: [],
  });
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(true);

  const fetchDashboardData = async (isInitial = false) => {
    if (isInitial) setLoading(true);
    try {
      const [projectsRes, reviewsRes, inquiriesRes] = await Promise.all([
        projectAPI.getAll(),
        reviewAPI.getAll(),
        inquiryAPI.getAll(),
      ]);

      const projects = projectsRes.data;
      const reviews = reviewsRes.data;
      const inquiries = inquiriesRes.data;

      setStats({
        projectsCount: projects.length,
        reviewsCount: reviews.length,
        approvedReviewsCount: reviews.filter((r) => r.approved).length,
        inquiriesCount: inquiries.length,
        unreadInquiriesCount: inquiries.filter((i) => !i.read).length,
        recentProjects: projects.slice(0, 3),
        recentReviews: reviews.slice(0, 3),
        recentInquiries: inquiries.slice(0, 3),
        allInquiries: inquiries,
      });
    } catch (error) {
      console.error("Dashboard stats fetch error:", error.message);
    } finally {
      if (isInitial) setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData(true);
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      fetchDashboardData(false);
    }, 10000); // 10s refresh rate
    return () => clearInterval(interval);
  }, [autoRefresh]);

  const getWeeklyInquiryStats = () => {
    const days = [];
    const dateMap = {};

    // Get last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
      days.push(dateStr);
      dateMap[dateStr] = 0;
    }

    if (stats.allInquiries) {
      stats.allInquiries.forEach((inquiry) => {
        const date = new Date(inquiry.createdAt);
        const dateStr = date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
        if (dateMap[dateStr] !== undefined) {
          dateMap[dateStr]++;
        }
      });
    }

    return days.map((day) => ({
      day,
      count: dateMap[day] || 0,
    }));
  };

  const chartData = getWeeklyInquiryStats();
  const maxCount = Math.max(...chartData.map((d) => d.count), 5); // Default scale

  const statCards = [
    {
      title: "Total Projects",
      value: stats.projectsCount,
      icon: Briefcase,
      color: "bg-blue-500/10 border-blue-500/30 text-blue-500",
    },
    {
      title: "Client Reviews",
      value: stats.reviewsCount,
      icon: MessageSquare,
      color: "bg-emerald-500/10 border-emerald-500/30 text-emerald-500",
    },
    {
      title: "Approved Reviews",
      value: stats.approvedReviewsCount,
      icon: ShieldCheck,
      color: "bg-amber-500/10 border-amber-500/30 text-amber-500",
    },
    {
      title: "New Inquiries",
      value: stats.unreadInquiriesCount,
      icon: Inbox,
      color: "bg-purple-500/10 border-purple-500/30 text-purple-500",
    },
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full text-slate-400 font-mono text-xs">
        LOADING CONSOLE METRICS...
      </div>
    );
  }

  return (
    <div className="p-8 space-y-8 max-w-6xl">
      {/* Header */}
      <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.title}
              className={`p-6 border rounded-lg bg-slate-900 flex items-center justify-between shadow-md ${card.color.split(" ")[1]}`}
            >
              <div>
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 block">{card.title}</span>
                <span className="text-3xl font-extrabold text-slate-100 mt-1 block">{card.value}</span>
              </div>
              <div className={`p-4 border rounded-lg ${card.color.split(" ")[0]} ${card.color.split(" ")[2]}`}>
                <Icon className="w-6 h-6" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Analytics Chart */}
      <div className="bg-slate-900 border border-slate-800 rounded-lg p-6 shadow-md">
        <div className="flex justify-between items-center pb-4 border-b border-slate-800 mb-6">
          <div>
            <h2 className="text-sm font-bold tracking-wider text-slate-200 uppercase">Weekly Inquiries Volume</h2>
            <p className="text-[10px] text-slate-400 mt-0.5">Total incoming messages plotted over the last 7 days</p>
          </div>
          <span className="text-[9px] font-mono font-bold tracking-widest uppercase bg-purple-500/10 text-purple-400 px-2 py-0.5 rounded">
            Live Feed Analytics
          </span>
        </div>

        {/* Custom SVG Line/Area Chart */}
        <div className="w-full overflow-x-auto">
          <svg className="w-full min-w-[500px] h-48 select-none" viewBox="0 0 600 160">
            <defs>
              <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#a855f7" stopOpacity="0.2" />
                <stop offset="100%" stopColor="#a855f7" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
              const y = 15 + r * 105;
              return (
                <g key={i}>
                  <line x1="40" y1={y} x2="580" y2={y} stroke="#1e293b" strokeDasharray="3 3" />
                  <text x="32" y={y + 3} fill="#64748b" className="text-[9px] font-mono text-right" textAnchor="end">
                    {Math.round((1 - r) * maxCount)}
                  </text>
                </g>
              );
            })}

            {/* Area Path */}
            <path
              d={`M 40 120 ${chartData.map((d, i) => {
                const x = 40 + i * 90;
                const y = 120 - (d.count / maxCount) * 105;
                return `L ${x} ${y}`;
              }).join(" ")} L 580 120 Z`}
              fill="url(#chart-area-grad)"
            />

            {/* Line Path */}
            <path
              d={chartData.map((d, i) => {
                const x = 40 + i * 90;
                const y = 120 - (d.count / maxCount) * 105;
                return `${i === 0 ? "M" : "L"} ${x} ${y}`;
              }).join(" ")}
              fill="none"
              stroke="#a855f7"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Circles and Tooltips */}
            {chartData.map((d, i) => {
              const x = 40 + i * 90;
              const y = 120 - (d.count / maxCount) * 105;
              return (
                <g key={i} className="group/dot cursor-pointer">
                  <circle
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#151619"
                    stroke="#a855f7"
                    strokeWidth="2"
                    className="hover:r-5 hover:fill-purple-400 transition-all"
                  />
                  {/* Tooltip Background */}
                  <rect
                    x={x - 14}
                    y={y - 22}
                    width="28"
                    height="14"
                    rx="3"
                    fill="#1e1b4b"
                    stroke="#a855f7"
                    strokeWidth="0.5"
                    className="opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none"
                  />
                  {/* Tooltip text */}
                  <text
                    x={x}
                    y={y - 12}
                    fill="#c084fc"
                    className="text-[9px] font-mono font-bold opacity-0 group-hover/dot:opacity-100 transition-opacity pointer-events-none"
                    textAnchor="middle"
                  >
                    {d.count}
                  </text>
                  {/* X Axis Labels */}
                  <text x={x} y="140" fill="#64748b" className="text-[9px] font-mono" textAnchor="middle">
                    {d.day}
                  </text>
                </g>
              );
            })}
          </svg>
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
              {stats.recentProjects.length === 0 ? (
                <div className="text-slate-500 text-xs py-4 font-mono text-center">No projects added yet</div>
              ) : (
                stats.recentProjects.map((project) => (
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
              {stats.recentReviews.length === 0 ? (
                <div className="text-slate-500 text-xs py-4 font-mono text-center">No reviews added yet</div>
              ) : (
                stats.recentReviews.map((review) => (
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
              {stats.recentInquiries.length === 0 ? (
                <div className="text-slate-500 text-xs py-4 font-mono text-center">No inquiries received yet</div>
              ) : (
                stats.recentInquiries.map((inquiry) => (
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
