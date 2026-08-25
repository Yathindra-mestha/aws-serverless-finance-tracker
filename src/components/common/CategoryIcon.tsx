import React from 'react';
import { MoreHorizontal } from 'lucide-react';

const emojiMap: Record<string, string> = {
  Salary:        '💼',
  Freelance:     '💻',
  Investment:    '📈',
  Business:      '🏪',
  Rent:          '🏠',
  Food:          '🍔',
  Travel:        '🚗',
  Shopping:      '🛍️',
  Bills:         '💡',
  Entertainment: '🎬',
  Health:        '💊',
  Education:     '📚',
  Fitness:       '🏋️',
  Personal:      '🧴',
  Other:         '📦',
};

// Subtle per-category background tints
const bgMap: Record<string, string> = {
  Salary:        'bg-emerald-500/10 border-emerald-500/20',
  Freelance:     'bg-teal-500/10 border-teal-500/20',
  Investment:    'bg-green-500/10 border-green-500/20',
  Business:      'bg-cyan-500/10 border-cyan-500/20',
  Rent:          'bg-blue-500/10 border-blue-500/20',
  Food:          'bg-orange-500/10 border-orange-500/20',
  Travel:        'bg-sky-500/10 border-sky-500/20',
  Shopping:      'bg-pink-500/10 border-pink-500/20',
  Bills:         'bg-yellow-500/10 border-yellow-500/20',
  Entertainment: 'bg-purple-500/10 border-purple-500/20',
  Health:        'bg-red-500/10 border-red-500/20',
  Education:     'bg-indigo-500/10 border-indigo-500/20',
  Fitness:       'bg-lime-500/10 border-lime-500/20',
  Personal:      'bg-rose-500/10 border-rose-500/20',
  Other:         'bg-slate-500/10 border-slate-500/20',
};

interface CategoryIconProps {
  categoryName: string;
  className?: string;
  size?: number;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({
  categoryName,
  className = '',
}) => {
  const emoji = emojiMap[categoryName] ?? (categoryName ? categoryName.charAt(0).toUpperCase() : '?');
  const bg = bgMap[categoryName] ?? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 font-bold';

  return (
    <div
      className={`w-9 h-9 rounded-xl flex items-center justify-center border shrink-0 ${bg} ${className}`}
    >
      <span className="text-base leading-none select-none">{emoji}</span>
    </div>
  );
};
