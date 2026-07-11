import React, { Suspense, lazy } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Sidebar from "./components/Sidebar";
import Login from "./pages/Login";

// Lazy loading dashboard components
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProjectsList = lazy(() => import("./pages/ProjectsList"));
const ProjectForm = lazy(() => import("./pages/ProjectForm"));
const ReviewsList = lazy(() => import("./pages/ReviewsList"));
const ReviewForm = lazy(() => import("./pages/ReviewForm"));
const InquiriesList = lazy(() => import("./pages/InquiriesList"));
const Settings = lazy(() => import("./pages/Settings"));
const MediaManager = lazy(() => import("./pages/MediaManager"));
const AuditLogs = lazy(() => import("./pages/AuditLogs"));

// Loading fallback for Suspense
const LoadingFallback = () => (
  <div className="min-h-screen bg-[#151619] flex items-center justify-center text-amber-500 font-mono text-xs select-none">
    <div className="animate-pulse flex gap-2 items-center">
      <div className="w-4 h-4 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      LOADING MODULE...
    </div>
  </div>
);

function ProtectedLayout() {
  const { isAuthenticated, loading, admin } = useAuth();

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

  // Role-Based Access Control Example: Superadmin only settings
  const RequireSuperadmin = ({ children }) => {
    if (admin?.role !== "superadmin") {
      return (
        <div className="p-8 text-red-400 font-mono text-sm">
          ACCESS DENIED: SUPERADMIN PRIVILEGES REQUIRED
        </div>
      );
    }
    return children;
  };

  return (
    <div className="flex bg-[#151619] min-h-screen font-sans">
      <Sidebar />
      <main className="flex-1 overflow-y-auto max-h-screen relative">
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/projects" element={<ProjectsList />} />
            <Route path="/projects/add" element={<ProjectForm />} />
            <Route path="/projects/edit/:id" element={<ProjectForm />} />
            <Route path="/reviews" element={<ReviewsList />} />
            <Route path="/reviews/add" element={<ReviewForm />} />
            <Route path="/reviews/edit/:id" element={<ReviewForm />} />
            <Route path="/inquiries" element={<InquiriesList />} />
            <Route path="/media" element={<MediaManager />} />
            <Route path="/audit-logs" element={
              <RequireSuperadmin>
                <AuditLogs />
              </RequireSuperadmin>
            } />
            
            {/* Restricted Route */}
            <Route path="/settings" element={
              <RequireSuperadmin>
                <Settings />
              </RequireSuperadmin>
            } />
            
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Suspense>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<ProtectedLayout />} />
        </Routes>
      </AuthProvider>
    </ErrorBoundary>
  );
}
