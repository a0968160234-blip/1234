
import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Wallet, 
  ArrowUpCircle, 
  ArrowDownCircle, 
  Sparkles, 
  Trash2,
  Calendar,
  ChevronRight
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
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
  const [aiAdvice, setAiAdvice] = useState<string>('點擊下方按鈕，讓 AI 為您的財務狀況提供專業建議...');
  const [isAdviceLoading, setIsAdviceLoading] = useState(false);
  
  // Transaction Form States
  const [showTxModal, setShowTxModal] = useState(false);
  const [newTx, setNewTx] = useState({
    amount: '',
    accountId: accounts[0]?.id || '',
    type: TransactionType.EXPENSE,
    category: '飲食',
    date: new Date().toISOString().split('T')[0],
    note: ''
  });

  // Account Form States
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
      const updatedTx = [...storedTx, { ...txData, id: newId }];
      localStorage.setItem('demo_transactions', JSON.stringify(updatedTx));
      window.location.reload(); // Quick refresh to update
    } else {
      await addDoc(collection(db!, 'transactions'), txData);
      const accRef = doc(db!, 'accounts', newTx.accountId);
      const acc = accounts.find(a => a.id === newTx.accountId);
      if (acc) {
        const newBalance = newTx.type === TransactionType.INCOME 
          ? acc.balance + amountNum 
          : acc.balance - amountNum;
        await updateDoc(accRef, { balance: newBalance });
      }
    }
    setShowTxModal(false);
  };

  const handleDeleteTransaction = async (txId: string, accountId: string, amount: number, type: TransactionType) => {
    if (isOfflineMode) {
      const storedTx = JSON.parse(localStorage.getItem('demo_transactions') || '[]');
      const filtered = storedTx.filter((t: any) => t.id !== txId);
      localStorage.setItem('demo_transactions', JSON.stringify(filtered));
      window.location.reload();
      return;
    }
    await deleteDoc(doc(db!, 'transactions', txId));
    const acc = accounts.find(a => a.id === accountId);
    if (acc) {
      const accRef = doc(db!, 'accounts', accountId);
      const restoredBalance = type === TransactionType.INCOME 
        ? acc.balance - amount 
        : acc.balance + amount;
      await updateDoc(accRef, { balance: restoredBalance });
    }
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
    } else {
      await addDoc(collection(db!, 'accounts'), accData);
    }
    setShowAccModal(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <Wallet size={20} className="text-blue-500" />
            <span className="font-medium">總資產</span>
          </div>
          <h3 className="text-3xl font-bold text-gray-900">
            ${accounts.reduce((sum, a) => sum + a.balance, 0).toLocaleString()}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <ArrowUpCircle size={20} className="text-emerald-500" />
            <span className="font-medium">本月收入</span>
          </div>
          <h3 className="text-3xl font-bold text-emerald-600">
            +${stats.income.toLocaleString()}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-3 text-gray-500 mb-2">
            <ArrowDownCircle size={20} className="text-rose-500" />
            <span className="font-medium">本月支出</span>
          </div>
          <h3 className="text-3xl font-bold text-rose-600">
            -${stats.expense.toLocaleString()}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: Accounts & Charts */}
        <div className="lg:col-span-2 space-y-8">
          {/* Accounts List */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">我的帳戶</h2>
              <button 
                onClick={() => setShowAccModal(true)}
                className="flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700 transition-colors"
              >
                <Plus size={18} /> 新增帳戶
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {accounts.map(acc => (
                <div key={acc.id} className="relative group overflow-hidden bg-white p-5 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all">
                  <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: acc.color }}></div>
                  <div className="flex justify-between items-start pl-3">
                    <div>
                      <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{acc.bankName}</p>
                      <h4 className="text-lg font-bold text-gray-800">{acc.name}</h4>
                    </div>
                    <p className="text-xl font-bold text-gray-900">${acc.balance.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Visualization */}
          <section className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-xl font-bold text-gray-800 mb-6">支出分析</h2>
            <div className="h-[300px]">
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={chartData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={DEFAULT_CATEGORIES.find(c => c.name === entry.name)?.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-gray-400">
                  尚無支出紀錄可顯示圖表
                </div>
              )}
            </div>
          </section>

          {/* Transactions History */}
          <section>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-800">近期紀錄</h2>
              <button 
                onClick={() => setShowTxModal(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all flex items-center gap-2"
              >
                <Plus size={18} /> 新增交易
              </button>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="divide-y divide-gray-100">
                {transactions.length > 0 ? transactions.sort((a,b) => b.date.localeCompare(a.date)).map(tx => {
                  const category = DEFAULT_CATEGORIES.find(c => c.name === tx.category);
                  return (
                    <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div 
                          className="w-10 h-10 rounded-full flex items-center justify-center text-white" 
                          style={{ backgroundColor: category?.color }}
                        >
                          {category?.icon}
                        </div>
                        <div>
                          <p className="font-bold text-gray-800">{tx.category}</p>
                          <p className="text-sm text-gray-400 flex items-center gap-1">
                            <Calendar size={12} /> {tx.date} • {tx.note || '無備註'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className={`font-bold ${tx.type === TransactionType.INCOME ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {tx.type === TransactionType.INCOME ? '+' : '-'}${Number(tx.amount).toLocaleString()}
                        </p>
                        <button 
                          onClick={() => handleDeleteTransaction(tx.id, tx.accountId, Number(tx.amount), tx.type)}
                          className="text-gray-300 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                }) : (
                  <div className="p-12 text-center text-gray-400">尚無交易紀錄</div>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Right: AI Advisor */}
        <div className="space-y-8">
          <section className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-3xl shadow-xl text-white">
            <div className="flex items-center gap-2 mb-4">
              <div className="bg-white/20 p-2 rounded-xl">
                <Sparkles size={24} className="text-yellow-300" />
              </div>
              <h2 className="text-xl font-bold">AI 智慧理財助手</h2>
            </div>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 mb-6 min-h-[200px] border border-white/10">
              {isAdviceLoading ? (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-8">
                  <div className="w-8 h-8 border-4 border-yellow-300 border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-sm text-indigo-100">Gemini 正在分析您的財務報表...</p>
                </div>
              ) : (
                <p className="text-sm leading-relaxed whitespace-pre-line text-indigo-50">
                  {aiAdvice}
                </p>
              )}
            </div>
            <button 
              onClick={handleAiAdvice}
              disabled={isAdviceLoading}
              className="w-full py-3 bg-yellow-400 hover:bg-yellow-500 text-indigo-900 font-bold rounded-2xl shadow-lg transition-all disabled:opacity-50"
            >
              獲取理財建議
            </button>
          </section>

          {/* Quick Tip Card */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <h4 className="font-bold text-gray-800 mb-2">💡 理財小撇步</h4>
            <p className="text-sm text-gray-500">
              設定「50/30/20」原則：50% 需求、30% 想要、20% 儲蓄。這能幫助您更健康地分配資產。
            </p>
          </div>
        </div>
      </div>

      {/* Transaction Modal */}
      {showTxModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">新增交易</h3>
            <form onSubmit={handleAddTransaction} className="space-y-4">
              <div className="flex gap-2 p-1 bg-gray-100 rounded-xl mb-4">
                <button 
                  type="button"
                  onClick={() => setNewTx({...newTx, type: TransactionType.EXPENSE})}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all ${newTx.type === TransactionType.EXPENSE ? 'bg-white text-rose-600 shadow-sm' : 'text-gray-500'}`}
                >
                  支出
                </button>
                <button 
                  type="button"
                  onClick={() => setNewTx({...newTx, type: TransactionType.INCOME})}
                  className={`flex-1 py-2 rounded-lg font-bold transition-all ${newTx.type === TransactionType.INCOME ? 'bg-white text-emerald-600 shadow-sm' : 'text-gray-500'}`}
                >
                  收入
                </button>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">金額</label>
                <input 
                  type="number" 
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  value={newTx.amount}
                  onChange={e => setNewTx({...newTx, amount: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">日期</label>
                  <input 
                    type="date" 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    value={newTx.date}
                    onChange={e => setNewTx({...newTx, date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">帳戶</label>
                  <select 
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                    value={newTx.accountId}
                    onChange={e => setNewTx({...newTx, accountId: e.target.value})}
                  >
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">分類</label>
                <select 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  value={newTx.category}
                  onChange={e => setNewTx({...newTx, category: e.target.value})}
                >
                  {DEFAULT_CATEGORIES.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">備註</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="寫點什麼..."
                  value={newTx.note}
                  onChange={e => setNewTx({...newTx, note: e.target.value})}
                />
              </div>

              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowTxModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700"
                >
                  確認新增
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Modal */}
      {showAccModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-200">
            <h3 className="text-2xl font-bold text-gray-800 mb-6">新增帳戶</h3>
            <form onSubmit={handleAddAccount} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">帳戶名稱</label>
                <input 
                  type="text" 
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：薪轉帳戶"
                  value={newAcc.name}
                  onChange={e => setNewAcc({...newAcc, name: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">銀行名稱</label>
                <input 
                  type="text" 
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例如：中國信託"
                  value={newAcc.bankName}
                  onChange={e => setNewAcc({...newAcc, bankName: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">初始餘額</label>
                <input 
                  type="number" 
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  value={newAcc.balance}
                  onChange={e => setNewAcc({...newAcc, balance: e.target.value})}
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button 
                  type="button" 
                  onClick={() => setShowAccModal(false)}
                  className="flex-1 py-3 bg-gray-100 text-gray-600 font-bold rounded-xl hover:bg-gray-200"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 text-white font-bold rounded-xl shadow-lg shadow-blue-200 hover:bg-blue-700"
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
