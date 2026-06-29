import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProjectsList from "./pages/ProjectsList";
import ProjectForm from "./pages/ProjectForm";
import ReviewsList from "./pages/ReviewsList";
import ReviewForm from "./pages/ReviewForm";
import InquiriesList from "./pages/InquiriesList";

function ProtectedLayout() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#151619] flex items-center justify-center text-slate-400 font-mono text-xs select-none">
        INITIALIZING CONSOLE INTERFACE...
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex bg-[#151619] min-h-screen font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto max-h-screen">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/projects" element={<ProjectsList />} />
          <Route path="/projects/add" element={<ProjectForm />} />
          <Route path="/projects/edit/:id" element={<ProjectForm />} />
          <Route path="/reviews" element={<ReviewsList />} />
          <Route path="/reviews/add" element={<ReviewForm />} />
          <Route path="/reviews/edit/:id" element={<ReviewForm />} />
          <Route path="/inquiries" element={<InquiriesList />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<ProtectedLayout />} />
      </Routes>
    </AuthProvider>
  );
}
