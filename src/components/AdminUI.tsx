import { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { 
  collection, 
  onSnapshot, 
  query, 
  orderBy, 
  updateDoc, 
  doc, 
  serverTimestamp, 
  Timestamp,
  deleteDoc
} from 'firebase/firestore';
import { Order, OrderStatus } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Clock, CheckCircle, XCircle, Play, Package, Trash2, Database, ShieldAlert, LogIn } from 'lucide-react';
import { User as FirebaseUser } from 'firebase/auth';

interface AdminUIProps {
  onSeed: () => Promise<void>;
  user: FirebaseUser | null;
  onLogin: () => Promise<void>;
}

export function AdminUI({ onSeed, user, onLogin }: AdminUIProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const ordersData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Order[];
      setOrders(ordersData);
      setLoading(false);
    }, (err) => {
      console.error('Firestore Error in AdminUI:', err);
      if (err.message.includes('insufficient permissions')) {
        setError('您沒有管理員權限存取此頁面。');
      } else {
        setError('載入訂單時發生錯誤。');
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const updateStatus = async (orderId: string, status: OrderStatus) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), {
        status,
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `orders/${orderId}`);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('確定要刪除此訂單嗎？')) return;
    try {
      await deleteDoc(doc(db, 'orders', orderId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `orders/${orderId}`);
    }
  };

  const formatTime = (ts: Timestamp) => {
    if (!ts) return '...';
    const date = ts.toDate();
    return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  };

  const statusColors = {
    pending: 'bg-orange-100 text-orange-600 border-orange-200',
    preparing: 'bg-blue-100 text-blue-600 border-blue-200',
    completed: 'bg-green-100 text-green-600 border-green-200',
    cancelled: 'bg-red-100 text-red-600 border-red-200',
  };

  const statusIcons = {
    pending: <Clock className="w-4 h-4" />,
    preparing: <Play className="w-4 h-4" />,
    completed: <CheckCircle className="w-4 h-4" />,
    cancelled: <XCircle className="w-4 h-4" />,
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in slide-in-from-bottom-4">
        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 text-[#00519a]">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-2xl font-bold text-gray-800 mb-2">後台管理區域</h2>
        <p className="text-gray-500 mb-8 max-w-sm">
          此區域僅限管理員存取。請先登入以繼續操作。
        </p>
        <button
          onClick={onLogin}
          className="flex items-center gap-2 px-8 py-3 bg-[#00519a] text-white rounded-xl font-bold hover:bg-[#00427c] transition-all transform hover:scale-105 active:scale-95 shadow-lg shadow-blue-200"
        >
          <LogIn className="w-5 h-5" />
          <span>管理員登入</span>
        </button>
      </div>
    );
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 text-[#00519a] font-bold">
      <div className="w-12 h-12 border-4 border-[#00519a] border-t-transparent rounded-full animate-spin mb-4" />
      <span>載入訂單中...</span>
    </div>
  );

  if (error) return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
        <ShieldAlert className="w-8 h-8" />
      </div>
      <h3 className="text-xl font-bold text-gray-800 mb-2">存取被拒</h3>
      <p className="text-gray-500 mb-6">{error}</p>
      <div className="text-xs text-gray-400 bg-gray-50 p-4 rounded-lg">
        您的帳號：{user.email}<br />
        請聯絡開發者將此 Email 加入管理員名單。
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">訂單管理後台</h2>
          <p className="text-gray-400 text-sm mt-1">即時監控並處理所有茶飲訂單</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onSeed}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 transition-colors font-medium text-sm"
          >
            <Database className="w-4 h-4" />
            <span>初始化產品資料</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        <AnimatePresence>
          {orders.length === 0 ? (
            <div className="col-span-full py-20 text-center text-gray-400 bg-white rounded-2xl border-2 border-dashed">
              <Package className="w-16 h-16 mx-auto mb-4 opacity-10" />
              <p>目前沒有任何訂單</p>
            </div>
          ) : (
            orders.map(order => (
              <motion.div
                key={order.id}
                layout
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col overflow-hidden"
              >
                <div className="p-5 border-b flex justify-between items-start">
                  <div>
                    <div className="font-mono text-xs text-gray-400 mb-1 uppercase tracking-tighter">
                      ID: {order.id.slice(-6)}
                    </div>
                    <div className="text-lg font-bold text-gray-800">
                      {formatTime(order.createdAt)} 訂單
                    </div>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-1.5 ${statusColors[order.status]}`}>
                    {statusIcons[order.status]}
                    {order.status === 'pending' && '等待中'}
                    {order.status === 'preparing' && '製作中'}
                    {order.status === 'completed' && '已完成'}
                    {order.status === 'cancelled' && '已取消'}
                  </div>
                </div>

                <div className="p-5 flex-1 space-y-3 overflow-y-auto max-h-60">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-start text-sm">
                      <div className="flex-1">
                        <div className="font-bold text-gray-700">
                          {item.name} <span className="text-[#00519a] font-normal text-xs">({item.size})</span>
                          <span className="ml-2 text-gray-400">x{item.quantity}</span>
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          {item.sugar} | {item.ice} 
                          {item.additions.length > 0 && ` [+${item.additions.join(', ')}]`}
                        </div>
                      </div>
                      <div className="font-mono text-gray-500">${item.price * item.quantity}</div>
                    </div>
                  ))}
                </div>

                <div className="p-5 bg-gray-50 mt-auto space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500 font-medium">總計金額</span>
                    <span className="text-xl font-bold text-[#00519a] font-mono">${order.totalAmount}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {order.status === 'pending' && (
                      <button
                        onClick={() => updateStatus(order.id, 'preparing')}
                        className="col-span-2 py-2 bg-blue-500 text-white rounded-lg font-bold hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <Play className="w-4 h-4" />
                        <span>開始製作</span>
                      </button>
                    )}
                    {order.status === 'preparing' && (
                      <button
                        onClick={() => updateStatus(order.id, 'completed')}
                        className="col-span-2 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>標記為已完成</span>
                      </button>
                    )}
                    {order.status !== 'completed' && order.status !== 'cancelled' && (
                      <button
                        onClick={() => updateStatus(order.id, 'cancelled')}
                        className="py-2 bg-gray-200 text-gray-600 rounded-lg font-bold hover:bg-gray-300 transition-colors text-sm"
                      >
                        取消訂單
                      </button>
                    )}
                    <button
                      onClick={() => deleteOrder(order.id)}
                      className="py-2 bg-white border text-red-400 rounded-lg font-bold hover:bg-red-50 transition-colors text-sm flex items-center justify-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>刪除記錄</span>
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
