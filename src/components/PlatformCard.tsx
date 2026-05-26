import React from 'react';
import { useFirebase } from './FirebaseProvider';
import { Platform } from '../types';
import { ExternalLink, Calendar, User as UserIcon, MessageSquare, Pencil, Trash2 } from 'lucide-react';
import { motion } from 'motion/react';

interface PlatformCardProps {
  platform: Platform;
  onSelect: () => void;
  onAddAdviceClick: (e: React.MouseEvent) => void;
  onEditClick?: (platform: Platform) => void;
}

export const PlatformCard: React.FC<PlatformCardProps> = ({
  platform,
  onSelect,
  onAddAdviceClick,
  onEditClick
}) => {
  const { user, toggleUpvote, userUpvotes, deletePlatform } = useFirebase();
  const isUpvoted = userUpvotes[platform.id] || false;

  // Split description format safely: small brief - latest improvement - version number
  const parts = platform.description.split(' - ');
  const brief = parts[0] || platform.description;

  const handleUpvote = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      alert("يرجى تسجيل الدخول لتتمكن من التصويت للمنصة!");
      return;
    }
    try {
      await toggleUpvote(platform.id);
    } catch (err) {
      console.error(err);
    }
  };

  const handleExternalLink = (e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(platform.url, '_blank', 'noopener,noreferrer');
  };

  const formattedDate = new Date(platform.createdAt).toLocaleDateString('ar-EG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });

  return (
    <motion.div
      onClick={onSelect}
      className={`bg-white border rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer relative h-full text-right ${
        isUpvoted ? 'border-blue-500 ring-1 ring-blue-500/30' : 'border-slate-200'
      }`}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      id={`platform-card-${platform.id}`}
    >
      {/* Platform Category and Vote Badges */}
      <div className="absolute top-2 right-2 z-10">
        <span className="bg-slate-900/85 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-lg">
          {platform.category}
        </span>
      </div>

      <div className="absolute top-2 left-2 z-10 bg-white/90 backdrop-blur px-2 py-1 rounded-lg flex items-center gap-1 shadow-sm text-xs font-bold text-orange-600 hover:scale-105 transition-transform" onClick={handleUpvote} title="تصويت سريع">
        <span>{platform.voteCount}</span>
        <span>▲</span>
      </div>

      {/* Hero promo Image */}
      <div className="relative h-36 overflow-hidden bg-slate-100 flex-shrink-0">
        <img
          src={platform.imageUrl || "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80"}
          alt={platform.name}
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-slate-900/10" />
      </div>

      {/* Card Content body */}
      <div className="p-4 flex-1 flex flex-col justify-between gap-3">
        <div className="space-y-2">
          
          {/* Metadata owner and date */}
          <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span className="flex items-center gap-1">
              <UserIcon className="h-3 w-3 text-slate-400" />
              <span>{platform.ownerName}</span>
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" />
              <span>{formattedDate}</span>
            </span>
          </div>

          <div className="flex justify-between items-start gap-2">
            <h3 className="font-bold text-base text-slate-800 leading-snug hover:text-blue-600 transition-colors">
              {platform.name}
            </h3>
            <button
              onClick={onAddAdviceClick}
              className="text-xs text-blue-650 hover:text-blue-700 font-bold hover:underline shrink-0"
            >
              إضافة نصيحة
            </button>
          </div>

          <p className="text-slate-500 text-xs line-clamp-2 font-normal leading-relaxed">
            {brief}
          </p>
        </div>

        {/* Action Buttons row matching Design HTML exactly */}
        <div className="flex flex-col gap-2 pt-3 border-t border-slate-100 mt-auto">
          {user && user.uid === platform.ownerId && (
            <div className="flex items-center justify-between gap-2 pb-1" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEditClick && onEditClick(platform);
                }}
                className="flex-1 flex items-center justify-center gap-1 bg-amber-50 hover:bg-amber-100/85 text-amber-700 border border-amber-200 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
              >
                <Pencil className="h-3 w-3" />
                <span>تعديل</span>
              </button>
              <button
                onClick={async (e) => {
                  e.stopPropagation();
                  if (confirm("هل أنت متأكد من رغبتك في حذف هذه المنصة نهائيًا؟")) {
                    try {
                      await deletePlatform(platform.id);
                    } catch (err) {
                      console.error(err);
                    }
                  }
                }}
                className="flex-1 flex items-center justify-center gap-1 bg-rose-50 hover:bg-rose-100/85 text-rose-700 border border-rose-200 py-1.5 rounded-lg text-[10px] font-bold transition-all cursor-pointer"
              >
                <Trash2 className="h-3 w-3" />
                <span>حذف</span>
              </button>
            </div>
          )}

          <div className="flex items-center justify-between gap-2">
            <button
              onClick={onSelect}
              className="flex-1 bg-slate-50 text-slate-700 py-2 rounded-lg text-xs font-bold border border-slate-150 hover:bg-slate-100 transition-all text-center cursor-pointer"
            >
              عرض التفاصيل
            </button>
            
            <button
              onClick={handleUpvote}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shrink-0 ${
                isUpvoted 
                  ? 'bg-blue-50 text-blue-700 border border-blue-200 shadow-sm' 
                  : 'bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-500/10 active:translate-y-px'
              }`}
            >
              <span>{isUpvoted ? 'مؤيد' : 'تصويت'}</span>
              <span>▲</span>
            </button>
          </div>
        </div>

      </div>
    </motion.div>
  );
};
