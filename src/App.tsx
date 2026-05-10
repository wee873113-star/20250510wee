/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { CustomerUI } from './components/CustomerUI';
import { motion, AnimatePresence } from 'motion/react';
import { Coffee, RefreshCw } from 'lucide-react';
import { db, OperationType, handleFirestoreError } from './lib/firebase';
import { collection, writeBatch, doc } from 'firebase/firestore';

export default function App() {
  const [isSeeding, setIsSeeding] = useState(false);

  const seedData = async () => {
    if (!confirm('確定要初始化選單資料嗎？這會建立預設的 50嵐 品項。')) return;
    setIsSeeding(true);
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
        { name: '茉莉綠茶', category: 'tea', price_m: 25, price_l: 30, available: true, order: 1 },
        { name: '阿薩姆紅茶', category: 'tea', price_m: 25, price_l: 30, available: true, order: 2 },
        { name: '四季春青茶', category: 'tea', price_m: 25, price_l: 30, available: true, order: 3 },
        { name: '黃金烏龍', category: 'tea', price_m: 25, price_l: 30, available: true, order: 4 },
        { name: '珍珠奶茶', category: 'milk-tea', price_m: 35, price_l: 50, available: true, order: 5 },
        { name: '波霸奶茶', category: 'milk-tea', price_m: 35, price_l: 50, available: true, order: 6 },
        { name: '紅茶拿鐵', category: 'latte', price_m: 45, price_l: 60, available: true, order: 7 },
        { name: '8冰茶', category: 'fresh', price_m: 35, price_l: 50, available: true, order: 8 },
      ];

      products.forEach((p) => {
        const ref = doc(collection(db, 'products'));
        batch.set(ref, p);
      });

      await batch.commit();
      alert('資料已成功初始化！');
      window.location.reload();
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'seed');
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col font-sans">
      {/* Navigation Bar */}
      <nav className="bg-[#fbdb00] text-[#00519a] p-4 shadow-md sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-2 font-bold text-xl">
          <Coffee className="w-8 h-8" />
          <span>50嵐 茶飲點單系統</span>
        </div>
        
        <button
          onClick={seedData}
          disabled={isSeeding}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[#00519a]/20 hover:bg-yellow-400 transition-colors text-sm font-medium"
          title="初始化菜單資料"
        >
          <RefreshCw className={`w-4 h-4 ${isSeeding ? 'animate-spin' : ''}`} />
          <span>{isSeeding ? '初始化中...' : '初始化菜單'}</span>
        </button>
      </nav>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4">
        <AnimatePresence mode="wait">
          <motion.div
            key="customer"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CustomerUI />
          </motion.div>
        </AnimatePresence>
      </main>

      <footer className="bg-white border-t p-4 text-center text-gray-500 text-sm">
        © 2024 50嵐 茶飲點單系統 簡化版
      </footer>
    </div>
  );
}
