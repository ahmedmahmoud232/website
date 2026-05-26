import { useState } from 'react';
import { FirebaseProvider, useFirebase } from './components/FirebaseProvider';
import { Header } from './components/Header';
import { PlatformCard } from './components/PlatformCard';
import { PlatformDetails } from './components/PlatformDetails';
import { PlatformFormModal } from './components/PlatformFormModal';
import { AuthPage } from './components/AuthPage';
import { Sparkles, Award, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Platform } from './types';

function Dashboard() {
  const { platforms, loadingPlatforms, user, loadingAuth } = useFirebase();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPlatformId, setSelectedPlatformId] = useState<string | null>(null);
  const selectedPlatform = platforms.find((p) => p.id === selectedPlatformId) || null;

  const [platformToEdit, setPlatformToEdit] = useState<Platform | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  // Search and filter platforms list
  const filteredPlatforms = platforms.filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleAddPlatformClick = () => {
    setPlatformToEdit(null);
    setIsAddModalOpen(true);
  };

  const handleEditPlatformClick = (platform: Platform) => {
    setPlatformToEdit(platform);
    setIsAddModalOpen(true);
  };

  const handleCardAdviceClick = (platform: Platform) => {
    setSelectedPlatformId(platform.id);
  };

  if (loadingAuth) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-right" dir="rtl">
        <div className="space-y-4 text-center">
          <div className="h-10 w-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-500 text-xs font-semibold">جاري تحميل الجلسة والتحقق من الصلاحيات...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <AuthPage />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between selection:bg-blue-105 font-sans leading-normal">
      
      {/* 1. Header component - persistent on home directories index */}
      {!selectedPlatform && (
        <Header
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          onAddClick={handleAddPlatformClick}
          onSignInClick={() => {}}
        />
      )}

      {/* 2. Main content container */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        <AnimatePresence mode="wait">
          
          {selectedPlatform ? (
            
            /* Detailed View panel */
            <PlatformDetails
              key="details"
              platform={selectedPlatform}
              onBack={() => {
                setSelectedPlatformId(null);
              }}
              onEditClick={handleEditPlatformClick}
            />

          ) : (

            /* Home Platforms showcase Grid index */
            <motion.div
              key="list"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <div className="flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-blue-600 animate-pulse" />
                  <span className="text-xs font-bold text-slate-800">المنصات العربية المعروضة ({filteredPlatforms.length})</span>
                </div>
                <p className="text-[11px] text-slate-400 font-light hidden sm:block">تصفح وقارن واكتشف الجودة الرقمية</p>
              </div>

              {loadingPlatforms ? (
                <div className="flex flex-col items-center justify-center py-20 space-y-3">
                  <div className="h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-400 text-xs">جاري جلب المنصات وتوليد دليل التصفح...</p>
                </div>
              ) : filteredPlatforms.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center max-w-md mx-auto space-y-3 shadow-xs">
                  <div className="bg-slate-50 h-12 w-12 rounded-xl flex items-center justify-center mx-auto text-slate-400">
                    <Info className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-bold text-slate-850 text-sm">لا توجد نتائج مطابقة</h4>
                    <p className="text-xs text-slate-400 leading-relaxed font-light">
                      لم يتم العثور على منصات معلنة تناسب الكلمة المكتوبة "{searchTerm}" حالياً.
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      setSearchTerm('');
                      setSelectedCategory('all');
                    }}
                    className="text-xs text-blue-600 hover:text-blue-700 font-bold cursor-pointer"
                  >
                    عرض جميع المنصات
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {filteredPlatforms.map((platform) => (
                    <PlatformCard
                      key={platform.id}
                      platform={platform}
                      onSelect={() => setSelectedPlatformId(platform.id)}
                      onAddAdviceClick={() => handleCardAdviceClick(platform)}
                      onEditClick={handleEditPlatformClick}
                    />
                  ))}
                </div>
              )}

            </motion.div>
          )}

        </AnimatePresence>
      </main>

      {/* 3. Footer styled to follow Clean Minimalism */}
      <footer className="bg-white text-slate-500 border-t border-slate-200 py-8 mt-12 relative overflow-hidden" id="main_footer">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-6 relative z-10 text-right">
          
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="font-bold text-slate-850 text-sm">منصَّات دليل المشاريع الرقمية</span>
            </div>
            <p className="text-slate-400 text-xs font-light max-w-md leading-relaxed">
              مشروع ريادي عربي متكامل لتسليط الضوء على الحلول الابتكارية المميزة ودعم مطوري الويب وتجارة الخدمات وفق المعايير العالمية.
            </p>
          </div>

          <div className="flex flex-col items-end gap-1 text-[11px] font-light">
            <div className="flex items-center gap-1.5 text-slate-650">
              <span>تطوير وإرشاد طبقاً لمعايير</span>
              <Award className="h-3.5 w-3.5 text-blue-600" />
              <span className="font-bold text-blue-600">Nielsen Heuristics</span>
            </div>
            <p className="text-slate-400">
              جميع الحقوق محفوظة منصَّات © ٢٠٢٦ م
            </p>
          </div>

        </div>
      </footer>

      {/* Product Submission Modal Form */}
      <PlatformFormModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setPlatformToEdit(null);
        }}
        platformToEdit={platformToEdit}
      />

    </div>
  );
}

export default function App() {
  return (
    <FirebaseProvider>
      <Dashboard />
    </FirebaseProvider>
  );
}
