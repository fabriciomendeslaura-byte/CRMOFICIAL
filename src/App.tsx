
import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { CRMProvider, useCRM } from './contexts/CRMContext';
import { ToastProvider } from './contexts/ToastContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ErrorBoundary } from './components/ErrorBoundary';
import Layout from './components/Layout';

// Lazy load pages for better initial load performance
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Pipeline = lazy(() => import('./pages/Pipeline'));
const Leads = lazy(() => import('./pages/Leads'));
const Schedule = lazy(() => import('./pages/Schedule'));
const Insights = lazy(() => import('./pages/Insights'));
const Admin = lazy(() => import('./pages/Admin'));
const Profile = lazy(() => import('./pages/Profile'));
const Login = lazy(() => import('./pages/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));

// Loading spinner for suspense fallback
const PageLoader: React.FC = () => (
  <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
    <div className="flex flex-col items-center gap-4">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Carregando...</p>
    </div>
  </div>
);

const AccessRoute: React.FC = () => {
  const { isLoading, currentUser } = useCRM();

  if (isLoading) {
    return <PageLoader />;
  }

  // Se não estiver logado e tentar acessar rota protegida, vai pro login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

const App: React.FC = () => {
  return (
    <ThemeProvider>
      <ToastProvider>
        <ErrorBoundary>
          <CRMProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/login" element={<Login />} />
                  <Route element={<AccessRoute />}>
                    <Route path="/" element={<Layout />}>
                      <Route index element={<Navigate to="/dashboard" replace />} />
                      <Route path="dashboard" element={<Dashboard />} />
                      <Route path="pipeline" element={<Pipeline />} />
                      <Route path="leads" element={<Leads />} />
                      <Route path="schedule" element={<Schedule />} />
                      <Route path="insights" element={<Insights />} />
                      <Route path="admin" element={<Admin />} />
                      <Route path="profile" element={<Profile />} />
                    </Route>
                  </Route>
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </CRMProvider>
        </ErrorBoundary>
      </ToastProvider>
    </ThemeProvider>
  );
};

export default App;
