'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Database,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  RotateCcw,
  TableIcon,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiClient } from '@/lib/api-client';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sql?: string | null;
  data?: Record<string, unknown>[] | null;
  columns?: string[] | null;
  timestamp: Date;
  queryType?: string;
}

export default function ChatbotPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedSql, setCopiedSql] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

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

      const response = await apiClient.post<{
        response: string;
        sql?: string;
        data?: Record<string, unknown>[];
        columns?: string[];
        query_type?: string;
      }>('/chatbot/chat', {
        message: text,
        history,
      });

      const data = response.data;

      const assistantMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: data?.response || 'I encountered an issue processing your request.',
        sql: data?.sql || null,
        data: data?.data || null,
        columns: data?.columns || null,
        queryType: data?.query_type || 'general',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = {
        id: generateId(),
        role: 'assistant',
        content: 'I\'m having trouble connecting to the service. Please check if the AI service is running.',
        timestamp: new Date(),
        queryType: 'general',
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

  const handleCopySql = async (sql: string) => {
    await navigator.clipboard.writeText(sql);
    setCopiedSql(sql);
    setTimeout(() => setCopiedSql(null), 2000);
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col">
      {/* Header */}
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 shadow-lg shadow-emerald-500/25">
            <Sparkles className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-semibold text-gray-900">AI Assistant</h1>
            <p className="text-sm text-gray-500">Powered by GPT-4o</p>
          </div>
        </div>
        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearChat}
            className="gap-2 rounded-lg border-gray-200 text-gray-600 hover:bg-gray-50"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            New Chat
          </Button>
        )}
      </div>

      {/* Chat Container */}
      <Card className="flex flex-1 flex-col overflow-hidden rounded-2xl border-gray-200/80 bg-white shadow-sm">
        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center px-4 text-center">
              <div className="mb-6 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-emerald-50 to-teal-50 ring-1 ring-emerald-100">
                <Bot className="h-10 w-10 text-emerald-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900">How can I help you today?</h3>
              <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                Ask me about your pharmacy data - inventory levels, sales reports,
                expiring medicines, supplier information, and more.
              </p>
            </div>
          ) : (
            <div className="space-y-1 p-4">
              {messages.map((message) => (
                <MessageBubble
                  key={message.id}
                  message={message}
                  onCopySql={handleCopySql}
                  copiedSql={copiedSql}
                  formatTime={formatTime}
                />
              ))}

              {/* Loading State */}
              {isLoading && (
                <div className="flex gap-3 py-4">
                  <Avatar className="h-9 w-9 shrink-0 rounded-xl border border-emerald-100 bg-emerald-50">
                    <AvatarFallback className="rounded-xl bg-transparent">
                      <Bot className="h-4 w-4 text-emerald-600" />
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
          <div className="flex gap-3">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about inventory, sales, expiring medicines..."
              className="flex-1 rounded-xl border-gray-200 bg-white px-4 py-2.5 shadow-sm transition-shadow focus:shadow-md focus:ring-2 focus:ring-emerald-500/20"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!input.trim() || isLoading}
              size="icon"
              className="h-10 w-10 shrink-0 rounded-xl bg-emerald-600 shadow-sm hover:bg-emerald-700 disabled:opacity-40"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

// Message Bubble Component
interface MessageBubbleProps {
  message: ChatMessage;
  onCopySql: (sql: string) => void;
  copiedSql: string | null;
  formatTime: (date: Date) => string;
}

function MessageBubble({ message, onCopySql, copiedSql, formatTime }: MessageBubbleProps) {
  const [isSqlOpen, setIsSqlOpen] = useState(false);
  const [isDataOpen, setIsDataOpen] = useState(false);

  const isUser = message.role === 'user';
  const hasData = message.sql && message.queryType === 'database';

  return (
    <div className={cn('flex gap-3 py-3', isUser ? 'flex-row-reverse' : '')}>
      <Avatar className={cn(
        'h-9 w-9 shrink-0 rounded-xl border',
        isUser
          ? 'border-gray-200 bg-gray-100'
          : 'border-emerald-100 bg-emerald-50'
      )}>
        <AvatarFallback className="rounded-xl bg-transparent">
          {isUser ? (
            <User className="h-4 w-4 text-gray-600" />
          ) : (
            <Bot className="h-4 w-4 text-emerald-600" />
          )}
        </AvatarFallback>
      </Avatar>

      <div className={cn('flex max-w-[80%] flex-col gap-2', isUser && 'items-end')}>
        <div
          className={cn(
            'rounded-2xl px-4 py-3',
            isUser
              ? 'rounded-tr-lg bg-emerald-600 text-white'
              : 'rounded-tl-lg bg-gray-100 text-gray-900'
          )}
        >
          {isUser ? (
            <p className="text-sm leading-relaxed">{message.content}</p>
          ) : (
            <div className="markdown-content">
              <ReactMarkdown>{message.content}</ReactMarkdown>
            </div>
          )}
        </div>

        {/* SQL Query - Only show for database queries */}
        {hasData && message.sql && (
          <Collapsible open={isSqlOpen} onOpenChange={setIsSqlOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 rounded-lg px-2.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <Database className="h-3.5 w-3.5" />
                SQL Query
                {isSqlOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="relative mt-1.5 overflow-hidden rounded-xl bg-[#1e1e2e] shadow-lg">
                <div className="flex items-center justify-between border-b border-white/10 px-4 py-2">
                  <span className="text-xs font-medium text-gray-400">PostgreSQL</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0 text-gray-400 hover:bg-white/10 hover:text-white"
                    onClick={() => onCopySql(message.sql!)}
                  >
                    {copiedSql === message.sql ? (
                      <Check className="h-3.5 w-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </Button>
                </div>
                <pre className="overflow-x-auto p-4 text-xs leading-relaxed">
                  <code className="text-emerald-400">{message.sql}</code>
                </pre>
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Data Table - Only show for database queries with data */}
        {hasData && message.data && message.data.length > 0 && message.columns && (
          <Collapsible open={isDataOpen} onOpenChange={setIsDataOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 rounded-lg px-2.5 text-xs font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              >
                <TableIcon className="h-3.5 w-3.5" />
                View Results ({message.data.length} rows)
                {isDataOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="mt-1.5 max-h-64 overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/80 hover:bg-gray-50/80">
                      {message.columns.map((col) => (
                        <TableHead key={col} className="whitespace-nowrap text-xs font-semibold text-gray-700">
                          {col}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {message.data.slice(0, 20).map((row, idx) => (
                      <TableRow key={idx} className="hover:bg-gray-50/50">
                        {message.columns!.map((col) => (
                          <TableCell key={col} className="whitespace-nowrap text-xs text-gray-600">
                            {String(row[col] ?? '—')}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              {message.data.length > 20 && (
                <p className="mt-1.5 text-xs text-gray-400">
                  Showing 20 of {message.data.length} rows
                </p>
              )}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Timestamp */}
        <span className="px-1 text-[10px] font-medium text-gray-400">{formatTime(message.timestamp)}</span>
      </div>
    </div>
  );
}
