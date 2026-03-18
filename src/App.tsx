import React, { useState } from 'react';
import { Screen } from './types';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MandiPrices from './components/MandiPrices';
import DiseaseDetection from './components/DiseaseDetection';
import KnowledgeHub from './components/KnowledgeHub';
import Chatbot from './components/Chatbot';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import { AnimatePresence, motion } from 'motion/react';

function AppShell() {
  const { user, isLoading } = useAuth();
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');
  const [authView, setAuthView] = useState<'login' | 'register'>('login');
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(true);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-emerald-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-500 text-sm">Loading AgroCare…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={authView}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
        >
          {authView === 'login' ? (
            <Login onSwitchToRegister={() => setAuthView('register')} />
          ) : (
            <Register onSwitchToLogin={() => setAuthView('login')} />
          )}
        </motion.div>
      </AnimatePresence>
    );
  }

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <Dashboard setActiveScreen={setActiveScreen} />;
      case 'mandi-prices':
        return <MandiPrices />;
      case 'disease-detection':
        return <DiseaseDetection />;
      case 'education':
        return <KnowledgeHub />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 font-sans text-slate-900 antialiased">
      <Sidebar
        activeScreen={activeScreen}
        setActiveScreen={setActiveScreen}
        isExpanded={isSidebarExpanded}
        onToggleExpand={() => setIsSidebarExpanded((prev) => !prev)}
      />

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <Header />

        <div className="flex-1 overflow-hidden relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeScreen}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full overflow-y-auto"
            >
              {renderScreen()}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <Chatbot />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}
