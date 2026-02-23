
import React, { useState } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Trello, Users, UserCircle, Settings, BrainCircuit, Sun, Moon, Wifi, WifiOff, LogOut, Lightbulb, BellRing, Menu, X, CalendarDays } from 'lucide-react';
import { useCRM } from '../contexts/CRMContext';
import { useTheme } from '../contexts/ThemeContext';
import AICompanion from './AICompanion';
import { motion, AnimatePresence } from 'framer-motion';

const Layout: React.FC = () => {
  const { currentUser, isOnline, signOut, hasNewInsights, markInsightsAsRead } = useCRM();
  const { isDarkMode, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleInsightsClick = () => {
    markInsightsAsRead();
    navigate('/insights');
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => setIsMobileMenuOpen(!isMobileMenuOpen);
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  if (!currentUser) return null;

  const isPipeline = location.pathname === '/pipeline';

  const navItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/pipeline', icon: Trello, label: 'Pipeline' },
    { to: '/leads', icon: Users, label: 'Leads' },
    { to: '/schedule', icon: CalendarDays, label: 'Agendamentos' },
    { to: '/insights', icon: Lightbulb, label: 'Insights e Melhorias' },
    ...(currentUser.role === 'admin' ? [{ to: '/admin', icon: Settings, label: 'Admin' }] : []),
  ];

  const getTitle = () => {
    const path = location.pathname.substring(1);
    if (path === 'insights') return 'Insights';
    if (path === 'schedule') return 'Agendamentos';
    return path.charAt(0).toUpperCase() + path.slice(1);
  };

  const sidebarVariants = {
    expanded: { width: "16rem" }, // 64 = 16rem
    collapsed: { width: "5rem" },  // 20 = 5rem (md:w-20)
    mobileOpen: { x: 0, width: "16rem" },
    mobileClosed: { x: "-100%", width: "16rem" }
  };

  // Determine current state based on props
  const getSidebarState = () => {
    if (window.innerWidth < 768) { // Mobile check (approximate, relying on CSS media queries mostly but needed for variants)
      return isMobileMenuOpen ? "mobileOpen" : "mobileClosed";
    }
    return isPipeline ? "collapsed" : "expanded";
  };

  // Simplified logic: We let CSS handle desktop responsive "mode" switch (md:...) but use Motion for smooth width
  // Actually, mixing CSS media queries and Framer Motion width is tricky. 
  // Let's stick to CSS for the responsive layout structure but use Glass classes.
  // We will use Motion mainly for the mobile menu slide and general appear.

  return (
    <div className="flex h-screen overflow-hidden bg-background transition-colors duration-300">
      {/* Mobile Backdrop */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-sm"
            onClick={closeMobileMenu}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`
          fixed md:relative inset-y-0 left-0 z-40
          bg-white/80 dark:bg-zinc-900/80 backdrop-blur-xl border-r border-white/20 dark:border-white/5
          flex flex-col transition-all duration-500 ease-[cubic-bezier(0.25,1,0.5,1)]
          ${isMobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full w-64'} 
          ${isPipeline ? 'md:w-20' : 'md:w-64'}
          md:translate-x-0
        `}
      >
        {/* Sidebar Header */}
        <div className={`p-6 ${isPipeline ? 'md:flex md:justify-center md:px-0' : ''} flex justify-between items-start md:block`}>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-3 justify-start overflow-hidden">
              <motion.div
                whileHover={{ scale: 1.05 }}
                className="p-2 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-xl shadow-lg shadow-indigo-500/30 shrink-0"
              >
                <BrainCircuit className="w-6 h-6 text-white" />
              </motion.div>

              {(!isPipeline || isMobileMenuOpen) && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="leading-none"
                >
                  <h1 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-white">
                    CRM
                  </h1>
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-500 to-violet-500 text-sm font-bold tracking-widest">
                    OFICIAL
                  </span>
                </motion.div>
              )}
            </div>

            {(!isPipeline || isMobileMenuOpen) && (
              <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full w-fit ${isOnline ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}>
                <motion.div
                  animate={isOnline ? { scale: [1, 1.2, 1] } : {}}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}
                />
                {isOnline ? 'Online' : 'Offline'}
              </div>
            )}
          </div>
          <button onClick={closeMobileMenu} className="md:hidden text-zinc-500 hover:text-zinc-900 dark:hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 space-y-1.5 py-4 overflow-y-auto custom-scroll">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={closeMobileMenu}
              className={({ isActive }) =>
                `relative flex items-center gap-3 ${isPipeline ? 'md:justify-center md:px-0 md:py-3' : 'px-4 py-3'} 
                 rounded-xl transition-all duration-300 group
                 ${isActive
                  ? 'text-indigo-600 dark:text-white bg-indigo-50/50 dark:bg-white/5 shadow-sm border border-indigo-100 dark:border-white/5'
                  : 'text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-white/50 dark:hover:bg-white/5'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <item.icon className={`w-5 h-5 shrink-0 transition-transform duration-300 ${isActive ? 'scale-110' : 'group-hover:scale-105'}`} />
                  {(!isPipeline || isMobileMenuOpen) && (
                    <span className={`font-medium whitespace-nowrap overflow-hidden transition-all ${isActive ? 'translate-x-1' : ''}`}>
                      {item.label}
                    </span>
                  )}
                  {isActive && !isPipeline && <motion.div layoutId="activeNav" className="absolute left-0 w-1 h-8 bg-indigo-500 rounded-r-full" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Footer / Profile */}
        <div className="p-4 mt-auto border-t border-zinc-200/50 dark:border-white/5 space-y-2 bg-white/30 dark:bg-black/20 backdrop-blur-lg">
          <NavLink
            to="/profile"
            onClick={closeMobileMenu}
            className={({ isActive }) =>
              `flex items-center gap-3 ${isPipeline ? 'md:justify-center md:px-0 md:py-3' : 'px-4 py-3'} rounded-xl transition-all hover:bg-white/50 dark:hover:bg-white/5 ${isActive ? 'bg-white/50 dark:bg-white/10' : ''}`
            }
          >
            <UserCircle className="w-5 h-5 shrink-0 text-zinc-500 dark:text-zinc-400" />
            {(!isPipeline || isMobileMenuOpen) && <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">Meu Perfil</span>}
          </NavLink>

          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 ${isPipeline ? 'md:justify-center md:px-0 md:py-3' : 'px-4 py-3'} rounded-xl text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors`}
          >
            <LogOut className="w-5 h-5 shrink-0" />
            {(!isPipeline || isMobileMenuOpen) && <span className="text-sm font-medium">Sair</span>}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative transition-all duration-500 w-full bg-zinc-50/50 dark:bg-black">
        {/* Header */}
        <header className="h-16 md:h-20 border-b border-zinc-200 dark:border-white/5 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-xl flex items-center justify-between px-4 md:px-8 z-10 transition-colors duration-300 shrink-0">
          <div className="flex items-center gap-3">
            <button onClick={toggleMobileMenu} className="md:hidden p-2 -ml-2 text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg">
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex flex-col">
              <motion.h2
                key={location.pathname}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-lg md:text-xl font-bold text-zinc-900 dark:text-white"
              >
                {getTitle()}
              </motion.h2>
              {hasNewInsights && location.pathname !== '/insights' && (
                <div onClick={handleInsightsClick} className="flex items-center gap-1.5 text-[10px] md:text-xs font-bold text-indigo-600 dark:text-indigo-400 cursor-pointer animate-pulse hover:underline">
                  <BellRing className="w-3 h-3 fill-indigo-500/20" />
                  <span>Novos Insights!</span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3 md:gap-6 justify-end">
            <motion.button
              whileTap={{ scale: 0.9 }}
              onClick={toggleTheme}
              className="p-2.5 rounded-full text-zinc-500 hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400 bg-white dark:bg-white/5 border border-zinc-200 dark:border-white/5 shadow-sm hover:shadow-md transition-all"
            >
              {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </motion.button>

            <div className="flex items-center gap-3 pl-3 md:pl-6 border-l border-zinc-200 dark:border-white/5">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-zinc-900 dark:text-white leading-tight">{currentUser.name}</p>
                <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">{currentUser.role}</p>
              </div>
              <div className="gradient-border p-[2px] rounded-full">
                <div className="w-9 h-9 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center overflow-hidden border-2 border-white dark:border-zinc-900">
                  {currentUser.avatarUrl ? (
                    <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="font-bold text-indigo-600 dark:text-indigo-400">{currentUser.name.charAt(0)}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        </header>

        <div className={`flex-1 relative w-full ${isPipeline ? 'overflow-hidden' : 'overflow-auto p-4 md:p-8'}`}>
          <Outlet />
        </div>
        <AICompanion />
      </main>
    </div>
  );
};

export default Layout;
