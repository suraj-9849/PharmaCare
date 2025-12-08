'use client';

import { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Send, Bot, User, Pill, AlertCircle, TrendingUp, Upload, FileSpreadsheet } from 'lucide-react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface InventoryItem {
  drug_name: string;
  generic_name: string;
  batch_number: string;
  quantity: number;
  expiry: string;
  location: string;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export default function Home() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch Inventory
  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = () => {
    fetch('http://localhost:8000/inventory')
      .then((res) => res.json())
      .then((data) => setInventory(data))
      .catch((err) => console.error('Failed to fetch inventory:', err));
  };

  // Handle File Upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('http://localhost:8000/upload-inventory', {
        method: 'POST',
        body: formData,
      });
      
      const data = await res.json();
      
      if (res.ok) {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `✅ **Upload Successful!**\n\n${data.message}` 
        }]);
        fetchInventory(); // Refresh inventory list
      } else {
        setMessages(prev => [...prev, { 
          role: 'assistant', 
          content: `❌ **Upload Failed:** ${data.detail}` 
        }]);
      }
    } catch (error) {
      console.error('Upload error:', error);
      setMessages(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ **Network Error:** Could not upload file.` 
      }]);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Chat
  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMsg: ChatMessage = { role: 'user', content: input };
    const currentHistory = messages; // Capture history before adding new message

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: userMsg.content,
          history: currentHistory
        }),
      });
      const data = await res.json();
      const botMsg: ChatMessage = { role: 'assistant', content: data.response };
      setMessages((prev) => [...prev, botMsg]);
    } catch (error) {
      console.error('Chat error:', error);
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error connecting to agent.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex h-screen bg-gray-50 overflow-hidden font-sans text-gray-900">
      
      {/* Left Panel: Inventory Dashboard (30% width) */}
      <div className="w-[30%] bg-white border-r border-gray-200 flex flex-col h-full shadow-sm z-10">
        <div className="p-5 border-b border-gray-100 bg-white">
          <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
            <Pill className="w-6 h-6 text-blue-600" />
            Zenith&apos;25 Pharmacy
          </h1>
          <p className="text-xs text-gray-500 mt-1">Live Inventory Management</p>
          
          {/* Upload Button */}
          <div className="mt-4">
            <input 
              type="file" 
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept=".xlsx, .xls"
              className="hidden"
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full flex items-center justify-center gap-2 bg-green-50 hover:bg-green-100 text-green-700 border border-green-200 rounded-lg py-2 px-3 text-sm font-medium transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              {uploading ? 'Uploading...' : 'Upload Excel Stock'}
            </button>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto p-2">
          <div className="space-y-3">
            {inventory.map((item, idx) => (
              <div key={idx} className="bg-white border border-gray-100 rounded-lg p-3 hover:shadow-md transition-shadow duration-200">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="font-semibold text-gray-800">{item.drug_name}</h3>
                    <p className="text-xs text-gray-500">{item.generic_name}</p>
                  </div>
                  <span className={cn(
                    "px-2 py-1 rounded-full text-xs font-medium",
                    item.quantity < 20 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                  )}>
                    {item.quantity} units
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mt-2 bg-gray-50 p-2 rounded">
                  <div>
                    <span className="text-gray-400 block">Batch</span>
                    {item.batch_number}
                  </div>
                  <div>
                    <span className="text-gray-400 block">Expiry</span>
                    {item.expiry}
                  </div>
                  <div>
                    <span className="text-gray-400 block">Location</span>
                    {item.location}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="p-4 border-t border-gray-100 bg-gray-50 text-xs text-gray-500 text-center">
          {inventory.length} items in stock
        </div>
      </div>

      {/* Right Panel: AI Chatbot (70% width) */}
      <div className="flex-1 flex flex-col h-full relative bg-white">
        
        {/* Chat Header */}
        <div className="h-14 border-b border-gray-100 flex items-center justify-between px-6 bg-white/80 backdrop-blur-sm absolute top-0 w-full z-10">
          <div className="flex items-center gap-2">
            <span className="font-medium text-gray-700">AI Assistant</span>
            <span className="bg-blue-100 text-blue-700 text-[10px] px-2 py-0.5 rounded-full font-medium">GPT-3.5</span>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto pt-20 pb-32 px-4 md:px-20 lg:px-32 scroll-smooth">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-6">
                <Bot className="w-8 h-8 text-gray-400" />
              </div>
              <h2 className="text-2xl font-semibold text-gray-800 mb-2">How can I help you today?</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8 max-w-2xl w-full">
                <button onClick={() => setInput('\\reorder')} className="p-4 border rounded-xl hover:bg-gray-50 text-left transition-colors">
                  <div className="flex items-center gap-2 font-medium text-gray-700 mb-1">
                    <AlertCircle className="w-4 h-4 text-orange-500" />
                    Check Low Stock
                  </div>
                  <p className="text-sm text-gray-500">Find items below reorder level</p>
                </button>
                <button onClick={() => setInput('\\analysis')} className="p-4 border rounded-xl hover:bg-gray-50 text-left transition-colors">
                  <div className="flex items-center gap-2 font-medium text-gray-700 mb-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    Forecast Demand
                  </div>
                  <p className="text-sm text-gray-500">Analyze seasonal trends</p>
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {messages.map((msg, idx) => (
                <div key={idx} className={cn(
                  "flex gap-4 max-w-3xl mx-auto",
                  msg.role === 'user' ? "justify-end" : "justify-start"
                )}>
                  {msg.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <Bot className="w-5 h-5 text-green-600" />
                    </div>
                  )}
                  
                  <div className={cn(
                    "rounded-2xl px-5 py-3 max-w-[85%] shadow-sm",
                    msg.role === 'user' 
                      ? "bg-blue-600 text-white rounded-br-none" 
                      : "bg-white border border-gray-100 text-gray-800 rounded-bl-none"
                  )}>
                    {msg.role === 'assistant' ? (
                      <div className="prose prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-gray-50 prose-pre:border prose-pre:border-gray-200 prose-headings:text-gray-900 prose-p:text-gray-800 prose-strong:text-gray-900 prose-li:text-gray-800">
                        <ReactMarkdown 
                          remarkPlugins={[remarkGfm]}
                          components={{
                            a: ({node, ...props}) => {
                              // Safely check content for "Buy" to style as button
                              let content = "";
                              try {
                                if (typeof props.children === 'string') {
                                  content = props.children;
                                } else if (Array.isArray(props.children)) {
                                  content = props.children.map(child => 
                                    typeof child === 'string' ? child : ''
                                  ).join('');
                                }
                              } catch (e) {
                                console.error("Error parsing link content", e);
                              }
                              
                              const isButton = content.trim().startsWith('Buy');
                              
                              return (
                                <a 
                                  {...props} 
                                  target="_blank" 
                                  rel="noopener noreferrer"
                                  className={cn(
                                    "font-medium transition-colors",
                                    isButton 
                                      ? "inline-flex items-center justify-center bg-blue-600 text-white px-4 py-2 rounded-lg no-underline hover:bg-blue-700 hover:text-white my-2 mr-2 text-sm shadow-sm hover:shadow-md"
                                      : "!text-blue-600 hover:!text-blue-800 hover:underline"
                                  )}
                                />
                              )
                            }
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap">{msg.content}</p>
                    )}
                  </div>

                  {msg.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                      <User className="w-5 h-5 text-blue-600" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-4 max-w-3xl mx-auto">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-1">
                    <Bot className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-none px-5 py-4 shadow-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="absolute bottom-0 w-full bg-white p-4 border-t border-gray-100">
          <div className="max-w-3xl mx-auto relative">
            <input
              type="text"
              className="w-full bg-gray-50 border border-gray-200 rounded-full pl-6 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all shadow-sm"
              placeholder="Message Zenith AI..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
              disabled={loading}
            />
            <button 
              onClick={sendMessage}
              disabled={loading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-center text-xs text-gray-400 mt-2">
            AI can make mistakes. Check important info.
          </p>
        </div>

      </div>
    </main>
  );
}
