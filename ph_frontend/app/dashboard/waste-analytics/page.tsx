'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Trash2, AlertTriangle, Package, Calendar, Sparkles } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import ReactMarkdown from 'react-markdown';

interface WasteRecord {
  id: string;
  drugName: string;
  batchNumber: string;
  quantity: number;
  reason: string;
  expiryDate: string;
  wastedDate: string;
  costValue: number;
  category: string;
}

interface WasteStats {
  totalWasteValue: number;
  totalWasteQuantity: number;
  expiredCount: number;
  damagedCount: number;
  wasteTrendData: Array<{ month: string; value: number; quantity: number }>;
  categoryWaste: Array<{ name: string; value: number }>;
  topWastedDrugs: Array<{ drugName: string; quantity: number; value: number }>;
}

export default function WasteAnalyticsPage() {
  const [wasteRecords, setWasteRecords] = useState<WasteRecord[]>([]);
  const [stats, setStats] = useState<WasteStats | null>(null);
  const [aiSummary, setAiSummary] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAI, setIsLoadingAI] = useState(false);
  const [showAIInsights, setShowAIInsights] = useState(false);

  useEffect(() => {
    fetchWasteData();
  }, []);

  const fetchWasteData = async () => {
    try {
      setIsLoading(true);

      // Mock data for now - replace with actual API call
      // const response = await apiClient.get('/waste-analytics');

      // Simulated data
      const mockStats: WasteStats = {
        totalWasteValue: 45230,
        totalWasteQuantity: 1245,
        expiredCount: 34,
        damagedCount: 12,
        wasteTrendData: [
          { month: 'Jul', value: 5400, quantity: 140 },
          { month: 'Aug', value: 6200, quantity: 165 },
          { month: 'Sep', value: 7100, quantity: 190 },
          { month: 'Oct', value: 8300, quantity: 210 },
          { month: 'Nov', value: 9100, quantity: 245 },
          { month: 'Dec', value: 9130, quantity: 295 },
        ],
        categoryWaste: [
          { name: 'Antibiotics', value: 15400 },
          { name: 'Pain Relief', value: 12300 },
          { name: 'Vitamins', value: 8900 },
          { name: 'Cardiac', value: 5200 },
          { name: 'Other', value: 3430 },
        ],
        topWastedDrugs: [
          { drugName: 'Augmentin 625', quantity: 145, value: 8700 },
          { drugName: 'Crocin Advance', quantity: 230, value: 4600 },
          { drugName: 'Limcee 500', quantity: 180, value: 3600 },
          { drugName: 'Azithral 500', quantity: 95, value: 5700 },
          { drugName: 'Disprin', quantity: 210, value: 2520 },
        ],
      };

      const mockRecords: WasteRecord[] = [
        {
          id: '1',
          drugName: 'Augmentin 625',
          batchNumber: 'AUG2024001',
          quantity: 45,
          reason: 'Expired',
          expiryDate: '2024-11-15',
          wastedDate: '2024-12-01',
          costValue: 2700,
          category: 'Antibiotics',
        },
        {
          id: '2',
          drugName: 'Crocin Advance',
          batchNumber: 'CRO2024015',
          quantity: 80,
          reason: 'Damaged',
          expiryDate: '2025-03-20',
          wastedDate: '2024-12-10',
          costValue: 1600,
          category: 'Pain Relief',
        },
        {
          id: '3',
          drugName: 'Limcee 500',
          batchNumber: 'LIM2024032',
          quantity: 60,
          reason: 'Expired',
          expiryDate: '2024-10-30',
          wastedDate: '2024-11-25',
          costValue: 1200,
          category: 'Vitamins',
        },
      ];

      setStats(mockStats);
      setWasteRecords(mockRecords);
    } catch (error) {
      console.error('Failed to fetch waste data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAISummary = async (stats: WasteStats, records: WasteRecord[]) => {
    try {
      setIsLoadingAI(true);
      console.log('Fetching AI summary from backend...');

      const response = await apiClient.post<{ summary: string }>('/waste-analytics/ai-summary', {
        stats,
        recentRecords: records,
      });

      const aiGeneratedSummary = response.data?.summary || '';

      // If AI doesn't provide summary, generate a fallback summary
      if (!aiGeneratedSummary || aiGeneratedSummary.trim() === '') {
        console.warn('AI returned empty summary, using frontend fallback');
        const topWastedDrug = stats.topWastedDrugs[0];
        const topCategory = stats.categoryWaste[0];
        const lastMonth = stats.wasteTrendData[stats.wasteTrendData.length - 1];
        const prevMonth = stats.wasteTrendData[stats.wasteTrendData.length - 2];
        const trendDirection = lastMonth.value > prevMonth.value ? 'increased' : 'decreased';
        const trendPercent = Math.abs(
          ((lastMonth.value - prevMonth.value) / prevMonth.value) * 100
        ).toFixed(1);

        setAiSummary(`## 📊 Key Findings

- Your pharmacy wasted **₹${stats.totalWasteValue.toLocaleString()}** worth of medicines this period
- Waste has **${trendDirection}** by **${trendPercent}%** compared to last month
- **${topWastedDrug.drugName}** is your most wasted medicine (${topWastedDrug.quantity} units, ₹${topWastedDrug.value})

## ⚠️ Areas of Concern

- **${topCategory.name}** category shows highest waste (₹${topCategory.value})
- ${stats.expiredCount} batches expired before use
- ${stats.damagedCount} batches were damaged

## 💡 Recommendations

### Immediate Actions:

1. Review inventory ordering patterns for **${topWastedDrug.drugName}**
2. Implement FEFO (First Expiry, First Out) system for **${topCategory.name}** category
3. Conduct staff training on proper storage and handling

### Prevention Strategy:

1. Order smaller quantities of **${topWastedDrug.drugName}** more frequently
2. Set up expiry alerts 60 days in advance
3. Audit storage conditions weekly to prevent damage
4. Consider returning near-expiry items to suppliers

## 🎯 Expected Impact

Implementing these recommendations could reduce waste by **20-30%**, saving approximately **₹${Math.round(stats.totalWasteValue * 0.25).toLocaleString()}** monthly.`);
      } else {
        console.log('Successfully received AI-generated summary');
        setAiSummary(aiGeneratedSummary);
      }
    } catch (error) {
      console.error('Failed to fetch AI summary from backend:', error);

      // Generate fallback summary on error
      const topWastedDrug = stats.topWastedDrugs[0];
      const topCategory = stats.categoryWaste[0];

      setAiSummary(`## 📊 Key Findings

- Your pharmacy wasted **₹${stats.totalWasteValue.toLocaleString()}** worth of medicines
- **${topWastedDrug.drugName}** is your most wasted medicine (${topWastedDrug.quantity} units)
- **${topCategory.name}** category shows highest waste

## 💡 Quick Recommendations

1. Review inventory ordering patterns for top wasted medicines
2. Implement FEFO (First Expiry, First Out) system
3. Set up expiry alerts 60 days in advance
4. Conduct regular staff training on proper storage

---

*AI insights temporarily unavailable. These are basic recommendations based on your data.*`);
    } finally {
      setIsLoadingAI(false);
    }
  };

  const getReasonBadge = (reason: string) => {
    const badges = {
      Expired: <Badge className="bg-red-100 text-red-800">Expired</Badge>,
      Damaged: <Badge className="bg-yellow-100 text-yellow-800">Damaged</Badge>,
      Other: <Badge className="bg-gray-100 text-gray-800">Other</Badge>,
    };
    return badges[reason as keyof typeof badges] || badges.Other;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Waste Analytics</h1>
          <p className="text-gray-500 mt-1">Track and analyze medicine waste patterns</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Waste Value</p>
                <div className="text-2xl font-bold text-gray-900">
                  {isLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    formatCurrency(stats?.totalWasteValue || 0)
                  )}
                </div>
              </div>
              <div className="rounded-lg bg-red-100 p-3">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Quantity</p>
                <div className="text-2xl font-bold text-gray-900">
                  {isLoading ? <Skeleton className="h-8 w-20" /> : stats?.totalWasteQuantity || 0}
                </div>
              </div>
              <div className="rounded-lg bg-orange-100 p-3">
                <Package className="h-5 w-5 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Expired</p>
                <div className="text-2xl font-bold text-gray-900">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stats?.expiredCount || 0}
                </div>
              </div>
              <div className="rounded-lg bg-red-100 p-3">
                <Calendar className="h-5 w-5 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Damaged</p>
                <div className="text-2xl font-bold text-gray-900">
                  {isLoading ? <Skeleton className="h-8 w-16" /> : stats?.damagedCount || 0}
                </div>
              </div>
              <div className="rounded-lg bg-yellow-100 p-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Summary */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                AI-Powered Insights & Recommendations
              </CardTitle>
              <CardDescription>
                Smart analysis of your waste patterns and actionable suggestions
              </CardDescription>
            </div>
            <Button
              onClick={() => {
                if (!showAIInsights && stats && wasteRecords.length > 0) {
                  fetchAISummary(stats, wasteRecords);
                }
                setShowAIInsights(!showAIInsights);
              }}
              variant={showAIInsights ? "outline" : "default"}
            >
              {showAIInsights ? "Hide Insights" : "Get AI Insights"}
            </Button>
          </div>
        </CardHeader>
        {showAIInsights && (
          <CardContent>
            {isLoadingAI ? (
              <div className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-4/6" />
              </div>
            ) : (
              <div className="space-y-6">
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => (
                      <h2 className="text-xl font-bold text-gray-900 mt-6 mb-4 first:mt-0 flex items-center gap-2">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-lg font-semibold text-gray-800 mt-4 mb-3">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-gray-700 leading-relaxed mb-3">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="space-y-2 mb-4 ml-4">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="space-y-2 mb-4 ml-4 list-decimal">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-gray-700 leading-relaxed">
                        {children}
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-gray-900">
                        {children}
                      </strong>
                    ),
                    hr: () => (
                      <hr className="my-6 border-gray-200" />
                    ),
                  }}
                >
                  {aiSummary}
                </ReactMarkdown>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Waste Trend */}
        <Card>
          <CardHeader>
            <CardTitle>Waste Trend (Last 6 Months)</CardTitle>
            <CardDescription>Monthly waste value and quantity</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={stats?.wasteTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="value"
                    stroke="#ef4444"
                    name="Value (₹)"
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="quantity"
                    stroke="#f97316"
                    name="Quantity"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Category Waste */}
        <Card>
          <CardHeader>
            <CardTitle>Waste by Category</CardTitle>
            <CardDescription>Waste value distribution by drug category</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={stats?.categoryWaste}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                  <Bar dataKey="value" fill="#ef4444" name="Waste Value" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Wasted Drugs */}
      <Card>
        <CardHeader>
          <CardTitle>Top Wasted Drugs</CardTitle>
          <CardDescription>Drugs with highest waste value</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-48 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Drug Name</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead className="text-right">Waste Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {stats?.topWastedDrugs.map((drug, index) => (
                  <TableRow key={index}>
                    <TableCell className="font-medium">{drug.drugName}</TableCell>
                    <TableCell className="text-right">{drug.quantity}</TableCell>
                    <TableCell className="text-right">{formatCurrency(drug.value)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recent Waste Records */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Waste Records</CardTitle>
          <CardDescription>Latest expired or damaged medicines</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Drug Name</TableHead>
                  <TableHead>Batch</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Quantity</TableHead>
                  <TableHead>Reason</TableHead>
                  <TableHead>Expiry Date</TableHead>
                  <TableHead>Wasted Date</TableHead>
                  <TableHead className="text-right">Cost Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {wasteRecords.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell className="font-medium">{record.drugName}</TableCell>
                    <TableCell className="text-sm text-gray-500">{record.batchNumber}</TableCell>
                    <TableCell>{record.category}</TableCell>
                    <TableCell className="text-right">{record.quantity}</TableCell>
                    <TableCell>{getReasonBadge(record.reason)}</TableCell>
                    <TableCell className="text-sm">{formatDate(record.expiryDate)}</TableCell>
                    <TableCell className="text-sm">{formatDate(record.wastedDate)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatCurrency(record.costValue)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
