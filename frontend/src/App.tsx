import { useState, useEffect, useRef } from 'react';
import { supabase } from './lib/supabase';
import type { Product, Message, CartItem } from './types';
import { getSessionId } from './utils/session';
import { sendChatMessage } from './services/apiClient';
import { ChatMessage } from './components/ChatMessage';
import { ProductCard } from './components/ProductCard';
import { ShoppingCart } from './components/ShoppingCart';
import { Send, ShoppingCart as CartIcon, Bot, Package, Mic, MicOff, Volume2, VolumeX, Camera } from 'lucide-react';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  
  // Voice & Image features
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sessionId = getSessionId();

  useEffect(() => {
    loadProducts();
    loadCart();
    initializeConversation();
    initializeVoiceRecognition();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Initialize Voice Recognition
  const initializeVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.lang = 'en-US';

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
        setIsListening(false);
      };

      recognitionRef.current.onerror = () => setIsListening(false);
      recognitionRef.current.onend = () => setIsListening(false);
    }
  };

  // Toggle Voice Input
  const toggleVoiceInput = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
    }
  };

  // Text-to-Speech
  const speakText = (text: string) => {
    if (!voiceEnabled || !('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 1;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  // Stop Speech
  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  // Handle Image Upload
  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imageData = e.target?.result as string;
      setUploadedImage(imageData);
      setInputMessage('Find similar products for this image');
    };
    reader.readAsDataURL(file);
  };

  const loadProducts = async () => {
    const { data } = await supabase.from('products').select('*').order('created_at');
    if (data) setProducts(data);
  };

  const loadCart = async () => {
    const { data } = await supabase
      .from('cart_items')
      .select('*, product:products(*)')
      .eq('session_id', sessionId);
    if (data) setCartItems(data as CartItem[]);
  };

  const initializeConversation = async () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      conversation_id: '',
      role: 'assistant',
      content: 'Hello! 👋 Welcome to NextGen Mart! I\'m your AI shopping assistant with voice and visual search capabilities. I can help you find products, answer questions, and make recommendations. What are you looking for today?',
      created_at: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
  };

  const sendMessage = async () => {
    if ((!inputMessage.trim() && !uploadedImage) || isLoading) return;

    const userMessage: Message = {
      id: `temp-${Date.now()}`,
      conversation_id: conversationId || '',
      role: 'user',
      content: inputMessage,
      created_at: new Date().toISOString(),
      imageData: uploadedImage || undefined,
    };

    const messageText = inputMessage;
    const imageData = uploadedImage;
    
    setMessages((prev) => [...prev, userMessage]);
    setInputMessage('');
    setUploadedImage(null);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(messageText, imageData);

      const assistantMessage: Message = {
        id: `temp-${Date.now()}-assistant`,
        conversation_id: conversationId || '',
        role: 'assistant',
        content: response.reply,
        created_at: new Date().toISOString(),
        qualityMetrics: response.qualityMetrics,
        purchaseIntent: response.purchaseIntent,
      };

      setMessages((prev) => [...prev, assistantMessage]);
      
      // Speak response if voice enabled
      if (voiceEnabled && response.reply) {
        speakText(response.reply);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: `temp-${Date.now()}-error`,
        conversation_id: conversationId || '',
        role: 'assistant',
        content: 'Sorry, something went wrong. Please make sure the backend server is running and try again.',
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Rate Response Function
  const rateResponse = async (messageId: string, rating: 'positive' | 'negative') => {
    setMessages((prev) =>
      prev.map((msg) =>
        msg.id === messageId ? { ...msg, userRating: rating } : msg
      )
    );

    try {
      await fetch('http://localhost:3000/api/feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, rating }),
      });
    } catch (error) {
      console.error('Error sending feedback:', error);
    }
  };

  const addToCart = async (product: Product) => {
    const existingItem = cartItems.find((item) => item.product_id === product.id);

    if (existingItem) {
      await updateCartQuantity(existingItem.id, existingItem.quantity + 1);
    } else {
      const { data } = await supabase
        .from('cart_items')
        .insert({
          session_id: sessionId,
          product_id: product.id,
          quantity: 1,
        })
        .select('*, product:products(*)')
        .single();

      if (data) {
        setCartItems((prev) => [...prev, data as CartItem]);
      }
    }
  };

  const updateCartQuantity = async (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }

    await supabase.from('cart_items').update({ quantity }).eq('id', itemId);

    setCartItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    );
  };

  const removeFromCart = async (itemId: string) => {
    await supabase.from('cart_items').delete().eq('id', itemId);
    setCartItems((prev) => prev.filter((item) => item.id !== itemId));
  };

  const categories = ['All', ...new Set(products.map((p) => p.category))];
  const filteredProducts =
    selectedCategory === 'All'
      ? products
      : products.filter((p) => p.category === selectedCategory);

  const cartCount = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-gray-50">
      <header className="bg-white shadow-sm sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-lg">
                <Package className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900">NextGen Mart</h1>
            </div>
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
            >
              <CartIcon className="w-5 h-5" />
              Cart
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Browse Products</h2>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-lg font-medium whitespace-nowrap transition-colors ${
                      selectedCategory === category
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} onAddToCart={addToCart} />
              ))}
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg sticky top-24 overflow-hidden flex flex-col h-[calc(100vh-8rem)]">
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bot className="w-6 h-6 text-white" />
                  <h2 className="text-xl font-bold text-white">AI Assistant</h2>
                </div>
                {/* Voice Toggle */}
                <button
                  onClick={() => {
                    setVoiceEnabled(!voiceEnabled);
                    if (isSpeaking) stopSpeech();
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    voiceEnabled ? 'bg-white/20 hover:bg-white/30' : 'bg-white/10'
                  }`}
                  title={voiceEnabled ? 'Voice Enabled' : 'Voice Disabled'}
                >
                  {voiceEnabled ? (
                    <Volume2 className="w-5 h-5 text-white" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-white" />
                  )}
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {messages.map((message) => (
                  <ChatMessage 
                    key={message.id} 
                    message={message}
                    onRate={rateResponse}
                  />
                ))}
                {isLoading && (
                  <div className="flex gap-3 bg-gray-50 p-4 rounded-lg">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-sm font-medium text-gray-900 mb-1">Shopping Assistant</p>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="p-4 border-t border-gray-200 bg-gray-50">
                {/* Image Preview */}
                {uploadedImage && (
                  <div className="mb-2 relative inline-block">
                    <img src={uploadedImage} alt="Upload preview" className="w-20 h-20 object-cover rounded-lg" />
                    <button
                      onClick={() => setUploadedImage(null)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs"
                    >
                      ✕
                    </button>
                  </div>
                )}
                
                {/*  Speaking Indicator */}
                {isSpeaking && (
                  <div className="mb-2 flex items-center gap-2 text-sm text-blue-600">
                    <Volume2 className="w-4 h-4 animate-pulse" />
                    <span>Speaking response...</span>
                    <button onClick={stopSpeech} className="text-red-500 underline text-xs">
                      Stop
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  {/* Voice Input Button */}
                  <button
                    onClick={toggleVoiceInput}
                    disabled={isSpeaking || isLoading}
                    className={`p-2 rounded-lg transition-colors ${
                      isListening
                        ? 'bg-red-500 text-white animate-pulse'
                        : 'bg-blue-600 hover:bg-blue-700 text-white'
                    } disabled:bg-gray-400`}
                    title={isListening ? 'Stop listening' : 'Start voice input'}
                  >
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>

                  {/* Image Upload Button */}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    className="p-2 rounded-lg bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:bg-gray-400"
                    title="Upload image to find similar products"
                  >
                    <Camera className="w-5 h-5" />
                  </button>

                  <input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                    placeholder={isListening ? "Listening..." : "Ask anything or upload image..."}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isLoading || isListening}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={isLoading || (!inputMessage.trim() && !uploadedImage)}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ShoppingCart
        items={cartItems}
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        onUpdateQuantity={updateCartQuantity}
        onRemoveItem={removeFromCart}
      />
    </div>
  );
}

export default App;
