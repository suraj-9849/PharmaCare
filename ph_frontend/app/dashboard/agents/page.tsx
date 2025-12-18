'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import {
  Send,
  Bot,
  User,
  Sparkles,
  RotateCcw,
  Upload,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  AlertCircle,
  Package,
  TrendingUp,
  ShoppingCart,
  Trash2,
  RefreshCw,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';
import { ReorderPanel } from '@/components/agents/ReorderPanel';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  toolsUsed?: string[];
  timestamp: Date;
}

interface UploadResult {
  success: boolean;
  message: string;
  addedCount?: number;
  errors?: string[];
}

export default function AgentsPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [activeTab, setActiveTab] = useState('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (activeTab === 'chat') {
      inputRef.current?.focus();
    }
  }, [activeTab]);

  const generateId = () => Math.random().toString(36).substring(2, 9);

  const handleSendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || isLoading) return;

    const userMessage: ChatMessage = {
      id: generateId(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-20).map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const response = await apiClient.agent.chat(text, history);
      const data = response.data;

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data?.response || 'I encountered an issue processing your request.',
        toolsUsed: data?.tools_used || [],
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content:
          "I'm having trouble connecting to the agent service. Please check if the AI service is running.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  }, [input, isLoading, messages]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleClearChat = () => {
    setMessages([]);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadResult(null);

    try {
      const response = await apiClient.uploadInventory(file);
      setUploadResult({
        success: true,
        message: response.data?.message || 'Upload successful',
        addedCount: response.data?.added_count,
        errors: response.data?.errors || [],
      });
    } catch (error) {
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : 'Upload failed',
      });
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const quickActions = [
    { label: 'Check Low Stock', icon: Package, query: 'Check for low stock items' },
    { label: 'Forecast Demand', icon: TrendingUp, query: 'Run demand forecast analysis' },
    { label: 'Check Expiring', icon: AlertCircle, query: 'Show items expiring soon' },
    { label: 'Full Inventory', icon: ShoppingCart, query: '/get_inventory' },
  ];

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg shadow-violet-500/25">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Pharmacy Agent</h1>
            <p className="text-sm text-gray-500">Intelligent inventory management</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-1 flex-col">
        <TabsList className="mb-4 grid w-full max-w-lg grid-cols-3">
          <TabsTrigger value="chat" className="gap-2">
            <Sparkles className="h-4 w-4" />
            Chat
          </TabsTrigger>
          <TabsTrigger value="reorder" className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Reorder
          </TabsTrigger>
          <TabsTrigger value="upload" className="gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
        </TabsList>

        {/* Chat Tab */}
        <TabsContent value="chat" className="flex flex-1 flex-col mt-0">
          <Card className="flex flex-1 flex-col overflow-hidden rounded-2xl border-gray-200/80 bg-white shadow-sm">
            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto">
              {messages.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                  <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-violet-50 to-purple-50 ring-1 ring-violet-100">
                    <Bot className="h-10 w-10 text-violet-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900">Pharmacy Agent</h3>
                  <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                    I can help you manage inventory, check stock levels, forecast demand, place
                    orders, and more. Try one of the quick actions below.
                  </p>

                  {/* Quick Actions */}
                  <div className="mt-6 grid grid-cols-2 gap-3">
                    {quickActions.map((action) => (
                      <Button
                        key={action.label}
                        variant="outline"
                        className="h-auto flex-col gap-2 rounded-xl border-gray-200 px-4 py-3 hover:border-violet-200 hover:bg-violet-50"
                        onClick={() => {
                          setInput(action.query);
                          setTimeout(() => handleSendMessage(), 100);
                        }}
                      >
                        <action.icon className="h-5 w-5 text-violet-600" />
                        <span className="text-xs font-medium text-gray-700">{action.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="space-y-1 p-4">
                  {messages.map((message) => (
                    <MessageBubble key={message.id} message={message} formatTime={formatTime} />
                  ))}

                  {/* Loading State */}
                  {isLoading && (
                    <div className="flex gap-3 py-4">
                      <Avatar className="h-9 w-9 shrink-0 rounded-xl border border-violet-100 bg-violet-50">
                        <AvatarFallback className="rounded-xl bg-transparent">
                          <Bot className="h-4 w-4 text-violet-600" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3 pt-1">
                        <Skeleton className="h-4 w-3/4 rounded-lg" />
                        <Skeleton className="h-4 w-1/2 rounded-lg" />
                        <Skeleton className="h-4 w-2/3 rounded-lg" />
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="border-t border-gray-100 bg-gray-50/50 p-4">
              <div className="mb-3 flex items-center justify-between">
                {messages.length > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClearChat}
                    className="gap-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Clear Chat
                  </Button>
                )}
              </div>
              <div className="flex gap-3">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Ask about inventory, place orders, check stock..."
                  className="flex-1 rounded-xl border-gray-200 bg-white px-4 py-2.5 shadow-sm transition-shadow focus:shadow-md focus:ring-2 focus:ring-violet-500/20"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className="h-10 w-10 shrink-0 rounded-xl bg-violet-600 shadow-sm hover:bg-violet-700 disabled:opacity-40"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Reorder Tab */}
        <TabsContent value="reorder" className="flex flex-1 flex-col mt-0">
          <Card className="flex flex-1 flex-col overflow-hidden rounded-2xl border-gray-200/80 bg-white shadow-sm">
            <CardHeader className="border-b bg-gray-50/50 py-4">
              <CardTitle className="flex items-center gap-2 text-lg">
                <RefreshCw className="h-5 w-5 text-violet-600" />
                Smart Reorder System
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 p-0 overflow-hidden">
              <ReorderPanel />
            </CardContent>
          </Card>
        </TabsContent>

        {/* Upload Tab */}
        <TabsContent value="upload" className="flex flex-1 flex-col mt-0">
          <Card className="flex-1 rounded-2xl border-gray-200/80 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <FileSpreadsheet className="h-5 w-5 text-violet-600" />
                Upload Inventory Excel
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Upload Area */}
              <div
                className={cn(
                  'flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 transition-colors',
                  isUploading
                    ? 'border-violet-300 bg-violet-50'
                    : 'border-gray-200 hover:border-violet-300 hover:bg-violet-50/50'
                )}
              >
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-100">
                  <Upload className="h-8 w-8 text-violet-600" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-gray-900">
                  {isUploading ? 'Uploading...' : 'Upload Excel File'}
                </h3>
                <p className="mb-4 text-center text-sm text-gray-500">
                  Upload an Excel file with your inventory data.
                  <br />
                  Required columns: Brand Name, Batch Number, Quantity, Expiry Date
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="gap-2 rounded-xl bg-violet-600 hover:bg-violet-700"
                >
                  {isUploading ? (
                    <>
                      <Skeleton className="h-4 w-4 animate-spin rounded-full" />
                      Processing...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Select File
                    </>
                  )}
                </Button>
              </div>

              {/* Upload Result */}
              {uploadResult && (
                <div
                  className={cn(
                    'rounded-xl p-4',
                    uploadResult.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  )}
                >
                  <div className="flex items-start gap-3">
                    {uploadResult.success ? (
                      <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <h4
                        className={cn(
                          'font-semibold',
                          uploadResult.success ? 'text-green-800' : 'text-red-800'
                        )}
                      >
                        {uploadResult.success ? 'Upload Successful' : 'Upload Failed'}
                      </h4>
                      <p
                        className={cn(
                          'text-sm mt-1',
                          uploadResult.success ? 'text-green-700' : 'text-red-700'
                        )}
                      >
                        {uploadResult.message}
                      </p>
                      {uploadResult.addedCount !== undefined && (
                        <p className="text-sm text-green-700 mt-1">
                          Added {uploadResult.addedCount} items to inventory
                        </p>
                      )}
                      {uploadResult.errors && uploadResult.errors.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium text-amber-700">Warnings:</p>
                          <ul className="mt-1 space-y-1">
                            {uploadResult.errors.slice(0, 5).map((err, idx) => (
                              <li key={idx} className="text-xs text-amber-600">
                                {err}
                              </li>
                            ))}
                            {uploadResult.errors.length > 5 && (
                              <li className="text-xs text-amber-600">
                                ...and {uploadResult.errors.length - 5} more
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setUploadResult(null)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Template Info */}
              <div className="rounded-xl bg-gray-50 p-4">
                <h4 className="font-semibold text-gray-900 mb-2">Excel Template Format</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3 font-medium text-gray-700">
                          Brand Name
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">
                          Batch Number
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Quantity</th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">
                          Expiry Date
                        </th>
                        <th className="text-left py-2 px-3 font-medium text-gray-700">Location</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="text-gray-500">
                        <td className="py-2 px-3">Paracetamol</td>
                        <td className="py-2 px-3">B2024001</td>
                        <td className="py-2 px-3">100</td>
                        <td className="py-2 px-3">2025-12-31</td>
                        <td className="py-2 px-3">Shelf A1</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Message Bubble Component
interface MessageBubbleProps {
  message: ChatMessage;
  formatTime: (date: Date) => string;
}

function MessageBubble({ message, formatTime }: MessageBubbleProps) {
  const isUser = message.role === 'user';

  return (
    <div className={cn('flex gap-3 py-3', isUser ? 'flex-row-reverse' : '')}>
      <Avatar
        className={cn(
          'h-9 w-9 shrink-0 rounded-xl border',
          isUser ? 'border-gray-200 bg-gray-100' : 'border-violet-100 bg-violet-50'
        )}
      >
        <AvatarFallback className="rounded-xl bg-transparent">
          {isUser ? (
            <User className="h-4 w-4 text-gray-600" />
          ) : (
            <Bot className="h-4 w-4 text-violet-600" />
          )}
        </AvatarFallback>
      </Avatar>

      <div className={cn('flex max-w-[80%] flex-col gap-2', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3',
            isUser
              ? 'rounded-tr-lg bg-violet-600 text-white'
              : 'rounded-tl-lg bg-gray-100 text-gray-900'
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* Tools Used Badge */}
        {!isUser && message.toolsUsed && message.toolsUsed.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {message.toolsUsed.map((tool, idx) => (
              <Badge
                key={idx}
                variant="secondary"
                className="rounded-md bg-violet-100 text-violet-700 text-xs"
              >
                {tool}
              </Badge>
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="px-1 text-[10px] font-medium text-gray-400">
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}
