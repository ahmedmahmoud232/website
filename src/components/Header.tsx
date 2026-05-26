import React from 'react';
import { useFirebase } from './FirebaseProvider';
import { LogIn, LogOut, Search, Sparkles, Plus, Info } from 'lucide-react';

interface HeaderProps {
  searchTerm: string;
  setSearchTerm: (val: string) => void;
  selectedCategory: string;
  setSelectedCategory: (val: string) => void;
  onAddClick: () => void;
  onSignInClick: () => void;
}

const CATEGORIES = [
  { id: 'all', label: 'الكل' },
  { id: 'تعليم وتقنية', label: 'تعليم وتقنية' },
  { id: 'إنتاجية وتوظيف', label: 'إنتاجية وتوظيف' },
  { id: 'تجارة وأعمال', label: 'تجارة وأعمال' },
  { id: 'ذكاء اصطناعي', label: 'ذكاء اصطناعي' },
  { id: 'خدمات سحابية', label: 'خدمات سحابية' },
  { id: 'ترفيه ومجتمع', label: 'ترفيه ومجتمع' }
];

export const Header: React.FC<HeaderProps> = ({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  onAddClick,
  onSignInClick
}) => {
  const { user, signOut } = useFirebase();

  return (
    <header className="bg-white border-b border-slate-200/80 shadow-sm relative overflow-hidden" id="main_header">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 relative z-10">
        
        {/* Top bar */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5 border-b border-slate-100 pb-6">
          
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <div className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse" />
              <h1 className="text-2xl font-bold tracking-tight text-blue-600">منصَّات</h1>
              <span className="text-[10px] font-bold text-slate-400 border border-slate-200 px-1.5 py-0.5 rounded">دليل تفاعلي</span>
            </div>
            <p className="text-slate-500 text-xs sm:text-sm max-w-xl font-light leading-relaxed">
              دليل ومجتمع المنصات الرقمية العربية المميزة. اكتشف الأفكار المبتكرة، وشارك بالتصويت، وقدم نصائح تطويرية لرفع جودة تجربة المستخدم.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            {user ? (
              <div className="flex items-center gap-2.5 bg-slate-50 p-1 pr-3 rounded-xl border border-slate-200/60">
                <div className="text-right hidden sm:block">
                  <p className="text-[10px] text-slate-400">عضو مسجل</p>
                  <p className="text-xs font-semibold text-slate-800 leading-none">{user.displayName}</p>
                </div>
                {user.photoURL ? (
                  <img 
                    src={user.photoURL} 
                    alt={user.displayName || "صورة المستخدم"} 
                    className="h-8 w-8 rounded-lg ring-1 ring-slate-200"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="h-8 w-8 rounded-lg bg-blue-100 text-blue-600 font-bold flex items-center justify-center text-xs">
                    {user.displayName?.charAt(0) || "U"}
                  </div>
                )}
                <button
                  onClick={signOut}
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition-colors rounded-lg hover:bg-slate-200/30"
                  title="تسجيل الخروج"
                  id="sign_out_btn"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={onSignInClick}
                className="flex items-center gap-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 text-xs font-semibold cursor-pointer"
                id="sign_in_btn"
              >
                <LogIn className="w-4 h-4 text-blue-600" />
                <span>تسجيل الدخول / التسجيل</span>
              </button>
            )}
          </div>
        </div>

        {/* Searching and adding platform actions */}
        <div className="mt-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Searching and Categories filter */}
          <div className="flex-1 w-full md:max-w-lg">
            <div className="relative">
              <span className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                type="text"
                placeholder="ابحث عن منصات مفيدة في الدليل..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pr-9 pl-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all text-right"
                id="search_platforms_input"
              />
            </div>
          </div>

          {/* Add Platform CTA Button */}
          <button
            onClick={onAddClick}
            className="flex items-center justify-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-xl font-bold shadow transition-all text-xs hover:-translate-y-0.5 active:translate-y-0 cursor-pointer"
            id="open_add_platform_modal_btn"
          >
            <Plus className="h-4 w-4" />
            <span>أضف منصتك الآن</span>
          </button>
        </div>

        {/* Category Pill Buttons */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none scroll-smooth">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all border duration-200 cursor-pointer ${
                selectedCategory === cat.id
                  ? 'bg-blue-50 text-blue-600 border-blue-200/60 font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-slate-905'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Heuristic Evaluation Notice Banner */}
        <div className="mt-5 bg-blue-50/40 border border-blue-100 rounded-2xl p-4 flex items-start gap-2.5">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="text-xs font-bold text-blue-900">مبادئ جاكوب نيلسن العشرة لتجربة المستخدم (Jakob Nielsen)</h4>
            <p className="text-[11px] text-slate-500 leading-relaxed font-light">
              يُصمم الدليل على تفعيل المشاركة والنقد البناء لتطبيقات الويب العربية الرقمية. يمكنك ترك نصائح لتحسين تجربة المستخدم أو تمكين تدقيق الذكاء الاصطناعي لفهم نقاط القوة والضعف بالواجهة.
            </p>
          </div>
        </div>

      </div>
    </header>
  );
};
