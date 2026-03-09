import React, { useState } from 'react';
import { Screen } from './types';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import MandiPrices from './components/MandiPrices';
import DiseaseDetection from './components/DiseaseDetection';
import KnowledgeHub from './components/KnowledgeHub';
import Chatbot from './components/Chatbot';
import { AnimatePresence, motion } from 'motion/react';

export default function App() {
  const [activeScreen, setActiveScreen] = useState<Screen>('dashboard');

  const renderScreen = () => {
    switch (activeScreen) {
      case 'dashboard':
        return <Dashboard />;
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
      <Sidebar activeScreen={activeScreen} setActiveScreen={setActiveScreen} />
      
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
