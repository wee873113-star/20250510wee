/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { CustomerUI } from './components/CustomerUI';
import { AdminUI } from './components/AdminUI';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Coffee, ListChecks, LogIn, LogOut, User } from 'lucide-react';
import { db, auth, OperationType, handleFirestoreError } from './lib/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut, User as FirebaseUser } from 'firebase/auth';

export default function App() {
  const [view, setView] = useState<'customer' | 'admin'>('customer');
  const [user, setUser] = useState<FirebaseUser | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error('Login Error:', error);
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  const seedData = async () => {
    try {
      const batch = writeBatch(db);
      
      const categories = [
        { id: 'tea', name: '找好茶', order: 1 },
        { id: 'milk-tea', name: '找奶茶', order: 2 },
        { id: 'latte', name: '找拿鐵', order: 3 },
        { id: 'fresh', name: '找新鮮', order: 4 },
      ];

      categories.forEach(cat => {
        const ref = doc(db, 'categories', cat.id);
        batch.set(ref, { name: cat.name, order: cat.order });
      });

      const products = [
        { name: '茉莉綠茶', category: 'tea', price_m: 25, price_l: 30, available: true },
        { name: '阿薩姆紅茶', category: 'tea', price_m: 25, price_l: 30, available: true },
        { name: '四季春青茶', category: 'tea', price_m: 25, price_l: 30, available: true },
        { name: '黃金烏龍', category: 'tea', price_m: 25, price_l: 30, available: true },
        { name: '珍珠奶茶', category: 'milk-tea', price_m: 35, price_l: 50, available: true },
        { name: '波霸奶茶', category: 'milk-tea', price_m: 35, price_l: 50, available: true },
        { name: '紅茶拿鐵', category: 'latte', price_m: 45, price_l: 60, available: true },
        { name: '8冰茶', category: 'fresh', price_m: 35, price_l: 50, available: true },
      ];

      products.forEach((p, index) => {
        const ref = doc(collection(db, 'products'));
        batch.set(ref, { ...p, order: index });
      });

      await batch.commit();
      alert('資料已成功初始化！');
      window.location.reload();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'seed');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navigation Bar */}
      <nav className="bg-[#fbdb00] text-[#00519a] p-4 shadow-md sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Coffee className="w-8 h-8" />
          <span>50嵐 茶飲點單</span>
        </div>
        
        <div className="flex gap-4 items-center">
          <button
            onClick={() => setView('customer')}
            className={`flex items-center gap-1 px-4 py-2 rounded-full transition-colors ${
              view === 'customer' ? 'bg-[#00519a] text-white' : 'hover:bg-yellow-400'
            }`}
          >
            <ListChecks className="w-4 h-4" />
            <span>點餐介面</span>
          </button>
          <button
            onClick={() => setView('admin')}
            className={`flex items-center gap-1 px-4 py-2 rounded-full transition-colors ${
              view === 'admin' ? 'bg-[#00519a] text-white' : 'hover:bg-yellow-400'
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>後台管理</span>
          </button>

          <div className="h-6 w-px bg-[#00519a]/20 mx-2" />

          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end text-xs font-medium">
                <span className="opacity-70">已登入</span>
                <span>{user.email}</span>
              </div>
              <button 
                onClick={logout}
                className="p-2 hover:bg-yellow-400 rounded-full transition-colors group"
                title="登出"
              >
                <LogOut className="w-5 h-5 group-hover:text-red-600" />
              </button>
            </div>
          ) : (
            <button
              onClick={login}
              className="flex items-center gap-2 px-4 py-2 bg-[#00519a] text-white rounded-full hover:bg-[#00427c] transition-colors"
            >
              <LogIn className="w-4 h-4" />
              <span>管理員登入</span>
            </button>
          )}
        </div>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4">
        <AnimatePresence mode="wait">
          {view === 'customer' ? (
            <motion.div
              key="customer"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
            >
              <CustomerUI />
            </motion.div>
          ) : (
            <motion.div
              key="admin"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <AdminUI onSeed={seedData} user={user} onLogin={login} />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="bg-white border-t p-4 text-center text-gray-500 text-sm">
        © 2024 50嵐 茶飲點單系統 模擬版
      </footer>
    </div>
  );
}
