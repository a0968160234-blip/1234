
import React, { useState } from 'react';
import { 
  Plus, 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Sparkles, 
  Trash2,
  Calendar,
  AlertCircle
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend 
} from 'recharts';
import { BankAccount, Transaction, TransactionType } from '../types';
import { db, isOfflineMode } from '../firebase';
import { collection, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { DEFAULT_CATEGORIES, ACCOUNT_COLORS } from '../constants';
import { getFinancialAdvice } from '../geminiService';

interface DashboardProps {
  accounts: BankAccount[];
  transactions: Transaction[];
  user: any;
}

const Dashboard: React.FC<DashboardProps> = ({ accounts, transactions, user }) => {
  const [aiAdvice, setAiAdvice] = useState<string>('點擊下方按鈕，讓 Gemini 3 Pro 為您的財務狀況提供專業建議...');
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  
  // Transaction Modal State
  const [showTxModal, setShowTxModal] = useState(false);
  const [newTx, setNewTx] = useState({
    amount: '',
    accountId: accounts[0]?.id || '',
    type: TransactionType.EXPENSE,
    category: '飲食',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  // Account Modal State
  const [showAccModal, setShowAccModal] = useState(false);
  const [newAcc, setNewAcc] = useState({ name: '', bankName: '', balance: '' });

  const stats = transactions.reduce((acc, t) => {
    const amt = Number(t.amount);
    if (t.type === TransactionType.INCOME) acc.income += amt;
    else acc.expense += amt;
    return acc;
  }, { income: 0, expense: 0 });

  const chartData = DEFAULT_CATEGORIES.map(cat => ({
    name: cat.name,
    value: transactions
      .filter(t => t.category === cat.name && t.type === TransactionType.EXPENSE)
      .reduce((sum, t) => sum + Number(t.amount), 0)
  })).filter(d => d.value > 0);

  const handleAiAdvice = async () => {
    setIsAdviceLoading(true);
    const advice = await getFinancialAdvice(transactions, accounts);
    setAiAdvice(advice);
    setIsAdviceLoading(false);
  };

  const handleAddTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const amountNum = Number(newTx.amount);
    const txData = {
      ...newTx,
      amount: amountNum,
      userId: user.uid,
      createdAt: new Date().toISOString()
    };

    if (isOfflineMode) {
      const storedTx = JSON.parse(localStorage.getItem('demo_transactions') || '[]');
      const newId = `t-${Date.now()}`;
      localStorage.setItem('demo_transactions', JSON.stringify([...storedTx, { ...txData, id: newId }]));
      
      const storedAcc = JSON.parse(localStorage.getItem('demo_accounts') || '[]');
      const updatedAcc = storedAcc.map((a: any) => {
        if (a.id === newTx.accountId) {
          return { ...a, balance: newTx.type === TransactionType.INCOME ? a.balance + amountNum : a.balance - amountNum };
        }
        return a;
      });
      localStorage.setItem('demo_accounts', JSON.stringify(updatedAcc));
      window.location.reload();
    } else if (db) {
      // Type Guard: Ensure db is not null
      try {
        await addDoc(collection(db, 'transactions'), txData);
        const targetAcc = accounts.find(a => a.id === newTx.accountId);
        if (targetAcc) {
          const accRef = doc(db, 'accounts', newTx.accountId);
          const newBalance = newTx.type === TransactionType.INCOME 
            ? targetAcc.balance + amountNum 
            : targetAcc.balance - amountNum;
          await updateDoc(accRef, { balance: newBalance });
        }
      } catch (err) {
        console.error("Firestore Error:", err);
      }
    }
    setShowTxModal(false);
  };

  const handleAddAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    const accData = {
      name: newAcc.name,
      bankName: newAcc.bankName,
      balance: Number(newAcc.balance),
      color: ACCOUNT_COLORS[accounts.length % ACCOUNT_COLORS.length],
      userId: user.uid
    };

    if (isOfflineMode) {
      const storedAcc = JSON.parse(localStorage.getItem('demo_accounts') || '[]');
      const newId = `a-${Date.now()}`;
      localStorage.setItem('demo_accounts', JSON.stringify([...storedAcc, { ...accData, id: newId }]));
      window.location.reload();
    } else if (db) {
      try {
        await addDoc(collection(db, 'accounts'), accData);
      } catch (err) {
        console.error("Firestore Error:", err);
      }
    }
    setShowAccModal(false);
  };

  const handleDeleteTransaction = async (txId: string, accountId: string, amount: number, type: TransactionType) => {
    if (isOfflineMode) {
      const storedTx = JSON.parse(localStorage.getItem('demo_transactions') || '[]');
      localStorage.setItem('demo_transactions', JSON.stringify(storedTx.filter((t: any) => t.id !== txId)));
      window.location.reload();
      return;
    }
    
    if (db) {
      try {
        await deleteDoc(doc(db, 'transactions', txId));
        const acc = accounts.find(a => a.id === accountId);
        if (acc) {
          const restoredBalance = type === TransactionType.INCOME ? acc.balance - amount : acc.balance + amount;
          await updateDoc(doc(db, 'accounts', accountId), { balance: restoredBalance });
        }
      } catch (err) {
        console.error("Delete Error:", err);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-10">
      {/* 頂部數據看板 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-40">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="bg-blue-50 p-2 rounded-xl text-blue-500"><Wallet size={20} /></div>
            <span className="font-semibold">資產總淨值</span>
          </div>
          <h3 className="text-3xl font-extrabold text-gray-900">
            ${accounts.reduce((sum, a) => sum + a.balance, 0).toLocaleString()}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-40">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="bg-emerald-50 p-2 rounded-xl text-emerald-500"><ArrowUpCircle size={20} /></div>
            <span className="font-semibold">本月收入</span>
          </div>
          <h3 className="text-3xl font-extrabold text-emerald-600">
            +${stats.income.toLocaleString()}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex flex-col justify-between h-40">
          <div className="flex items-center gap-3 text-gray-500">
            <div className="bg-rose-50 p-2 rounded-xl text-rose-500"><ArrowDownCircle size={20} /></div>
            <span className="font-semibold">本月支出</span>
          </div>
          <h3 className="text-3xl font-extrabold text-rose-600">
            -${stats.expense.toLocaleString()}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* 帳戶管理 */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">我的銀行帳戶</h2>
              <button 
                onClick={() => setShowAccModal(true)}
                className="text-sm font-bold text-blue-600 hover:bg-blue-50 px-3 py-1.5 rounded-lg transition-all flex items-center gap-1"
              >
                <Plus size={16} /> 新增
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {accounts.length > 0 ? accounts.map(acc => (
                <div key={acc.id} className="relative bg-white p-5 rounded-2xl shadow-sm border border-gray-100 overflow-hidden group">
                  <div className="absolute top-0 left-0 w-1.5 h-full" style={{ backgroundColor: acc.color }}></div>
                  <div className="flex justify-between items-start pl-2">
                    <div>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">{acc.bankName}</p>
                      <h4 className="text-lg font-bold text-gray-800">{acc.name}</h4>
                    </div>
                    <p className="text-xl font-bold text-gray-900">${acc.balance.toLocaleString()}</p>
                  </div>
                </div>
              )) : (
                <div className="col-span-full py-8 text-center text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl">
                  尚無帳戶，請先新增一個。
                </div>
              )}
            </div>
          </section>

          {/* 圖表分析 */}
          <section className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">消費類別佔比</h2>
            <div className="h-[320px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={70}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DEFAULT_CATEGORIES.find(c => c.name === entry.name)?.color} stroke="none" />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                    />
                    <Legend verticalAlign="bottom" iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-gray-400 gap-2">
                  <AlertCircle size={40} />
                  <p>尚無支出數據可供視覺化</p>
                </div>
              )}
            </div>
          </section>

          {/* 交易紀錄 */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">近期收支紀錄</h2>
              <button 
                onClick={() => setShowTxModal(true)}
                disabled={accounts.length === 0}
                className="px-5 py-2.5 bg-gray-900 text-white rounded-xl shadow-lg hover:bg-gray-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus size={18} /> 記一筆
              </button>
            </div>
            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-50">
                {transactions.length > 0 ? transactions.sort((a,b) => b.date.localeCompare(a.date)).map(tx => {
                  const category = DEFAULT_CATEGORIES.find(c => c.name === tx.category);
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-5 hover:bg-gray-50 transition-colors group">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-11 h-11 rounded-2xl flex items-center justify-center text-white shadow-sm" 
                          style={{ backgroundColor: category?.color }}
                        >
                          {category?.icon}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{tx.category}</p>
                          <p className="text-sm text-gray-400 flex items-center gap-2 mt-0.5">
                            <Calendar size={12} /> {tx.date} {tx.note && `• ${tx.note}`}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-5">
                        <p className={`text-lg font-bold ${tx.type === TransactionType.INCOME ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {tx.type === TransactionType.INCOME ? '+' : '-'}${Number(tx.amount).toLocaleString()}
                        </p>
                        <button 
                          onClick={() => handleDeleteTransaction(tx.id, tx.accountId, Number(tx.amount), tx.type)}
                          className="text-gray-300 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="py-20 text-center text-gray-400">目前沒有交易紀錄</div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* AI 助手側欄 */}
        <div className="space-y-6">
          <section className="bg-gradient-to-br from-blue-700 via-indigo-700 to-purple-800 p-8 rounded-[2.5rem] shadow-2xl text-white">
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-sm shadow-inner">
                <Sparkles size={26} className="text-yellow-300 animate-pulse" />
              </div>
              <h2 className="text-2xl font-black tracking-tight">AI 理財諮詢</h2>
            </div>
            <div className="bg-black/10 backdrop-blur-md rounded-3xl p-6 mb-8 min-h-[250px] border border-white/5 shadow-inner">
              {isAdviceLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-5 py-10">
                  <div className="w-10 h-10 border-4 border-yellow-300 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-indigo-100 font-medium animate-pulse">Gemini 正在分析您的財務大數據...</p>
                </div>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-line text-blue-50/90 font-medium">
                  {aiAdvice}
                </p>
              )}
            </div>
            <button 
              onClick={handleAiAdvice}
              disabled={isAdviceLoading || transactions.length === 0}
              className="w-full py-4 bg-yellow-400 hover:bg-yellow-300 text-indigo-950 font-black text-lg rounded-2xl shadow-[0_8px_0_rgb(202,138,4)] active:translate-y-1 active:shadow-none transition-all disabled:opacity-50 disabled:translate-y-0 disabled:shadow-none"
            >
              獲取 AI 深度建議
            </button>
          </section>

          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h4 className="font-extrabold text-gray-800 mb-2">💡 您知道嗎？</h4>
            <p className="text-sm text-gray-500 leading-relaxed">
              根據統計，養成每天記帳習慣的使用者，平均每個月能多存下 15% 的收入。讓 Gemini 幫您監控每一塊錢的去向。
            </p>
          </div>
        </div>
      </div>

      {/* 交易 Modal */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-gray-900 mb-8">記下這筆收支</h3>
            <form onSubmit={handleAddTransaction} className="space-y-6">
              <div className="flex gap-2 p-1.5 bg-gray-100 rounded-2xl">
                <button 
                  type="button"
                  onClick={() => setNewTx({...newTx, type: TransactionType.EXPENSE})}
                  className={`flex-1 py-3 rounded-xl font-black transition-all ${newTx.type === TransactionType.EXPENSE ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                >
                  支出
                </button>
                <button 
                  type="button"
                  onClick={() => setNewTx({...newTx, type: TransactionType.INCOME})}
                  className={`flex-1 py-3 rounded-xl font-black transition-all ${newTx.type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500 hover:bg-gray-200'}`}
                >
                  收入
                </button>
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 ml-1">金額</label>
                <input 
                  type="number" 
                  required
                  autoFocus
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 text-xl font-black transition-all"
                  placeholder="0.00"
                  value={newTx.amount}
                  onChange={e => setNewTx({...newTx, amount: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 ml-1">日期</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold"
                    value={newTx.date}
                    onChange={e => setNewTx({...newTx, date: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-black text-gray-700 ml-1">扣款帳戶</label>
                  <select 
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-100 rounded-xl outline-none focus:border-blue-500 font-bold"
                    value={newTx.accountId}
                    onChange={e => setNewTx({...newTx, accountId: e.target.value})}
                  >
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 ml-1">類別</label>
                <select 
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold"
                  value={newTx.category}
                  onChange={e => setNewTx({...newTx, category: e.target.value})}
                >
                  {DEFAULT_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 ml-1">備註 (可選)</label>
                <input 
                  type="text" 
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold"
                  placeholder="想寫點什麼..."
                  value={newTx.note}
                  onChange={e => setNewTx({...newTx, note: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowTxModal(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                >
                  儲存交易
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 帳戶 Modal */}
      {showAccModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in">
          <div className="bg-white w-full max-w-md rounded-[2.5rem] p-10 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-2xl font-black text-gray-900 mb-8">新增資產帳戶</h3>
            <form onSubmit={handleAddAccount} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 ml-1">帳戶暱稱</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold"
                  placeholder="例如：生活開銷帳戶"
                  value={newAcc.name}
                  onChange={e => setNewAcc({...newAcc, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 ml-1">銀行單位</label>
                <input 
                  type="text" 
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 font-bold"
                  placeholder="例如：中國信託 / 郵局"
                  value={newAcc.bankName}
                  onChange={e => setNewAcc({...newAcc, bankName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-black text-gray-700 ml-1">目前餘額</label>
                <input 
                  type="number" 
                  required
                  className="w-full px-6 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl outline-none focus:border-blue-500 text-xl font-black transition-all"
                  placeholder="0"
                  value={newAcc.balance}
                  onChange={e => setNewAcc({...newAcc, balance: e.target.value})}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAccModal(false)}
                  className="flex-1 py-4 bg-gray-100 text-gray-600 font-black rounded-2xl hover:bg-gray-200 transition-all"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-4 bg-blue-600 text-white font-black rounded-2xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                >
                  確認新增
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
