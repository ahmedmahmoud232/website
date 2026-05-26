import React, { useState, useEffect } from 'react';
import { useFirebase } from './FirebaseProvider';
import { X, Check, Globe, AlertCircle, FileText, Image as ImageIcon } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Platform } from '../types';

interface PlatformFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  platformToEdit?: Platform | null;
}

const CATEGORIES = [
  'تعليم وتقنية',
  'إنتاجية وتوظيف',
  'تجارة وأعمال',
  'ذكاء اصطناعي',
  'خدمات سحابية',
  'ترفيه ومجتمع'
];

const PRESET_IMAGES = [
  { id: 'tech', label: 'تقني/برمجة', url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80' },
  { id: 'biz', label: 'تجارة وحسابات', url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?auto=format&fit=crop&w=600&q=80' },
  { id: 'work', label: 'عمل جماعي', url: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=600&q=80' },
  { id: 'ai', label: 'ذكاء توليدي', url: 'https://images.unsplash.com/photo-1677442136019-21780efad99a?auto=format&fit=crop&w=600&q=80' }
];

export const PlatformFormModal: React.FC<PlatformFormModalProps> = ({ isOpen, onClose, platformToEdit = null }) => {
  const { addPlatform, editPlatform, user } = useFirebase();

  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);
  
  const [brief, setBrief] = useState('');
  const [improvements, setImprovements] = useState('');
  const [version, setVersion] = useState('v1.0.0');

  const [customImageUrl, setCustomImageUrl] = useState('');
  const [selectedPresetImage, setSelectedPresetImage] = useState(PRESET_IMAGES[0].url);
  const [isCustomImage, setIsCustomImage] = useState(false);

  // Validation States
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (platformToEdit) {
        setName(platformToEdit.name);
        setUrl(platformToEdit.url);
        setCategory(platformToEdit.category);

        // Parse description segments cleanly
        const segments = platformToEdit.description.split(' - ');
        setBrief(segments[0] || platformToEdit.description);
        setImprovements(segments[1] || '');
        setVersion(segments[2] || 'v1.0.0');

        const preset = PRESET_IMAGES.find((p) => p.url === platformToEdit.imageUrl);
        if (preset) {
          setSelectedPresetImage(platformToEdit.imageUrl);
          setIsCustomImage(false);
          setCustomImageUrl('');
        } else {
          setSelectedPresetImage(PRESET_IMAGES[0].url);
          setIsCustomImage(true);
          setCustomImageUrl(platformToEdit.imageUrl);
        }
      } else {
        setName('');
        setUrl('');
        setCategory(CATEGORIES[0]);
        setBrief('');
        setImprovements('');
        setVersion('v1.0.0');
        setSelectedPresetImage(PRESET_IMAGES[0].url);
        setIsCustomImage(false);
        setCustomImageUrl('');
      }
      setError('');
    }
  }, [isOpen, platformToEdit]);

  if (!isOpen) return null;

  const validateAndSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!user) {
      setError('يجب تسجيل الدخول أولاً لتتمكن من إضافة أو تعديل المنصات.');
      return;
    }

    if (name.trim().length === 0 || name.trim().length > 100) {
      setError('يرجى كتابة اسم المنصة بشكل صحيح (بين 1 و 100 حرف).');
      return;
    }

    const urlPattern = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/i;
    if (!urlPattern.test(url.trim())) {
      setError('يرجى توفير رابط إنترنت صحيح للمنصة (مثال: https://example.com).');
      return;
    }

    if (brief.trim().length < 10) {
      setError('يرجى كتابة نبذة مختصرة تصف الخدمة بوضوح (لا تقل عن 10 أحرف).');
      return;
    }
    if (brief.trim().includes('-') || improvements.trim().includes('-') || version.trim().includes('-')) {
      setError('يرجى عدم استخدام الشرطة "-" داخل حقول الوصف لتفادي تعطل تركيبة الصياغة الآلية للمنصة.');
      return;
    }

    const finalImprovements = improvements.trim() || 'إطلاق الإصدار التجريبي الأول وتهيئته للنشر';
    const finalVersion = version.trim() || 'v1.0.0';

    const formulatedDescription = `${brief.trim()} - ${finalImprovements} - ${finalVersion}`;

    const finalImageUrl = isCustomImage ? customImageUrl.trim() : selectedPresetImage;
    if (isCustomImage && !urlPattern.test(finalImageUrl)) {
      setError('يرجى توفير رابط ويب مباشر وصحيح لصورة الإعلان المخصصة.');
      return;
    }

    setSubmitting(true);
    try {
      if (platformToEdit) {
        // Edit existing platform route
        await editPlatform(platformToEdit.id, name, url, formulatedDescription, category, finalImageUrl);
      } else {
        // Add new platform route
        await addPlatform(name, url, formulatedDescription, category, finalImageUrl);
      }
      
      // Reset States
      setName('');
      setUrl('');
      setBrief('');
      setImprovements('');
      setVersion('v1.0.0');
      setError('');
      onClose();
    } catch (err: any) {
      console.error(err);
      setError('حدث خطأ غير متوقع أثناء حفظ البيانات بالخادم. يرجى مراجعة الصلاحيات.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
        
        {/* Backdrop overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/45 backdrop-blur-xs"
        />

        {/* Modal Window box */}
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 10 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-white rounded-3xl w-full max-w-xl border border-slate-200 shadow-2xl relative z-10 overflow-hidden flex flex-col max-h-[90vh] text-right"
          dir="rtl"
          id="add_platform_modal_window"
        >
          {/* Header */}
          <div className="bg-white px-6 py-4 text-slate-800 flex items-center justify-between border-b border-slate-100">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold">
                {platformToEdit ? 'تعديل بيانات المنصة المعروضة' : 'إضافة منصة جديدة'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 px-2 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-800 transition-colors cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={validateAndSubmit} className="overflow-y-auto p-6 space-y-4 flex-1 select-none">
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-700 text-xs p-3 rounded-xl flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <p className="font-semibold leading-relaxed">{error}</p>
              </div>
            )}

            {!user ? (
              <div className="text-center py-6">
                <p className="text-slate-500 text-xs">يرجى تسجيل الدخول أولاً من الشريط العلوي.</p>
              </div>
            ) : (
              <div className="space-y-4">
                
                {/* 1. Name */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">اسم المنصة</label>
                  <input
                    type="text"
                    required
                    placeholder="مثال: أكاديمية حسوب"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full border border-slate-200 bg-white text-slate-800 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    id="platform_name_input"
                  />
                </div>

                {/* 2. Platform URL */}
                <div className="space-y-1">
                  <label className="block text-xs font-bold text-slate-500">رابط المنصة (URL)</label>
                  <input
                    type="url"
                    required
                    placeholder="https://..."
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full border border-slate-200 bg-white text-slate-800 text-left rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    id="platform_url_input"
                  />
                </div>

                {/* 3. Category & Preset Images */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500">التصنيف</label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full border border-slate-200 bg-white text-slate-800 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all cursor-pointer"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-xs font-bold text-slate-500">نوع الإعلان والصورة</label>
                    <div className="flex items-center gap-2 pt-2.5 text-[10px] text-slate-400">
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          checked={!isCustomImage}
                          onChange={() => setIsCustomImage(false)}
                          className="accent-blue-600 cursor-pointer"
                        />
                        <span className={!isCustomImage ? 'text-slate-900 font-bold' : ''}>غلاف جاهز</span>
                      </label>
                      <label className="flex items-center gap-1 cursor-pointer">
                        <input
                          type="radio"
                          checked={isCustomImage}
                          onChange={() => setIsCustomImage(true)}
                          className="accent-blue-600 cursor-pointer"
                        />
                        <span className={isCustomImage ? 'text-slate-900 font-bold' : ''}>رابط مخصص</span>
                      </label>
                    </div>
                  </div>
                </div>

                {/* Cover presets */}
                {!isCustomImage ? (
                  <div className="grid grid-cols-4 gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-150">
                    {PRESET_IMAGES.map((img) => (
                      <button
                        key={img.id}
                        type="button"
                        onClick={() => setSelectedPresetImage(img.url)}
                        className={`group relative h-12 rounded-lg overflow-hidden border transition-all cursor-pointer ${
                          selectedPresetImage === img.url ? 'border-blue-600 ring-2 ring-blue-550/15' : 'border-slate-200'
                        }`}
                      >
                        <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-slate-950/40 flex items-center justify-center p-0.5 text-center text-[9px] text-white">
                          {img.label}
                        </div>
                      </button>
                    ))}
                  </div>
                ) : (
                  <input
                    type="text"
                    placeholder="رابط صورة غلاف مباشر (https://images.unsplash.com/...)"
                    value={customImageUrl}
                    onChange={(e) => setCustomImageUrl(e.target.value)}
                    className="w-full border border-slate-200 bg-white text-slate-800 rounded-xl px-4 py-2 text-xs text-left focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                  />
                )}

                {/* Speci Description inputs formatted precisely */}
                <div className="bg-slate-50/70 p-4 border border-slate-155 rounded-xl space-y-3.5">
                  <div className="flex items-center gap-2 border-b border-slate-200/60 pb-1.5">
                    <FileText className="h-4 w-4 text-blue-650" />
                    <span className="text-xs font-bold text-slate-700">وصف ومميزات المنصة (تلقائي الاندماج بالصيغة)</span>
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-500">1. نبذة قصيرة لوصف المشروع (لا تقل عن 10 أحرف) *</label>
                    <textarea
                      required
                      placeholder="وصف فكرة المنصة..."
                      rows={2}
                      value={brief}
                      onChange={(e) => setBrief(e.target.value)}
                      className="w-full border border-slate-200 bg-white text-slate-800 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-500">2. آخر التطويرات والتحسينات المضافة</label>
                    <input
                      type="text"
                      placeholder="تحسين سرعة المحرر ودخول فوري..."
                      value={improvements}
                      onChange={(e) => setImprovements(e.target.value)}
                      className="w-full border border-slate-200 bg-white text-slate-800 rounded-xl px-4 py-2 text-xs focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="block text-[11px] font-semibold text-slate-500">3. رقم الإصدار الحالي للمشروع</label>
                    <input
                      type="text"
                      placeholder="v1.0.0"
                      value={version}
                      onChange={(e) => setVersion(e.target.value)}
                      className="w-full border border-slate-200 bg-white text-slate-800 text-left rounded-xl px-4 py-2 text-xs font-mono focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all"
                    />
                  </div>
                </div>

              </div>
            )}
          </form>

          {/* Footer Submit */}
          <div className="bg-slate-50 border-t border-slate-100 px-6 py-4 flex items-center justify-start gap-2.5">
            {user ? (
              <>
                <button
                  type="submit"
                  disabled={submitting}
                  onClick={validateAndSubmit}
                  className="bg-blue-600 hover:bg-blue-700 disabled:bg-slate-350 text-white rounded-xl px-5 py-2.5 text-xs font-bold shadow transition-all cursor-pointer flex items-center justify-center gap-1.5"
                  id="submit_platform_btn"
                >
                  {submitting ? (
                    <span className="inline-block h-3.5 w-3.5 border-2 border-slate-400 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Check className="h-4 w-4" />
                  )}
                  <span>{platformToEdit ? 'حفظ التحديثات والتعديلات الجديده' : 'تأكيد الإضافة وحفظ البيانات'}</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl px-4 py-2.5 text-xs font-bold transition-all cursor-pointer"
                >
                  إلغاء
                </button>
              </>
            ) : (
              <span className="text-slate-400 text-xs">يرجى تسجيل الدخول بكامل الصلاحيات.</span>
            )}
          </div>
        </motion.div>

      </div>
    </AnimatePresence>
  );
};
