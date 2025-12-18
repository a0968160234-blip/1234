
import React from 'react';
import { LogOut, PieChart, ShieldCheck } from 'lucide-react';

interface NavbarProps {
  userEmail: string;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ userEmail, onLogout }) => {
  return (
    <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 backdrop-blur-md bg-white/80">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <PieChart size={20} />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              AI Finance
            </span>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-full border border-gray-100">
              <ShieldCheck size={16} className="text-emerald-500" />
              <span className="text-xs font-medium text-gray-600">{userEmail}</span>
            </div>
            <button 
              onClick={onLogout}
              className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              title="登出"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};
