import React, { useState, useEffect } from 'react';
import { useFirebase } from './FirebaseProvider';
import { Platform, Advice } from '../types';
import { 
  ArrowRight, ArrowUp, Calendar, User, MessageSquare, 
  Send, ExternalLink, Sparkles, Star, Award, CheckCircle2, Cpu, Activity, LayoutGrid,
  Pencil, Trash2
} from 'lucide-react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { motion } from 'motion/react';

interface PlatformDetailsProps {
  platform: Platform;
  onBack: () => void;
  onAddAdviceFocus?: boolean;
  onEditClick?: (platform: Platform) => void;
}

const HEURISTICS = [
  { id: 'visibilityOfSystemStatus', title: 'رؤية حالة النظام', desc: 'إبقاء المستخدمين على علم دائماً بما يحدث، من خلال تقديم تغذية راجعة مناسبة في الوقت المناسب.', en: 'Visibility of system status' },
  { id: 'matchSystemAndRealWorld', title: 'التوافق بين النظام والعالم الحقيقي', desc: 'استخدام مصطلحات ومفاهيم مألوفة للمستخدم بدلاً من الكلمات التقنية الموجهة للأنظمة.', en: 'Match between system and real world' },
  { id: 'userControlAndFreedom', title: 'تحكم وحرية المستخدم', desc: 'توفير مخارج طوارئ واضحة للتراجع عن الإجراءات غير المقصودة دون المرور بخطوات معقدة.', en: 'User control and freedom' },
  { id: 'consistencyAndStandards', title: 'الاتساق والمعايير', desc: 'اتباع معايير صناعية واضحة وتصميم متسق لئلا يتساءل المستخدم عما إذا كانت الكلمات والرموز تعني نفس الشيء.', en: 'Consistency and standards' },
  { id: 'errorPrevention', title: 'منع حدوث الأخطاء', desc: 'تصميم واجهات تمنع حدوث الخطأ من البداية عبر القيود والتأكيدات الاستباقية عوضاً عن إظهار رسائل الخطأ اللاحقة.', en: 'Error prevention' },
  { id: 'recognitionRatherThanRecall', title: 'التعرف بدلاً من التذكر', desc: 'تقليل العبء المعرفي للمستخدم بجعل العناصر والإجراءات والخيارات مرئية وسهلة الاختيار دون الحاجة لحفظها.', en: 'Recognition rather than recall' },
  { id: 'flexibilityAndEfficiency', title: 'المرونة وكفاءة الاستخدام', desc: 'توفير مسارات تسريع التصفح (Accelerators) للمستخدمين المحترفين دون التأثير على راحة المبتدئين.', en: 'Flexibility and efficiency' },
  { id: 'aestheticAndMinimalistDesign', title: 'التصميم الجمالي البسيط', desc: 'الابتعاد تماماً عن حشو الصفحات بمعلومات غير ذات صلة أو نادراً ما يحتاجها المستخدم.', en: 'Aesthetic and minimalist design' },
  { id: 'helpAndRecoverFromErrors', title: 'مساعدة المستخدمين على تشخيص وتصحيح الأخطاء', desc: 'صياغة رسائل الأخطاء بلغة واضحة بتقديم حل دقيق وإرشادي حقيقي للمشكلة.', en: 'Help and recover from errors' },
  { id: 'helpAndDocumentation', title: 'المساعدة والوثائق وأدلة الدعم', desc: 'رغم جودة الواجهة، يفضل توفير مستندات بحثية بسيطة تركز على تيسير الخطوات المطلوبة.', en: 'Help and documentation' }
];

