'use client';

import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Treemap,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import type { PaymentMethodData } from '@/lib/types';
import type { ChartData } from '@/lib/types';

interface SalesChartProps {
  data: ChartData[];
  isLoading?: boolean;
}

export function SalesLineChart({ data, isLoading }: SalesChartProps): React.ReactElement {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Sales Trend</CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sales Trend</CardTitle>
        <CardDescription>Daily sales and revenue</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis yAxisId="left" />
            <YAxis yAxisId="right" orientation="right" />
            <Tooltip
              formatter={(value, name) => {
                if (typeof value === 'number') {
                  // Don't format sales count as currency
                  if (name === 'Sales Count') {
                    return value;
                  }
                  return formatCurrency(value);
                }
                return value;
              }}
            />
            <Legend />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="sales"
              stroke="#10b981"
              name="Sales Count"
              dot={{ fill: '#10b981' }}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="revenue"
              stroke="#3b82f6"
              name="Revenue"
              dot={{ fill: '#3b82f6' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface DrugMovementData {
  name: string;
  value: number;
  category: string;
  revenue: number;
  stock: number;
  soldUnits?: number;
  type: 'fast-moving' | 'slow-moving';
}

interface DrugMovementTreeMapProps {
  data: {
    fastMoving: DrugMovementData[];
    slowMoving: DrugMovementData[];
  };
  isLoading?: boolean;
}

const CustomTreeMapContent = (props: any) => {
  const { x, y, width, height, name, stock, soldUnits, type } = props;

  // Don't render if too small
  if (width < 40 || height < 30) return null;

  const isFastMoving = type === 'fast-moving';
  const bgColor = isFastMoving ? '#10b981' : '#ef4444';
  const textColor = '#ffffff';

  const displayValue = isFastMoving ? soldUnits : stock;

  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: bgColor,
          stroke: '#fff',
          strokeWidth: 2,
          opacity: 0.9,
        }}
      />
      {width > 60 && height > 40 && (
        <>
          <text
            x={x + width / 2}
            y={y + height / 2 - 8}
            textAnchor="middle"
            fill={textColor}
            fontSize={12}
            fontWeight="600"
          >
            {name.length > 15 ? name.substring(0, 12) + '...' : name}
          </text>
          <text
            x={x + width / 2}
            y={y + height / 2 + 8}
            textAnchor="middle"
            fill={textColor}
            fontSize={10}
          >
            {isFastMoving ? `Sold: ${displayValue}` : `Stock: ${displayValue}`}
          </text>
        </>
      )}
    </g>
  );
};

export function DrugMovementTreeMap({
  data,
  isLoading,
}: DrugMovementTreeMapProps): React.ReactElement {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Drug Movement Analysis</CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  // Combine fast and slow moving drugs for treemap
  const treeMapData = [
    ...data.fastMoving.map((d) => ({ ...d, type: 'fast-moving' as const })),
    ...data.slowMoving.map((d) => ({ ...d, type: 'slow-moving' as const })),
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Drug Movement Analysis</CardTitle>
        <CardDescription>Fast-moving (green) vs Slow-moving drugs (red)</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <Treemap
            data={treeMapData}
            dataKey="value"
            stroke="#fff"
            fill="#10b981"
            content={<CustomTreeMapContent />}
          />
        </ResponsiveContainer>
        <div className="mt-4 flex items-center justify-center gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-emerald-500" />
            <span className="text-gray-600">Fast-Moving (High Sales)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded bg-red-500" />
            <span className="text-gray-600">Slow-Moving (Low Sales)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface PaymentPieChartProps {
  data: (PaymentMethodData | Record<string, unknown>)[];
  isLoading?: boolean;
}

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444'];

export function PaymentMethodPieChart({
  data,
  isLoading,
}: PaymentPieChartProps): React.ReactElement {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Methods</CardTitle>
        <CardDescription>Distribution of payment methods</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, value }) => `${name}: ${value}`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}

interface InventoryBarChartProps {
  data: Array<{ name: string; stock: number; reorderLevel: number }>;
  isLoading?: boolean;
}

export function InventoryChart({ data, isLoading }: InventoryBarChartProps): React.ReactElement {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Inventory Levels</CardTitle>
          <CardDescription>Loading chart data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-gray-100 rounded animate-pulse" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Inventory Levels</CardTitle>
        <CardDescription>Current stock vs reorder level</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="stock" fill="#10b981" name="Current Stock" />
            <Bar dataKey="reorderLevel" fill="#ef4444" name="Reorder Level" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
