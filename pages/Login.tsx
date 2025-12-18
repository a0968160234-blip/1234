
import React, { useState } from 'react';
// Modular Auth functions must be imported from firebase/auth.
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { Mail, Lock, UserPlus, LogIn, AlertCircle } from 'lucide-react';

interface LoginProps {
  isOffline: boolean;
  setUser: (user: any) => void;
}

const Login: React.FC<LoginProps> = ({ isOffline, setUser }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isOffline) {
      // Simulate login
      const mockUser = { uid: 'demo-uid', email };
      localStorage.setItem('demo_user', JSON.stringify(mockUser));
      setUser(mockUser);
      setLoading(false);
      return;
    }

    try {
      // In Firebase v9+ modular SDK, auth functions take the auth instance as the first parameter.
      if (isRegister) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (err: any) {
      setError(err.message || '認證失敗，請檢查電子郵件與密碼。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh]">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-xl border border-gray-100">
        <div className="flex justify-center mb-6">
          <div className="bg-blue-600 p-3 rounded-2xl shadow-lg">
            <LogIn className="text-white" size={32} />
          </div>
        </div>
        
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-2">
          {isRegister ? '註冊帳戶' : '歡迎回來'}
        </h2>
        <p className="text-center text-gray-500 mb-8">
          管理您的個人財務，開啟 AI 智慧理財
        </p>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 flex items-start gap-3">
            <AlertCircle size={20} className="shrink-0 mt-0.5" />
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密碼</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-all flex items-center justify-center gap-2"
          >
            {loading ? '處理中...' : (isRegister ? '註冊' : '登入')}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-gray-100 text-center">
          <button
            onClick={() => setIsRegister(!isRegister)}
            className="text-blue-600 hover:text-blue-700 font-medium flex items-center justify-center gap-2 mx-auto"
          >
            {isRegister ? (
              <>已有帳號？登入</>
            ) : (
              <><UserPlus size={18} /> 尚未有帳號？點此註冊</>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
