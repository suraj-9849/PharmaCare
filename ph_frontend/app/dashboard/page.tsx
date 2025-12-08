'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Package,
  DollarSign,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  BarChart3,
  PieChart,
  Pill,
  Truck,
  Users,
} from 'lucide-react';
import { useDashboard } from '@/hooks/use-dashboard';
import { cn, formatCurrency, formatDate } from '@/lib/utils';
import type { Sale, InventoryBatch, TopSellingDrug } from '@/lib/types';
import {
  SalesLineChart,
  RevenueBarChart,
  PaymentMethodPieChart,
  InventoryChart,
} from '@/components/charts/dashboard-charts';

// Helper function to calculate days remaining (pure function)
const calculateDaysRemaining = (expiryDate: Date | string): number => {
  const now = Date.now();
  return Math.ceil((new Date(expiryDate).getTime() - now) / (1000 * 60 * 60 * 24));
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: number;
  description?: string;
  iconColor?: string;
  iconBg?: string;
}

function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  description,
  iconColor = 'text-emerald-600',
  iconBg = 'bg-emerald-100',
}: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-500">{title}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
            {trend !== undefined && (
              <div className="flex items-center gap-1">
                {trend >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <span
                  className={cn(
                    'text-sm font-medium',
                    trend >= 0 ? 'text-emerald-600' : 'text-red-600'
                  )}
                >
                  {Math.abs(trend)}%
                </span>
                <span className="text-xs text-gray-500">vs last month</span>
              </div>
            )}
            {description && <p className="text-xs text-gray-500">{description}</p>}
          </div>
          <div className={cn('rounded-lg p-3', iconBg)}>
            <Icon className={cn('h-5 w-5', iconColor)} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-8 w-32" />
            <Skeleton className="h-3 w-28" />
          </div>
          <Skeleton className="h-12 w-12 rounded-lg" />
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboard();

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500">Welcome to your pharmacy management system</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Drugs"
              value={data?.stats?.totalDrugs || 0}
              icon={Pill}
              description="Registered medications"
              iconColor="text-blue-600"
              iconBg="bg-blue-100"
            />
            <StatCard
              title="Total Sales"
              value={formatCurrency(data?.stats?.totalSalesAmount || 0)}
              icon={DollarSign}
              trend={12}
              iconColor="text-emerald-600"
              iconBg="bg-emerald-100"
            />
            <StatCard
              title="Low Stock Items"
              value={data?.stats?.lowStockCount || 0}
              icon={Package}
              description="Need reordering"
              iconColor="text-amber-600"
              iconBg="bg-amber-100"
            />
            <StatCard
              title="Expiring Soon"
              value={data?.stats?.expiringCount || 0}
              icon={AlertTriangle}
              description="Within 30 days"
              iconColor="text-red-600"
              iconBg="bg-red-100"
            />
          </>
        )}
      </div>

      {/* Second Row Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {isLoading ? (
          <>
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
            <StatCardSkeleton />
          </>
        ) : (
          <>
            <StatCard
              title="Total Suppliers"
              value={data?.stats?.totalSuppliers || 0}
              icon={Truck}
              description="Active suppliers"
              iconColor="text-purple-600"
              iconBg="bg-purple-100"
            />
            <StatCard
              title="Total Customers"
              value={data?.stats?.totalCustomers || 0}
              icon={Users}
              description="Registered customers"
              iconColor="text-indigo-600"
              iconBg="bg-indigo-100"
            />
            <StatCard
              title="Inventory Value"
              value={formatCurrency(data?.stats?.totalInventoryValue || 0)}
              icon={Package}
              description="Current stock value"
              iconColor="text-teal-600"
              iconBg="bg-teal-100"
            />
            <StatCard
              title="Today's Sales"
              value={data?.stats?.todaySalesCount || 0}
              icon={ShoppingCart}
              description="Transactions today"
              iconColor="text-cyan-600"
              iconBg="bg-cyan-100"
            />
          </>
        )}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sales Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Sales Trend
            </CardTitle>
            <CardDescription>Daily sales and orders this month</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : data?.chartData?.length ? (
              <SalesLineChart data={data.chartData} />
            ) : (
              <div className="flex h-[300px] items-center justify-center text-gray-500">
                No sales data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Revenue Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-emerald-500" />
              Revenue by Category
            </CardTitle>
            <CardDescription>Revenue breakdown by drug category</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : data?.revenueByCategory?.length ? (
              <RevenueBarChart data={data.revenueByCategory} />
            ) : (
              <div className="flex h-[300px] items-center justify-center text-gray-500">
                No revenue data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Payment Method Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-purple-500" />
              Payment Methods
            </CardTitle>
            <CardDescription>Sales distribution by payment method</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : data?.paymentMethods?.length ? (
              <PaymentMethodPieChart data={data.paymentMethods} />
            ) : (
              <div className="flex h-[300px] items-center justify-center text-gray-500">
                No payment data available
              </div>
            )}
          </CardContent>
        </Card>

        {/* Inventory Stock Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              Stock Levels
            </CardTitle>
            <CardDescription>Current vs reorder levels by category</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <Skeleton className="h-[300px] w-full" />
            ) : data?.inventoryByCategory?.length ? (
              <InventoryChart data={data.inventoryByCategory} />
            ) : (
              <div className="flex h-[300px] items-center justify-center text-gray-500">
                No inventory data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Sales */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-gray-500" />
              Recent Sales
            </CardTitle>
            <CardDescription>Latest transactions</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : data?.recentSales && data.recentSales.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Sale ID</TableHead>
                      <TableHead>Payment</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {data.recentSales.map((sale: Sale) => (
                      <TableRow key={sale.id}>
                        <TableCell className="font-medium font-mono text-sm">
                          {sale.id.slice(0, 8)}...
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-gray-50">
                            {sale.paymentMethod}
                          </Badge>
                        </TableCell>
                        <TableCell>{formatDate(sale.saleDate)}</TableCell>
                        <TableCell className="text-right font-medium">
                          {formatCurrency(Number(sale.totalAmount))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </ScrollArea>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-gray-500">
                No recent sales
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expiring Soon */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              Expiring Soon
            </CardTitle>
            <CardDescription>Products expiring within 30 days</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : data?.expiringBatches && data.expiringBatches.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {data.expiringBatches.map((batch: InventoryBatch) => {
                    const daysLeft = calculateDaysRemaining(batch.expiryDate);

                    return (
                      <div
                        key={batch.id}
                        className="flex items-center justify-between rounded-lg border p-3"
                      >
                        <div>
                          <p className="font-medium text-gray-900">{batch.drug?.brandName}</p>
                          <p className="text-sm text-gray-500">
                            Batch: {batch.batchNumber} • Qty: {batch.quantity}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className={cn(
                            daysLeft <= 7
                              ? 'border-red-200 bg-red-50 text-red-700'
                              : daysLeft <= 14
                                ? 'border-amber-200 bg-amber-50 text-amber-700'
                                : 'border-yellow-200 bg-yellow-50 text-yellow-700'
                          )}
                        >
                          {daysLeft <= 0 ? 'Expired' : `${daysLeft} days`}
                        </Badge>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-gray-500">
                No items expiring soon
              </div>
            )}
          </CardContent>
        </Card>

        {/* Low Stock */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              Low Stock Alert
            </CardTitle>
            <CardDescription>Items below reorder level</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-2 w-full" />
                  </div>
                ))}
              </div>
            ) : data?.lowStockBatches && data.lowStockBatches.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="space-y-4">
                  {data.lowStockBatches.map((batch: InventoryBatch) => {
                    const percentage = Math.min(
                      (batch.quantity / (batch.drug?.reorderLevel || 100)) * 100,
                      100
                    );

                    return (
                      <div key={batch.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-gray-900">{batch.drug?.brandName}</p>
                            <p className="text-xs text-gray-500">Batch: {batch.batchNumber}</p>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {batch.quantity} / {batch.drug?.reorderLevel || 100}
                          </span>
                        </div>
                        <Progress
                          value={percentage}
                          className={cn(
                            'h-2',
                            percentage <= 25
                              ? '[&>div]:bg-red-500'
                              : percentage <= 50
                                ? '[&>div]:bg-amber-500'
                                : '[&>div]:bg-emerald-500'
                          )}
                        />
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-gray-500">
                All items are well stocked
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Selling Drugs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
              Top Selling Drugs
            </CardTitle>
            <CardDescription>Best performers this month</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-20" />
                  </div>
                ))}
              </div>
            ) : data?.topSellingDrugs && data.topSellingDrugs.length > 0 ? (
              <ScrollArea className="h-[300px]">
                <div className="space-y-3">
                  {data.topSellingDrugs.map((drug: TopSellingDrug, index: number) => (
                    <div
                      key={drug.drugId || `drug-${index}`}
                      className="flex items-center justify-between rounded-lg border p-3"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold',
                            index === 0
                              ? 'bg-amber-100 text-amber-700'
                              : index === 1
                                ? 'bg-gray-100 text-gray-700'
                                : index === 2
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-gray-50 text-gray-500'
                          )}
                        >
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{drug.brandName}</p>
                          <p className="text-xs text-gray-500">{drug.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{drug.totalQuantity || drug.totalSold || 0} units</p>
                        <p className="text-xs text-gray-500">
                          {formatCurrency(drug.totalRevenue || 0)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            ) : (
              <div className="flex h-[200px] items-center justify-center text-gray-500">
                No sales data yet
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
