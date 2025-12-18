
import React from 'react';
import { 
  Utensils, 
  Car, 
  ShoppingBag, 
  Home, 
  Zap, 
  HeartPulse, 
  Briefcase, 
  TrendingUp, 
  MoreHorizontal 
} from 'lucide-react';

export const DEFAULT_CATEGORIES = [
  { id: 'cat1', name: '飲食', icon: <Utensils size={18} />, color: '#F87171' },
  { id: 'cat2', name: '交通', icon: <Car size={18} />, color: '#60A5FA' },
  { id: 'cat3', name: '購物', icon: <ShoppingBag size={18} />, color: '#F472B6' },
  { id: 'cat4', name: '住家', icon: <Home size={18} />, color: '#34D399' },
  { id: 'cat5', name: '娛樂', icon: <Zap size={18} />, color: '#FBBF24' },
  { id: 'cat6', name: '醫療', icon: <HeartPulse size={18} />, color: '#EF4444' },
  { id: 'cat7', name: '薪資', icon: <Briefcase size={18} />, color: '#10B981' },
  { id: 'cat8', name: '投資', icon: <TrendingUp size={18} />, color: '#8B5CF6' },
  { id: 'cat9', name: '其他', icon: <MoreHorizontal size={18} />, color: '#9CA3AF' },
];

export const ACCOUNT_COLORS = [
  '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#6366F1'
];
