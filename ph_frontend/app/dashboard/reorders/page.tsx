'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Eye, Package, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatDateTime } from '@/lib/utils';
import type { ReorderRequest, PaginatedResponse } from '@/lib/types';

interface ReorderWithDrug extends ReorderRequest {
  drug: {
    id: string;
    brandName: string;
    genericName?: string;
    category?: string;
    sku?: string;
    unit?: string;
  };
  requestedByUser?: {
    id: string;
    username: string;
  };
  approvedByUser?: {
    id: string;
    username: string;
  };
}

export default function ReorderPage() {
  const [reorders, setReorders] = useState<ReorderWithDrug[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [selectedReorder, setSelectedReorder] = useState<ReorderWithDrug | null>(null);

  const fetchReorders = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<PaginatedResponse<ReorderWithDrug>>('/reorders', {
        limit: 100,
        status: statusFilter || undefined,
      });
      setReorders(response.data || []);
    } catch (err) {
      console.error('Failed to fetch reorders:', err);
    } finally {
      setIsLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchReorders();
  }, [fetchReorders]);

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800',
      APPROVED: 'bg-blue-100 text-blue-800',
      ORDERED: 'bg-purple-100 text-purple-800',
      RECEIVED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      HIGH: 'bg-red-100 text-red-800',
      MEDIUM: 'bg-yellow-100 text-yellow-800',
      LOW: 'bg-green-100 text-green-800',
    };
    return colors[priority] || 'bg-gray-100 text-gray-800';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-4 w-4" />;
      case 'APPROVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'ORDERED':
        return <Package className="h-4 w-4" />;
      case 'RECEIVED':
        return <CheckCircle className="h-4 w-4" />;
      case 'REJECTED':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const handleViewReorder = async (reorder: ReorderWithDrug) => {
    setSelectedReorder(reorder);
    setIsViewSheetOpen(true);
  };

  const handleApprove = async () => {
    if (!selectedReorder) return;
    try {
      await apiClient.post(`/reorders/${selectedReorder.id}/approve`, {});
      setIsViewSheetOpen(false);
      fetchReorders();
    } catch (error) {
      console.error('Failed to approve reorder:', error);
    }
  };

  const handleReject = async () => {
    if (!selectedReorder) return;
    try {
      await apiClient.post(`/reorders/${selectedReorder.id}/reject`, {});
      setIsViewSheetOpen(false);
      fetchReorders();
    } catch (error) {
      console.error('Failed to reject reorder:', error);
    }
  };

  const handleMarkAsOrdered = async () => {
    if (!selectedReorder) return;
    try {
      await apiClient.post(`/reorders/${selectedReorder.id}/ordered`, {});
      setIsViewSheetOpen(false);
      fetchReorders();
    } catch (error) {
      console.error('Failed to mark as ordered:', error);
    }
  };

  const handleMarkAsReceived = async () => {
    if (!selectedReorder) return;
    try {
      await apiClient.post(`/reorders/${selectedReorder.id}/receive`, {});
      setIsViewSheetOpen(false);
      fetchReorders();
    } catch (error) {
      console.error('Failed to mark as received:', error);
    }
  };

  const filteredReorders = reorders.filter(
    (reorder) =>
      reorder.drug?.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reorder.drug?.genericName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      reorder.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    pending: reorders.filter((r) => r.status === 'PENDING').length,
    approved: reorders.filter((r) => r.status === 'APPROVED').length,
    ordered: reorders.filter((r) => r.status === 'ORDERED').length,
    received: reorders.filter((r) => r.status === 'RECEIVED').length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Reorder Management</h1>
        <p className="text-gray-500 mt-2">Track and manage medicine reorder requests</p>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Pending</p>
                <p className="text-3xl font-bold mt-2 text-yellow-600">{stats.pending}</p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Approved</p>
                <p className="text-3xl font-bold mt-2 text-blue-600">{stats.approved}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Ordered</p>
                <p className="text-3xl font-bold mt-2 text-purple-600">{stats.ordered}</p>
              </div>
              <Package className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 font-medium">Received</p>
                <p className="text-3xl font-bold mt-2 text-green-600">{stats.received}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <Input
            type="text"
            placeholder="Search by medicine name or reorder ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10"
          />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg h-10 bg-white"
        >
          <option value="">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="ORDERED">Ordered</option>
          <option value="RECEIVED">Received</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {/* Reorders Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredReorders.length === 0 ? (
            <div className="p-8 text-center">
              <Package className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-2">No reorders found</p>
              <p className="text-sm text-gray-400">
                {searchQuery ? 'Try adjusting your search' : 'All medicines are well stocked'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-gray-50">
                    <TableHead className="h-12">Medicine</TableHead>
                    <TableHead className="h-12">Category</TableHead>
                    <TableHead className="h-12 text-center">Requested Qty</TableHead>
                    <TableHead className="h-12 text-center">Current Stock</TableHead>
                    <TableHead className="h-12">Priority</TableHead>
                    <TableHead className="h-12">Status</TableHead>
                    <TableHead className="h-12">Requested Date</TableHead>
                    <TableHead className="h-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredReorders.map((reorder) => (
                    <TableRow key={reorder.id} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium">{reorder.drug?.brandName}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {reorder.drug?.category || 'N/A'}
                      </TableCell>
                      <TableCell className="text-center font-semibold text-emerald-600">
                        {reorder.requestedQty}
                      </TableCell>
                      <TableCell className="text-center text-sm text-gray-600">
                        {reorder.currentStock}
                      </TableCell>
                      <TableCell>
                        <Badge className={`${getPriorityColor(reorder.priority)} border-0`}>
                          {reorder.priority}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getStatusColor(reorder.status)} border-0 flex items-center gap-1 w-fit`}
                        >
                          {getStatusIcon(reorder.status)}
                          {reorder.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDateTime(reorder.createdAt)}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewReorder(reorder)}
                          className="gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* View Reorder Details Sheet */}
      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:w-[600px] p-0 flex flex-col max-h-screen overflow-hidden"
        >
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>Reorder Details</SheetTitle>
            <SheetDescription>{selectedReorder?.id}</SheetDescription>
          </SheetHeader>

          {selectedReorder && (
            <div className="flex-1 overflow-y-auto">
              {/* Medicine Info */}
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-lg mb-3">Medicine Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Brand Name</p>
                    <p className="font-medium">{selectedReorder.drug?.brandName}</p>
                  </div>
                  {selectedReorder.drug?.genericName && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Generic Name</p>
                      <p className="font-medium">{selectedReorder.drug.genericName}</p>
                    </div>
                  )}
                  {selectedReorder.drug?.category && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Category</p>
                      <p className="font-medium">{selectedReorder.drug.category}</p>
                    </div>
                  )}
                  {selectedReorder.drug?.sku && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">SKU</p>
                      <p className="font-medium">{selectedReorder.drug.sku}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Stock Info */}
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-lg mb-3">Stock Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded">
                    <p className="text-sm text-gray-600 mb-1">Current Stock</p>
                    <p className="text-2xl font-bold text-gray-800">
                      {selectedReorder.currentStock}
                    </p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded">
                    <p className="text-sm text-gray-600 mb-1">Reorder Level</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedReorder.reorderLevel}
                    </p>
                  </div>
                  <div className="bg-green-50 p-3 rounded">
                    <p className="text-sm text-gray-600 mb-1">Requested Qty</p>
                    <p className="text-2xl font-bold text-green-600">
                      {selectedReorder.requestedQty}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Priority</p>
                    <Badge className={`${getPriorityColor(selectedReorder.priority)} border-0`}>
                      {selectedReorder.priority}
                    </Badge>
                  </div>
                </div>
              </div>

              {/* Status Info */}
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-lg mb-3">Status Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Current Status</p>
                    <Badge
                      className={`${getStatusColor(selectedReorder.status)} border-0 flex items-center gap-1 w-fit`}
                    >
                      {getStatusIcon(selectedReorder.status)}
                      {selectedReorder.status}
                    </Badge>
                  </div>
                  {selectedReorder.requestedByUser && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Requested By</p>
                      <p className="font-medium">{selectedReorder.requestedByUser.username}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Requested Date</p>
                    <p className="font-medium">{formatDateTime(selectedReorder.createdAt)}</p>
                  </div>
                  {selectedReorder.approvedByUser && (
                    <>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Approved By</p>
                        <p className="font-medium">{selectedReorder.approvedByUser.username}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Approved Date</p>
                        <p className="font-medium">
                          {selectedReorder.approvedAt
                            ? formatDateTime(selectedReorder.approvedAt)
                            : 'N/A'}
                        </p>
                      </div>
                    </>
                  )}
                  {selectedReorder.orderedAt && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Ordered Date</p>
                      <p className="font-medium">{formatDateTime(selectedReorder.orderedAt)}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes */}
              {selectedReorder.notes && (
                <div className="px-6 py-4 border-b">
                  <h3 className="font-semibold text-lg mb-3">Notes</h3>
                  <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded">
                    {selectedReorder.notes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="px-6 py-4 space-y-2">
                {selectedReorder.status === 'PENDING' && (
                  <>
                    <Button
                      onClick={handleApprove}
                      className="w-full gap-2 bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approve Reorder
                    </Button>
                    <Button
                      onClick={handleReject}
                      variant="outline"
                      className="w-full gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      <AlertCircle className="h-4 w-4" />
                      Reject
                    </Button>
                  </>
                )}
                {selectedReorder.status === 'APPROVED' && (
                  <Button
                    onClick={handleMarkAsOrdered}
                    className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                  >
                    <Package className="h-4 w-4" />
                    Mark as Ordered
                  </Button>
                )}
                {selectedReorder.status === 'ORDERED' && (
                  <Button
                    onClick={handleMarkAsReceived}
                    className="w-full gap-2 bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Mark as Received
                  </Button>
                )}
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
