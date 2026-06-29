import React from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LayoutDashboard, Briefcase, MessageSquare, LogOut, Shield, Inbox } from "lucide-react";

export default function Sidebar() {
  const { logout, admin } = useAuth();

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Projects", path: "/projects", icon: Briefcase },
    { name: "Reviews", path: "/reviews", icon: MessageSquare },
    { name: "Inquiries", path: "/inquiries", icon: Inbox },
  ];

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen text-slate-300">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 flex items-center gap-3.5 w-full">
        <img
          src="/logo-icon.png"
          alt="Snortweb Logo Icon"
          className="h-8 w-8 object-contain"
        />
        <div className="text-left">
          <h1 className="font-bold text-sm tracking-widest text-slate-100 uppercase">Snortweb</h1>
          <span className="text-[9px] text-amber-500 font-bold tracking-widest uppercase">Admin Panel</span>
        </div>
      </div>

      {/* User Info */}
      <div className="px-6 py-4 border-b border-slate-800">
        <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Signed in as</span>
        <div className="font-semibold text-slate-200 text-xs truncate mt-0.5">{admin?.username || "Admin"}</div>
        <div className="text-[10px] text-slate-400 truncate">{admin?.email}</div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-1.5">
        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3.5 px-4 py-3 rounded-md text-xs font-bold tracking-wider uppercase transition-colors ${
                  isActive
                    ? "bg-amber-500 text-slate-950"
                    : "hover:bg-slate-800 text-slate-400 hover:text-slate-200"
                }`
              }
            >
              <Icon className="w-4.5 h-4.5" />
              <span>{item.name}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-slate-800">
        <button
          onClick={logout}
          className="flex items-center gap-3.5 w-full px-4 py-3 text-xs font-bold tracking-wider uppercase rounded-md text-slate-400 hover:bg-red-950/40 hover:text-red-400 transition-colors cursor-pointer"
        >
          <LogOut className="w-4.5 h-4.5" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
