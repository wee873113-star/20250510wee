import { useState, useEffect } from 'react';
import { db, OperationType, handleFirestoreError } from '../lib/firebase';
import { collection, query, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Product, Category, OrderItem, SUGAR_LEVELS, ICE_LEVELS, ADDITIONS } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { Plus, Minus, ShoppingCart, X, Check, Coffee } from 'lucide-react';

export function CustomerUI() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Modal State
  const [modalSize, setModalSize] = useState<'M' | 'L'>('L');
  const [modalSugar, setModalSugar] = useState('正常');
  const [modalIce, setModalIce] = useState('正常');
  const [modalAdditions, setModalAdditions] = useState<string[]>([]);
  const [modalQuantity, setModalQuantity] = useState(1);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const catSnap = await getDocs(query(collection(db, 'categories'), orderBy('order')));
      const prodSnap = await getDocs(query(collection(db, 'products'), orderBy('order')));
      
      setCategories(catSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category)));
      setProducts(prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product)));
      setLoading(false);
    } catch (error) {
      handleFirestoreError(error, OperationType.LIST, 'categories/products');
    }
  };

  const openOrderModal = (product: Product) => {
    setSelectedProduct(product);
    setModalSize('L');
    setModalSugar('正常');
    setModalIce('正常');
    setModalAdditions([]);
    setModalQuantity(1);
    setShowOrderModal(true);
  };

  const addToCart = () => {
    if (!selectedProduct) return;

    const price = modalSize === 'M' ? selectedProduct.price_m : selectedProduct.price_l;
    const additionsPrice = modalAdditions.reduce((total, name) => {
      const add = ADDITIONS.find(a => a.name === name);
      return total + (add?.price || 0);
    }, 0);

    const newItem: OrderItem = {
      productId: selectedProduct.id,
      name: selectedProduct.name,
      size: modalSize,
      price: price + additionsPrice,
      quantity: modalQuantity,
      sugar: modalSugar,
      ice: modalIce,
      additions: [...modalAdditions],
    };

    setCart([...cart, newItem]);
    setShowOrderModal(false);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSubmitOrder = async () => {
    if (cart.length === 0) return;
    setSubmitting(true);
    try {
      await addDoc(collection(db, 'orders'), {
        items: cart,
        totalAmount,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      setCart([]);
      alert('訂單已提交！請至櫃檯結帳。');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'orders');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="flex justify-center p-20 text-[#00519a] font-bold">載入菜單中...</div>;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Menu Column */}
      <div className="lg:col-span-2 space-y-8">
        {categories.length === 0 && (
          <div className="bg-blue-50 p-8 rounded-xl text-center border-2 border-dashed border-blue-200">
            <p className="text-blue-600 mb-4">目前還沒有飲品資料，請先至後台初始化資料。</p>
          </div>
        )}
        
        {categories.map(category => (
          <div key={category.id} className="space-y-4">
            <h2 className="text-xl font-bold text-[#00519a] border-l-4 border-[#00519a] pl-3 flex items-center gap-2">
              <span className="w-8 h-8 bg-[#00519a] text-white rounded-full flex items-center justify-center text-sm">
                杯
              </span>
              {category.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {products
                .filter(p => p.category === category.id)
                .map(product => (
                  <button
                    key={product.id}
                    onClick={() => openOrderModal(product)}
                    className="flex justify-between items-center p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 group"
                  >
                    <div className="text-left">
                      <div className="font-medium group-hover:text-[#00519a] transition-colors">{product.name}</div>
                      <div className="text-xs text-gray-400 mt-1 uppercase tracking-wider">
                        {product.description || '經典茶飲'}
                      </div>
                    </div>
                    <div className="flex gap-4 text-sm font-bold text-gray-600">
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 font-normal">M</span>
                        <span>${product.price_m}</span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-[10px] text-gray-400 font-normal">L</span>
                        <span>${product.price_l}</span>
                      </div>
                    </div>
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>

      {/* Cart Column */}
      <div className="lg:col-span-1">
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-6 sticky top-24">
          <div className="flex items-center gap-2 text-xl font-bold text-[#00519a] mb-6 border-b pb-4">
            <ShoppingCart className="w-6 h-6" />
            <span>我的購物車</span>
            <span className="ml-auto bg-[#fbdb00] text-[#00519a] px-2 py-0.5 rounded text-sm">{cart.length}</span>
          </div>

          <div className="space-y-4 max-h-[50vh] overflow-y-auto mb-6 pr-2">
            {cart.length === 0 ? (
              <div className="text-center py-10 text-gray-400">
                <Coffee className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>還沒有選購任何飲品</p>
              </div>
            ) : (
              cart.map((item, index) => (
                <div key={index} className="flex gap-3 bg-gray-50 p-3 rounded-lg relative group">
                  <div className="flex-1">
                    <div className="font-bold text-gray-800">{item.name} <span className="text-[#00519a]">({item.size})</span></div>
                    <div className="text-xs text-gray-500 mt-1">
                      {item.sugar} / {item.ice} 
                      {item.additions.length > 0 && ` + ${item.additions.join(', ')}`}
                    </div>
                    <div className="mt-2 flex justify-between items-center">
                      <div className="text-sm font-bold text-[#00519a]">x{item.quantity}</div>
                      <div className="font-mono text-sm">${item.price * item.quantity}</div>
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFromCart(index)}
                    className="p-1 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center text-lg font-bold mb-6">
              <span>總金額</span>
              <span className="text-2xl text-[#00519a] font-mono">${totalAmount}</span>
            </div>
            
            <button
              onClick={handleSubmitOrder}
              disabled={cart.length === 0 || submitting}
              className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${
                cart.length > 0 && !submitting
                  ? 'bg-[#fbdb00] text-[#00519a] hover:bg-[#ffe536] hover:scale-[1.02] active:scale-[0.98]'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              {submitting ? '提交中...' : (
                <>
                  <Check className="w-6 h-6" />
                  <span>確認下單</span>
                </>
              )}
            </button>
            <p className="text-center text-[10px] text-gray-400 mt-3">
              大杯抵2元 ・ 中杯抵1元 (模擬優惠)
            </p>
          </div>
        </div>
      </div>

      {/* Order Options Modal */}
      <AnimatePresence>
        {showOrderModal && selectedProduct && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOrderModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 10 }}
              className="relative bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="bg-[#fbdb00] p-6 text-[#00519a]">
                <h3 className="text-2xl font-bold">{selectedProduct.name}</h3>
                <p className="text-sm opacity-80 mt-1 uppercase tracking-widest">請選擇您的個人喜好</p>
              </div>

              <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                {/* Size */}
                <section>
                  <label className="text-sm font-bold text-gray-400 uppercase block mb-3">大小</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      onClick={() => setModalSize('M')}
                      className={`py-3 rounded-xl border-2 font-bold transition-all ${
                        modalSize === 'M' ? 'border-[#00519a] bg-[#00519a]/5 text-[#00519a]' : 'border-gray-100 text-gray-400'
                      }`}
                    >
                      中杯 (M) ${selectedProduct.price_m}
                    </button>
                    <button
                      onClick={() => setModalSize('L')}
                      className={`py-3 rounded-xl border-2 font-bold transition-all ${
                        modalSize === 'L' ? 'border-[#00519a] bg-[#00519a]/5 text-[#00519a]' : 'border-gray-100 text-gray-400'
                      }`}
                    >
                      大杯 (L) ${selectedProduct.price_l}
                    </button>
                  </div>
                </section>

                {/* Sugar */}
                <section>
                  <label className="text-sm font-bold text-gray-400 uppercase block mb-3">甜度</label>
                  <div className="flex flex-wrap gap-2">
                    {SUGAR_LEVELS.map(level => (
                      <button
                        key={level}
                        onClick={() => setModalSugar(level)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          modalSugar === level ? 'bg-[#00519a] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Ice */}
                <section>
                  <label className="text-sm font-bold text-gray-400 uppercase block mb-3">冰塊</label>
                  <div className="flex flex-wrap gap-2">
                    {ICE_LEVELS.map(level => (
                      <button
                        key={level}
                        onClick={() => setModalIce(level)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                          modalIce === level ? 'bg-[#00519a] text-white' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </section>

                {/* Additions */}
                <section>
                  <label className="text-sm font-bold text-gray-400 uppercase block mb-3">加料</label>
                  <div className="flex flex-wrap gap-2">
                    {ADDITIONS.map(add => (
                      <button
                        key={add.name}
                        onClick={() => {
                          if (modalAdditions.includes(add.name)) {
                            setModalAdditions(modalAdditions.filter(a => a !== add.name));
                          } else {
                            setModalAdditions([...modalAdditions, add.name]);
                          }
                        }}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                          modalAdditions.includes(add.name) 
                            ? 'bg-blue-50 border-[#00519a] text-[#00519a]' 
                            : 'border-gray-200 text-gray-500'
                        }`}
                      >
                        {add.name} (+${add.price})
                      </button>
                    ))}
                  </div>
                </section>

                {/* Quantity */}
                <section className="flex items-center justify-between pt-4 border-t">
                  <span className="font-bold text-gray-700">數量</span>
                  <div className="flex items-center gap-6">
                    <button 
                      onClick={() => setModalQuantity(Math.max(1, modalQuantity - 1))}
                      className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#00519a] hover:text-[#00519a]"
                    >
                      <Minus className="w-5 h-5" />
                    </button>
                    <span className="text-2xl font-bold w-4 text-center">{modalQuantity}</span>
                    <button 
                      onClick={() => setModalQuantity(modalQuantity + 1)}
                      className="w-10 h-10 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-400 hover:border-[#00519a] hover:text-[#00519a]"
                    >
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </section>
              </div>

              <div className="p-6 bg-gray-50 flex gap-4">
                <button
                  onClick={() => setShowOrderModal(false)}
                  className="flex-1 py-4 bg-white border border-gray-200 text-gray-500 rounded-2xl font-bold hover:bg-gray-100 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={addToCart}
                  className="flex-[2] py-4 bg-[#00519a] text-white rounded-2xl font-bold shadow-lg hover:bg-[#00427c] transition-all transform hover:scale-[1.02]"
                >
                  加入購物車
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
