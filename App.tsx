
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
// Fix: Ensure onAuthStateChanged and signOut are correctly imported from firebase/auth.
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, 
  query, 
  onSnapshot, 
  where, 
  doc, 
  deleteDoc, 
  updateDoc 
} from 'firebase/firestore';
import { auth, db, isOfflineMode } from './firebase';
import { BankAccount, Transaction, TransactionType } from './types';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import { Navbar } from './components/Navbar';
import { Loader2 } from 'lucide-react';

const App: React.FC = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const navigate = useNavigate();

  // Seed data for offline/first-time users
  const SEED_ACCOUNTS: BankAccount[] = [
    { id: 'a1', name: '中國信託', balance: 50000, bankName: 'CTBC', color: '#3B82F6' },
    { id: 'a2', name: '台新銀行', balance: 12000, bankName: 'Taishin', color: '#EF4444' }
  ];

  const SEED_TRANSACTIONS: Transaction[] = [
    { id: 't1', accountId: 'a1', amount: 3000, type: TransactionType.EXPENSE, category: '飲食', date: '2024-03-20', note: '晚餐' },
    { id: 't2', accountId: 'a1', amount: 45000, type: TransactionType.INCOME, category: '薪資', date: '2024-03-05', note: '月薪' }
  ];

  useEffect(() => {
    if (isOfflineMode) {
      // Demo Mode Logic
      const storedUser = localStorage.getItem('demo_user');
      if (storedUser) setUser(JSON.parse(storedUser));
      
      const localAcc = localStorage.getItem('demo_accounts');
      const localTx = localStorage.getItem('demo_transactions');
      
      if (localAcc) setAccounts(JSON.parse(localAcc));
      else {
        setAccounts(SEED_ACCOUNTS);
        localStorage.setItem('demo_accounts', JSON.stringify(SEED_ACCOUNTS));
      }

      if (localTx) setTransactions(JSON.parse(localTx));
      else {
        setTransactions(SEED_TRANSACTIONS);
        localStorage.setItem('demo_transactions', JSON.stringify(SEED_TRANSACTIONS));
      }
      
      setLoading(false);
      return;
    }

    if (!auth) return;

    // Use onAuthStateChanged in modular style.
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!isOfflineMode && user && db) {
      // Real Firebase Fetching
      const qAcc = query(collection(db, 'accounts'), where('userId', '==', user.uid));
      const unsubAcc = onSnapshot(qAcc, (snapshot) => {
        setAccounts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as BankAccount)));
      });

      const qTx = query(collection(db, 'transactions'), where('userId', '==', user.uid));
      const unsubTx = onSnapshot(qTx, (snapshot) => {
        setTransactions(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction)));
      });

      return () => {
        unsubAcc();
        unsubTx();
      };
    }
  }, [user]);

  const handleLogout = async () => {
    if (isOfflineMode) {
      localStorage.removeItem('demo_user');
      setUser(null);
      navigate('/login');
    } else {
      // Fix: Added safety check for auth instance before calling signOut.
      if (auth) {
        await signOut(auth);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-white">
        <Loader2 className="animate-spin text-blue-600" size={48} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {user && <Navbar userEmail={user.email} onLogout={handleLogout} />}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-8">
        <Routes>
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" /> : <Login isOffline={isOfflineMode} setUser={setUser} />} 
          />
          <Route 
            path="/" 
            element={user ? (
              <Dashboard 
                accounts={accounts} 
                transactions={transactions} 
                user={user}
              />
            ) : <Navigate to="/login" />} 
          />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
      {isOfflineMode && (
        <div className="fixed bottom-0 left-0 right-0 bg-yellow-500 text-white text-center py-1 text-sm font-medium">
          ⚠️ 離線展示模式：資料將儲存於瀏覽器本地，不會與 Firebase 同步。
        </div>
      )}
    </div>
  );
};

export default App;