export const PlatformDetails: React.FC<PlatformDetailsProps> = ({ platform, onBack, onAddAdviceFocus = false, onEditClick }) => {
  const { user, toggleUpvote, userUpvotes, addAdvice, submitHeuristicRating, deletePlatform } = useFirebase();
  const isUpvoted = userUpvotes[platform.id] || false;

  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    if (!window.confirm("🔴 هل أنت متأكد من رغبتك في حذف هذه المنصة بشكل نهائي؟ لا يمكن التراجع عن هذا الإجراء.")) {
      return;
    }
    setDeleting(true);
    try {
      await deletePlatform(platform.id);
      onBack();
    } catch (err) {
      console.error(err);
      alert("تعذر حذف المنصة بالخادم. يرجى مراجعة الصلاحيات.");
    } finally {
      setDeleting(false);
    }
  };

  const [activeTab, setActiveTab] = useState<'overview' | 'heuristics'>('overview');
  
  const [advices, setAdvices] = useState<Advice[]>([]);
  const [loadingAdvices, setLoadingAdvices] = useState(true);
  const [newAdvice, setNewAdvice] = useState('');
  const [submittingAdvice, setSubmittingAdvice] = useState(false);

  const [aiAudit, setAiAudit] = useState<any | null>(null);
  const [loadingAiAudit, setLoadingAiAudit] = useState(false);
  const [aiError, setAiError] = useState('');

  // Live Heuristics Ratings from Database
  const [heuristicRatings, setHeuristicRatings] = useState<any[]>([]);
  const [loadingHeuristics, setLoadingHeuristics] = useState(true);
  const [showRatingForm, setShowRatingForm] = useState(false);
  const [userRatings, setUserRatings] = useState<{ [heurId: string]: number }>({
    visibilityOfSystemStatus: 4,
    matchSystemAndRealWorld: 4,
    userControlAndFreedom: 4,
    consistencyAndStandards: 4,
    errorPrevention: 4,
    recognitionRatherThanRecall: 4,
    flexibilityAndEfficiency: 4,
    aestheticAndMinimalistDesign: 4,
    helpAndRecoverFromErrors: 4,
    helpAndDocumentation: 4,
  });
  const [userComment, setUserComment] = useState('');
  const [submittingRating, setSubmittingRating] = useState(false);
  const [ratingSuccessMessage, setRatingSuccessMessage] = useState('');

  // 1. Split Description Segments
  const segments = platform.description.split(' - ');
  const brief = segments[0] || platform.description;
  const improvements = segments[1] || 'الإصدار الأولي للمشروع مجهز بالكامل للمستخدمين';
  const version = segments[2] || 'v1.0.0';

  // 2. Fetch platform advices in real-time
  useEffect(() => {
    const advicesRef = collection(db, 'platforms', platform.id, 'advices');
    const q = query(advicesRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: Advice[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          content: data.content,
          authorId: data.authorId,
          authorName: data.authorName,
          authorPhoto: data.authorPhoto || '',
          createdAt: data.createdAt ? (data.createdAt.seconds * 1000) : Date.now(),
        });
      });
      setAdvices(list);
      setLoadingAdvices(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, `platforms/${platform.id}/advices`);
    });

    return unsubscribe;
  }, [platform.id]);

  // 3. Fetch heuristic ratings in real-time
  useEffect(() => {
    const ratingsRef = collection(db, 'platforms', platform.id, 'heuristic_ratings');
    const q = query(ratingsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const list: any[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        list.push({
          id: doc.id,
          userId: data.userId,
          userName: data.userName,
          ratings: data.ratings || {},
          comment: data.comment || '',
          createdAt: data.createdAt ? (data.createdAt.seconds * 1000) : Date.now(),
        });
      });
      setHeuristicRatings(list);
      setLoadingHeuristics(false);
    }, (error) => {
      console.error("Error reading heuristic ratings:", error);
    });

    return unsubscribe;
  }, [platform.id]);

  // Sync user's pre-filled rating if they have rated before
  useEffect(() => {
    if (user && heuristicRatings.length > 0) {
      const existing = heuristicRatings.find(r => r.userId === user.uid);
      if (existing) {
        if (existing.ratings) {
          setUserRatings(existing.ratings);
        }
        if (existing.comment) {
          setUserComment(existing.comment);
        }
      }
    }
  }, [heuristicRatings, user]);

  const handleUpvote = async () => {
    if (!user) {
      alert("يرجى تسجيل الدخول أولاً للتصويت للمنصة!");
      return;
    }
    try {
      await toggleUpvote(platform.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmitAdvice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAdvice.trim()) return;
    if (!user) {
      alert("يرجى تسجيل الدخول لتتمكن من إعطاء الكاتب نصائح وإرشادت تطويرية!");
      return;
    }

    setSubmittingAdvice(true);
    try {
      await addAdvice(platform.id, newAdvice.trim());
      setNewAdvice('');
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingAdvice(false);
    }
  };

  const runAiUsabilityAudit = async () => {
    setLoadingAiAudit(true);
    setAiError('');
    try {
      const response = await fetch('/api/gemini/heuristic-audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: platform.name,
          url: platform.url,
          description: platform.description,
          category: platform.category
        })
      });

      if (!response.ok) {
        throw new Error('فشل الحصول على استجابة من الخادم التوليدي الذكي.');
      }

      const data = await response.json();
      setAiAudit(data);
    } catch (err: any) {
      console.error(err);
      setAiError('نأسف للخلل، فشل إخطار خادم الذكاء الاصطناعي لتقييم المنصة حالياً.');
    } finally {
      setLoadingAiAudit(false);
    }
  };

  const getHeuristicAverage = (heurId: string) => {
    if (heuristicRatings.length === 0) return null;
    let sum = 0;
    let count = 0;
    heuristicRatings.forEach((rating) => {
      if (rating.ratings && rating.ratings[heurId] !== undefined) {
        sum += rating.ratings[heurId];
        count++;
      }
    });
    return count > 0 ? parseFloat((sum / count).toFixed(1)) : null;
  };

  const getOverallAverage = () => {
    if (heuristicRatings.length === 0) return null;
    let totalSum = 0;
    let totalCount = 0;
    heuristicRatings.forEach((rating) => {
      if (rating.ratings) {
        HEURISTICS.forEach((heur) => {
          if (rating.ratings[heur.id] !== undefined) {
            totalSum += rating.ratings[heur.id];
            totalCount++;
          }
        });
      }
    });
    return totalCount > 0 ? parseFloat((totalSum / totalCount).toFixed(1)) : null;
  };

  const handleRatingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      alert("يرجى تسجيل الدخول أولاً لتتمكن من تقييم المنصات!");
      return;
    }

    setSubmittingRating(true);
    setRatingSuccessMessage('');
    try {
      await submitHeuristicRating(platform.id, userRatings, userComment);
      setRatingSuccessMessage('تم حفظ تقييمكم لمعايير سهولة الاستخدام الـ10 بنجاح ونشره بملف المشاركة!');
      setShowRatingForm(false);
      setTimeout(() => setRatingSuccessMessage(''), 5500);
    } catch (err) {
      console.error("Error submitting rating:", err);
      alert("فشل تقديم تقييم المعايير بالوقت الحالي.");
    } finally {
      setSubmittingRating(false);
    }
  };

  const formattedDate = new Date(platform.createdAt).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.2 }}
      className="max-w-5xl mx-auto px-1 py-4 space-y-6 text-right"
      dir="rtl"
      id={`platform-details-${platform.id}`}
    >
      {/* Back CTA Button */}
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-slate-500 hover:text-blue-650 font-bold text-xs transition-colors cursor-pointer group"
        id="back_to_main_btn"
      >
        <ArrowRight className="h-4 w-4 transform group-hover:translate-x-1 transition-transform" />
        <span>← العودة لدليل المنصات</span>
      </button>

      {/* Main Showcase Hero Block */}
      <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-12 gap-0">
        
        {/* Banner Card Image */}
        <div className="md:col-span-4 h-52 md:h-auto relative bg-slate-100">
          <img
            src={platform.imageUrl}
            alt={platform.name}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </div>

        {/* Brand Information header */}
        <div className="p-6 md:col-span-8 flex flex-col justify-between space-y-4">
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-bold px-2.5 py-1 rounded-lg">
                {platform.category}
              </span>
              <span className="bg-slate-100 text-slate-600 border border-slate-200 text-[10px] font-mono px-2.5 py-1 rounded-lg">
                {version}
              </span>
            </div>

            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-slate-900 leading-tight">
                {platform.name}
              </h2>
              
              <div className="flex items-center gap-4 text-xs text-slate-400 font-light pt-1">
                <span className="flex items-center gap-1">
                  <User className="h-3.5 w-3.5 text-slate-400" />
                  <span>الناشر: {platform.ownerName}</span>
                </span>
                <span className="flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-slate-400" />
                  <span>تاريخ النشر: {formattedDate}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Interactive upvotes, links panel */}
          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-slate-100">
            <button
              onClick={handleUpvote}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-xl transition-all duration-250 border cursor-pointer font-bold text-xs ${
                isUpvoted 
                  ? 'bg-blue-50 border-blue-300 text-blue-600 shadow-sm' 
                  : 'bg-slate-100 border-slate-200 text-slate-600 hover:bg-slate-200/50'
              }`}
            >
              <ArrowUp className="h-4 w-4" />
              <span>{platform.voteCount} مؤيد للتألق</span>
            </button>

            <a
              href={platform.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl font-bold text-xs transition-all shadow-sm shadow-blue-500/10 cursor-pointer"
            >
              <span>زيارة رابط المنصة</span>
              <ExternalLink className="h-3.5 w-3.5" />
            </a>

            {user && user.uid === platform.ownerId && (
              <div className="flex items-center gap-2 border-r border-slate-200 pr-3 mr-1">
                <button
                  onClick={() => onEditClick && onEditClick(platform)}
                  className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>تعديل التفاصيل</span>
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleting}
                  className="flex items-center gap-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl font-bold text-xs transition-all cursor-pointer disabled:opacity-50"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{deleting ? 'جاري الحذف...' : 'حذف المنصة'}</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs Layout: Details overview vs Usability Audit */}
      <div className="flex items-center gap-1.5 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 pb-2.5 font-bold text-xs transition-all border-b-2 cursor-pointer ${
            activeTab === 'overview'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          البطاقة التعريفية وملاحظات المجتمع
        </button>
        <button
          onClick={() => setActiveTab('heuristics')}
          className={`px-4 py-2 pb-2.5 font-bold text-xs transition-all border-b-2 flex items-center gap-1 cursor-pointer ${
            activeTab === 'heuristics'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-slate-400 hover:text-slate-600'
          }`}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>تدقيق معايير تجربة المستخدم الـ10</span>
        </button>
      </div>

      {/* Tab Panels content rendering */}
      <div className="grid grid-cols-1 gap-6">
        
        {/* Tab 1: Overview and Advices */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
            
            {/* Left/Main Column: Specifications card with minimalist design */}
            <div className="md:col-span-8 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                <h3 className="font-bold text-base text-slate-800">بيانات تركيبة المشروع</h3>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/50 space-y-4">
                <div className="text-xs font-bold text-slate-400">ملخص الوصف الموثق</div>
                <div className="text-xs leading-relaxed text-slate-700 space-y-3">
                  <p>
                    <strong className="text-blue-600 font-bold block mb-1">النبذة القصيرة:</strong> 
                    {brief}
                  </p>
                  <p className="pt-2 border-t border-slate-200/60">
                    <strong className="text-blue-600 font-bold block mb-1 font-sans">آخر التطويرات والتحسينات:</strong> 
                    {improvements}
                  </p>
                  <p className="pt-2 border-t border-slate-200/60">
                    <strong className="text-blue-600 font-bold block mb-1">رقم الإصدار المحدد للمنتج:</strong> 
                    <span className="font-mono bg-white px-2 py-0.5 border border-slate-200 rounded text-[11px] text-slate-800 font-semibold">{version}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* Right/Sidebar Column: Human Advices */}
            <div className="md:col-span-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-5 bg-blue-600 rounded-full"></div>
                  <h3 className="font-bold text-base text-slate-800">توجيهات المطورين ({advices.length})</h3>
                </div>
              </div>

              {/* Submitting Advice feedback form */}
              {user ? (
                <form onSubmit={handleSubmitAdvice} className="space-y-2">
                  <input
                    type="text"
                    required
                    maxLength={1000}
                    placeholder="قدّم نصيحة تفصيلية وواضحة..."
                    value={newAdvice}
                    onChange={(e) => setNewAdvice(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-3 py-2 text-xs focus:bg-white focus:border-blue-500 outline-none transition-all"
                  />
                  <button
                    type="submit"
                    disabled={submittingAdvice}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-2 text-xs font-bold shadow-sm transition-colors cursor-pointer"
                  >
                    <span>أضف نصيحة جديدة</span>
                  </button>
                </form>
              ) : (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-slate-500 text-[11px] text-center font-normal">
                  يرجى تسجيل الدخول لكتابة أو تفعيل النصائح.
                </div>
              )}

              {/* Advice listing stream */}
              {loadingAdvices ? (
                <div className="text-center py-2 text-slate-400 text-xs">جاري جلب الآراء...</div>
              ) : advices.length === 0 ? (
                <div className="text-center py-4 text-slate-400 text-xs font-light">
                  لا توجد اقتراحات مسجلة بعد.
                </div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                  {advices.map((adv) => (
                    <div key={adv.id} className="bg-blue-50/40 p-3 rounded-lg border border-blue-100/50 text-xs">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <span className="font-bold text-slate-700 text-[10px]">{adv.authorName}</span>
                        <span className="text-[9px] text-slate-400">
                          {new Date(adv.createdAt).toLocaleDateString('ar-EG')}
                        </span>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-light italic">"{adv.content}"</p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* Tab 2: Heuristic Analysis Suite */}
        {activeTab === 'heuristics' && (
          <div className="space-y-6 text-right">
            
            {/* Guide Introduction & High-Level Summary */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-5">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-blue-600" />
                    <h3 className="text-base font-extrabold text-slate-900">أداة قياس سهولة الاستخدام التفاعلية</h3>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed font-light">
                    نحن لا ندرج معايير جاكوب نيلسن الـ10 بشكل نظري؛ بل يمكنك الآن **تقييم جودة سهولة وبساطة استخدام هذه المنصة والمشاركة بآرائك**! قم بتقديم تقييم تفاعلي لنساهم سوياً في رفع جودة المنتجات الرقمية العربية.
                  </p>
                  
                  {/* Global Average Metrics Badge */}
                  <div className="flex flex-wrap gap-3 pt-2">
                    <div className="bg-blue-50/70 border border-blue-100 text-blue-700 text-xs font-semibold px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                      <Star className="h-3.5 w-3.5 fill-blue-500 text-blue-500" />
                      <span>متوسط تقييم المجتمع:</span>
                      <strong className="font-mono text-sm">{getOverallAverage() !== null ? `${getOverallAverage()} / 5` : "لا توجد تقييمات بعد"}</strong>
                    </div>

                    <div className="bg-slate-50 border border-slate-200 text-slate-600 text-[11px] px-3 py-1.5 rounded-xl flex items-center gap-1.5 font-light">
                      <MessageSquare className="h-3.5 w-3.5 text-slate-400" />
                      <span>إجمالي المشاركين النشطين:</span>
                      <strong className="font-bold text-slate-800">{heuristicRatings.length} أعضاء</strong>
                    </div>
                  </div>
                </div>

                {/* Prompt Button Tools */}
                <div className="flex flex-wrap gap-2 shrink-0 w-full md:w-auto">
                  <button
                    onClick={() => {
                      setShowRatingForm(!showRatingForm);
                      setRatingSuccessMessage('');
                    }}
                    className={`rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition-all text-center flex-1 md:flex-initial flex items-center justify-center gap-2 cursor-pointer ${
                      showRatingForm 
                        ? 'bg-slate-800 hover:bg-slate-900 text-white' 
                        : 'bg-blue-50 text-blue-700 hover:bg-blue-100/80 border border-blue-200/40'
                    }`}
                  >
                    <span>{showRatingForm ? 'إغلاق نافذة التقييم' : 'قيّم سهولة الاستخدام بنفسك'}</span>
                  </button>

                  <button
                    onClick={runAiUsabilityAudit}
                    disabled={loadingAiAudit}
                    className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl px-4 py-2.5 text-xs font-bold shadow-sm transition-all flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    {loadingAiAudit ? (
                      <span className="inline-block h-3.5 w-3.5 border-2 border-blue-150 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Cpu className="h-3.5 w-3.5" />
                    )}
                    <span>استشارة الذكاء الاصطناعي (AI)</span>
                  </button>
                </div>
              </div>

              {ratingSuccessMessage && (
                <div className="bg-emerald-50 border border-emerald-150 text-emerald-700 text-xs p-3.5 rounded-xl flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <p className="font-semibold">{ratingSuccessMessage}</p>
                </div>
              )}

              {aiError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 text-xs p-3.5 rounded-xl">
                  {aiError}
                </div>
              )}
            </div>

            {/* Interactive Rating Form Panel */}
            {showRatingForm && (
              <motion.form
                onSubmit={handleRatingSubmit}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-white rounded-2xl border border-slate-200 p-6 shadow-md space-y-6 overflow-hidden"
              >
                <div className="border-b border-slate-150 pb-3">
                  <h4 className="font-extrabold text-sm text-slate-850">ورقة تقييم تجربة المستخدم (10 Heuristics Nielsen Score)</h4>
                  <p className="text-[11px] text-slate-400 font-light mt-0.5">حدّد من 1 إلى 5 نجوم (حيث 1 = ضعيف جداً ومليء بالمشاكل، 5 = متقن وخالي من العقبات)</p>
                </div>

                <div className="space-y-4">
                  {HEURISTICS.map((heur, idx) => {
                    const currentVal = userRatings[heur.id] || 4;
                    return (
                      <div key={heur.id} className="p-4 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="space-y-1 max-w-xl">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-blue-500 bg-blue-50 px-1.5 py-0.5 rounded">#{idx + 1}</span>
                            <h5 className="font-bold text-slate-800 text-xs">{heur.title}</h5>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed font-light">{heur.desc}</p>
                        </div>

                        {/* Interactive Stars Selector */}
                        <div className="flex items-center gap-1 justify-end">
                          {Array.from({ length: 5 }).map((_, i) => {
                            const val = i + 1;
                            const isSelected = val <= currentVal;
                            return (
                              <button
                                key={i}
                                type="button"
                                onClick={() => {
                                  setUserRatings(prev => ({ ...prev, [heur.id]: val }));
                                }}
                                className="p-1 cursor-pointer transition-transform duration-100 hover:scale-115"
                                title={`${val} من 5`}
                              >
                                <Star 
                                  className={`h-5 w-5 ${
                                    isSelected 
                                      ? 'fill-amber-450 text-amber-500' 
                                      : 'text-slate-300 hover:text-amber-450'
                                  }`} 
                                />
                              </button>
                            );
                          })}
                          <span className="font-mono text-xs font-bold text-slate-500 min-w-[2.5rem] text-center bg-white border border-slate-200 p-1 px-1.5 rounded-lg mr-2">
                            {currentVal} / 5
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Qualitative Review Comments Box */}
                <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700 block">دراسة نقدية ووجهة نظر حول تجربة الاستخدام العام للمنصة (اختياري)</label>
                  <textarea
                    rows={3}
                    maxLength={1500}
                    placeholder="اكتب هنا تحليلًا شخصيًا، مثل: الخطوط واضحة ومقروءة لكن نموذج رفع الصور يحتاج رسالة تأكيد لمنع الأخطاء غير المقصودة..."
                    value={userComment}
                    onChange={(e) => setUserComment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 text-slate-900 rounded-xl px-4 py-3 text-xs focus:bg-white focus:border-blue-500 outline-none transition-all leading-relaxed"
                  />
                </div>

                <div className="flex justify-end gap-2.5 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowRatingForm(false)}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold text-xs py-2 px-4 rounded-xl transition-all cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRating}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2 px-5 rounded-xl transition-all shadow-sm shadow-blue-550/10 cursor-pointer flex items-center gap-1.5"
                  >
                    {submittingRating ? (
                      <span className="inline-block h-3.5 w-3.5 border-2 border-blue-150 border-t-white rounded-full animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-3.5 w-3.5" />
                    )}
                    <span>حفظ المراجعة ونشر النتائج</span>
                  </button>
                </div>
              </motion.form>
            )}

            {/* AI Review Results Panel (Optional and generated on request) */}
            {aiAudit && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 shadow-md space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-blue-400" />
                      <h4 className="font-bold text-xs text-white">تحليل خبير الذكاء الاصطناعي الفوري لـ {platform.name}</h4>
                    </div>
                    <span className="text-[10px] bg-slate-850 border border-slate-700 text-slate-300 font-mono p-1 px-1.5 rounded">Generative AI Audit</span>
                  </div>

                  <div className="bg-slate-850/60 p-4 rounded-xl border border-slate-750 text-xs space-y-1 leading-relaxed">
                    <p className="text-blue-400 font-bold">ملخص الاستشارة الاستراتيجية للمطور:</p>
                    <p className="text-slate-200 font-light font-sans leading-relaxed">{aiAudit.generalAdvice}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Dynamic Heuristic Ratings Bento Grid of the 10 heuristics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {HEURISTICS.map((heur, index) => {
                const communityRating = getHeuristicAverage(heur.id);
                const aiSpecificComment = aiAudit ? aiAudit.analysis[heur.id] : null;

                return (
                  <div 
                    key={heur.id} 
                    className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3 relative overflow-hidden"
                  >
                    <span className="absolute top-2 left-3 text-blue-50/80 text-4xl font-extrabold font-mono select-none">#{index+1}</span>
                    
                    <div className="space-y-0.5">
                      <h4 className="font-extrabold text-slate-800 text-xs">{heur.title}</h4>
                      <span className="text-[9px] text-slate-400 font-mono italic block leading-none pb-1 border-b border-slate-100">{heur.en}</span>
                    </div>
                    
                    <p className="text-[11px] text-slate-400 leading-relaxed font-light">{heur.desc}</p>

                    {/* Community Score Tracker Slider/Bar (Visibility of system status) */}
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/50 space-y-2">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-slate-600">تقييم المجتمع النشط:</span>
                        <div className="flex items-center gap-1">
                          {communityRating !== null ? (
                            <>
                              <Star className="h-3 w-3 fill-amber-450 text-amber-500" />
                              <strong className="font-mana font-bold text-slate-800">{communityRating} / 5</strong>
                            </>
                          ) : (
                            <span className="text-slate-400 text-[10px] font-light">لا يوجد تقييم حتى الآن</span>
                          )}
                        </div>
                      </div>

                      {/* Score visual metric slider bar */}
                      <div className="w-full bg-slate-200/60 h-1.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-blue-550 h-full rounded-full transition-all duration-300"
                          style={{ width: `${(communityRating ? communityRating : 0) * 20}%` }}
                        />
                      </div>
                    </div>

                    {/* Combined Interactive Expert comment from AI if present */}
                    {aiSpecificComment && (
                      <div className="bg-blue-50/40 p-2.5 rounded-xl border border-blue-50 mt-1 text-[11px] text-slate-700 leading-relaxed font-light">
                        <span className="font-semibold text-blue-650 block mb-0.5">💡 توصية المساعد الذكي:</span>
                        {aiSpecificComment}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Qualitative Feed from other Community Members */}
            <div className="bg-white rounded-2xl p-6 border border-slate-250 shadow-xs space-y-4">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                <MessageSquare className="h-4 w-4 text-blue-600" />
                <h4 className="font-bold text-xs text-slate-850">سجل الدراسات النقدية المكتوبة للمطور ({heuristicRatings.filter(r => r.comment).length})</h4>
              </div>

              {heuristicRatings.filter(r => r.comment).length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-4 font-light">لا توجد ملاحظات تفصيلية مكتوبة حول سهولة الاستخدام للمنصة بعد. كن أول من يكتب تحليلاً!</p>
              ) : (
                <div className="divide-y divide-slate-100">
                  {heuristicRatings.filter(r => r.comment).map((r) => (
                    <div key={r.id} className="py-3 first:pt-0 last:pb-0 space-y-1.5 text-xs text-right">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-bold text-slate-800">{r.userName}</span>
                        <span className="text-slate-400 text-[10px] font-light">{new Date(r.createdAt).toLocaleDateString('ar-EG')}</span>
                      </div>
                      <p className="text-slate-600 leading-relaxed font-light bg-slate-50 p-2.5 rounded-xl border border-slate-200/50 italic">
                        "{r.comment}"
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

      </div>

    </motion.div>
  );
};
