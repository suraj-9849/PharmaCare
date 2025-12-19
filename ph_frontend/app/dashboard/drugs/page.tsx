'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Search, Edit, Trash2, Pill, AlertCircle } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type { Drug, Supplier, PaginatedResponse } from '@/lib/types';

const categories = [
  'Antibiotic',
  'Analgesic',
  'Antacid',
  'Antihistamine',
  'Antihypertensive',
  'Antidiabetic',
  'Antipyretic',
  'Antiseptic',
  'Vitamin',
  'Supplement',
  'Other',
];

interface DrugFormData {
  brandName: string;
  genericName: string;
  category: string;
  manufacturer: string;
  requiresPrescription: boolean;
  reorderLevel: number;
}

const initialFormData: DrugFormData = {
  brandName: '',
  genericName: '',
  category: '',
  manufacturer: '',
  requiresPrescription: false,
  reorderLevel: 50,
};

export default function DrugsPage() {
  const [drugs, setDrugs] = useState<Drug[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedDrug, setSelectedDrug] = useState<Drug | null>(null);
  const [formData, setFormData] = useState<DrugFormData>(initialFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const fetchDrugs = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<PaginatedResponse<Drug>>('/drugs', {
        search: searchQuery || undefined,
        category: categoryFilter !== 'all' ? categoryFilter : undefined,
        limit: 100,
      });
      setDrugs((response as PaginatedResponse<Drug>).data || []);
    } catch (err) {
      console.error('Failed to fetch drugs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, categoryFilter]);

  const fetchSuppliers = useCallback(async () => {
    try {
      await apiClient.get<PaginatedResponse<Supplier>>('/suppliers', {
        limit: 100,
      });
    } catch (err) {
      console.error('Failed to fetch suppliers:', err);
    }
  }, []);

  useEffect(() => {
    fetchDrugs();
    fetchSuppliers();
  }, [fetchDrugs, fetchSuppliers]);

  const handleOpenDialog = (drug?: Drug) => {
    if (drug) {
      setSelectedDrug(drug);
      setFormData({
        brandName: drug.brandName,
        genericName: drug.genericName || '',
        category: drug.category,
        manufacturer: drug.manufacturer || '',
        requiresPrescription: drug.requiresPrescription || false,
        reorderLevel: drug.reorderLevel,
      });
    } else {
      setSelectedDrug(null);
      setFormData(initialFormData);
    }
    setError('');
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.brandName.trim()) {
      setError('Drug name is required');
      return;
    }
    if (!formData.category) {
      setError('Category is required');
      return;
    }

    setIsSubmitting(true);

    try {
      if (selectedDrug) {
        await apiClient.put(`/drugs/${selectedDrug.id}`, formData);
      } else {
        await apiClient.post('/drugs', formData);
      }

      setIsDialogOpen(false);
      fetchDrugs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save drug');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDrug) return;

    try {
      await apiClient.delete(`/drugs/${selectedDrug.id}`);
      setIsDeleteDialogOpen(false);
      setSelectedDrug(null);
      fetchDrugs();
    } catch (err) {
      console.error('Failed to delete drug:', err);
    }
  };

  const filteredDrugs = drugs.filter((drug) => {
    const matchesSearch =
      drug.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drug.genericName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      drug.manufacturer?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = categoryFilter === 'all' || drug.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Drugs</h1>
          <p className="text-gray-500">Manage your drug inventory</p>
        </div>
        <Button
          onClick={() => handleOpenDialog()}
          className="gap-2 bg-emerald-600 hover:bg-emerald-700"
        >
          <Plus className="h-4 w-4" />
          Add Drug
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search drugs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Drugs Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-lg" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-48" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                    <Skeleton className="h-8 w-20" />
                  </div>
                ))}
              </div>
            </div>
          ) : filteredDrugs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-500">
              <Pill className="mb-4 h-12 w-12 text-gray-300" />
              <p className="text-lg font-medium">No drugs found</p>
              <p className="text-sm">Add your first drug to get started</p>
            </div>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Drug Name</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Manufacturer</TableHead>
                    <TableHead>Prescription</TableHead>
                    <TableHead>Reorder Level</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDrugs.map((drug) => (
                    <TableRow key={drug.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-gray-900">{drug.brandName}</p>
                          {drug.genericName && (
                            <p className="text-sm text-gray-500">{drug.genericName}</p>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="bg-gray-50">
                          {drug.category}
                        </Badge>
                      </TableCell>
                      <TableCell>{drug.manufacturer || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={
                            drug.requiresPrescription
                              ? 'border-red-200 bg-red-50 text-red-700'
                              : 'border-green-200 bg-green-50 text-green-700'
                          }
                        >
                          {drug.requiresPrescription ? 'Required' : 'OTC'}
                        </Badge>
                      </TableCell>
                      <TableCell>{drug.reorderLevel}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(drug)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-700"
                            onClick={() => {
                              setSelectedDrug(drug);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedDrug ? 'Edit Drug' : 'Add New Drug'}</DialogTitle>
            <DialogDescription>
              {selectedDrug
                ? 'Update the drug information below'
                : 'Fill in the details to add a new drug'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit}>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid gap-4 py-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="brandName">Brand Name *</Label>
                  <Input
                    id="brandName"
                    value={formData.brandName}
                    onChange={(e) => setFormData({ ...formData, brandName: e.target.value })}
                    placeholder="Enter brand name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="genericName">Generic Name *</Label>
                  <Input
                    id="genericName"
                    value={formData.genericName}
                    onChange={(e) => setFormData({ ...formData, genericName: e.target.value })}
                    placeholder="Enter generic name"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="manufacturer">Manufacturer *</Label>
                  <Input
                    id="manufacturer"
                    value={formData.manufacturer}
                    onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
                    placeholder="Enter manufacturer"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="reorderLevel">Reorder Level</Label>
                  <Input
                    id="reorderLevel"
                    type="number"
                    min="0"
                    value={formData.reorderLevel}
                    onChange={(e) =>
                      setFormData({ ...formData, reorderLevel: parseInt(e.target.value) || 0 })
                    }
                  />
                </div>
                <div className="flex items-center space-x-2 pt-6">
                  <input
                    type="checkbox"
                    id="requiresPrescription"
                    checked={formData.requiresPrescription}
                    onChange={(e) =>
                      setFormData({ ...formData, requiresPrescription: e.target.checked })
                    }
                    className="h-4 w-4 rounded border-gray-300"
                  />
                  <Label htmlFor="requiresPrescription">Requires Prescription</Label>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-emerald-600 hover:bg-emerald-700"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Spinner className="mr-2 h-4 w-4" />
                    Saving...
                  </>
                ) : selectedDrug ? (
                  'Update Drug'
                ) : (
                  'Add Drug'
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Drug</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{selectedDrug?.brandName}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
