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
import { Search, Eye, Pill, RefreshCw } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { formatDateTime, formatDate } from '@/lib/utils';
import type { PaginatedResponse, Drug } from '@/lib/types';

interface Medication {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string | null;
}

interface PrescriptionHistory {
  id: string;
  saleId: string;
  patientName: string;
  doctorName?: string;
  prescriptionDate?: string;
  medications: Medication[];
  totalAmount: number;
  paymentMethod: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  customerAddress?: string;
  notes?: string;
  confidence?: number;
  createdAt: string;
  updatedAt: string;
}

export default function PrescriptionHistoryPage() {
  const [prescriptions, setPrescriptions] = useState<PrescriptionHistory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isViewSheetOpen, setIsViewSheetOpen] = useState(false);
  const [selectedPrescription, setSelectedPrescription] = useState<PrescriptionHistory | null>(
    null
  );

  const fetchPrescriptions = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await apiClient.get<PaginatedResponse<PrescriptionHistory>>(
        '/prescription-histories',
        {
          limit: 100,
        }
      );
      setPrescriptions(response.data || []);
    } catch (err) {
      console.error('Failed to fetch prescription history:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPrescriptions();
  }, [fetchPrescriptions]);

  const handleViewPrescription = (prescription: PrescriptionHistory) => {
    setSelectedPrescription(prescription);
    setIsViewSheetOpen(true);
  };

  const handleReorder = async (prescription: PrescriptionHistory) => {
    try {
      let successCount = 0;
      const failedMeds: string[] = [];

      // Create reorder requests for all medications in the prescription
      for (const med of prescription.medications) {
        try {
          // Search for the drug by name
          const searchResponse = await apiClient.get<PaginatedResponse<Drug>>('/drugs', {
            search: med.medicationName,
            limit: 1,
          });

          const drugs = searchResponse.data || [];

          if (drugs.length === 0) {
            failedMeds.push(med.medicationName);
            continue;
          }

          const drug = drugs[0];

          // Create reorder request
          await apiClient.post('/reorders', {
            drugId: drug.id,
            requestedQty: med.quantity,
            priority: 'MEDIUM',
            notes: `Reorder from previous prescription: ${prescription.patientName}`,
          });

          successCount++;
        } catch (medError) {
          console.error(`Failed to create reorder for ${med.medicationName}:`, medError);
          failedMeds.push(med.medicationName);
        }
      }

      if (successCount > 0) {
        let message = `Successfully created ${successCount} reorder request(s)`;
        if (failedMeds.length > 0) {
          message += `.\nFailed for: ${failedMeds.join(', ')}`;
        }
        alert(message);
      } else {
        alert('Failed to create any reorder requests. Medications not found in inventory.');
      }
    } catch (err) {
      console.error('Failed to create reorder requests:', err);
      alert('Failed to create reorder requests');
    }
  };

  const filteredPrescriptions = prescriptions.filter(
    (prescription) =>
      prescription.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.doctorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prescription.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Prescription History</h1>
        <p className="text-gray-500 mt-2">View and manage past prescriptions</p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <Input
          type="text"
          placeholder="Search by patient name, doctor, or prescription ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 h-10"
        />
      </div>

      {/* Prescriptions Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : filteredPrescriptions.length === 0 ? (
            <div className="p-8 text-center">
              <Pill className="h-12 w-12 mx-auto text-gray-300 mb-3" />
              <p className="text-gray-500 mb-2">No prescription history found</p>
              <p className="text-sm text-gray-400">
                {searchQuery ? 'Try adjusting your search' : 'No prescriptions processed yet'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-b bg-gray-50">
                    <TableHead className="h-12">Patient Name</TableHead>
                    <TableHead className="h-12">Doctor Name</TableHead>
                    <TableHead className="h-12">Customer</TableHead>
                    <TableHead className="h-12 text-center">Medications</TableHead>
                    <TableHead className="h-12 text-right">Total Amount</TableHead>
                    <TableHead className="h-12">Date</TableHead>
                    <TableHead className="h-12 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrescriptions.map((prescription) => (
                    <TableRow key={prescription.id} className="border-b hover:bg-gray-50">
                      <TableCell className="font-medium">{prescription.patientName}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {prescription.doctorName || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {prescription.customerName}
                      </TableCell>
                      <TableCell className="text-center">
                        <Badge variant="outline">{prescription.medications.length}</Badge>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-emerald-600">
                        ₹{Number(prescription.totalAmount).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDate(prescription.createdAt)}
                      </TableCell>
                      <TableCell className="text-right space-x-2 flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPrescription(prescription)}
                          className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleReorder(prescription)}
                          className="gap-1 text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Reorder
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

      {/* View Prescription Details Sheet */}
      <Sheet open={isViewSheetOpen} onOpenChange={setIsViewSheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:w-[600px] p-0 flex flex-col max-h-screen overflow-hidden"
        >
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>Prescription Details</SheetTitle>
            <SheetDescription>{selectedPrescription?.id}</SheetDescription>
          </SheetHeader>

          {selectedPrescription && (
            <div className="flex-1 overflow-y-auto">
              {/* Patient Information */}
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-lg mb-3">Patient Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Patient Name</p>
                    <p className="font-medium">{selectedPrescription.patientName}</p>
                  </div>
                  {selectedPrescription.doctorName && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Doctor Name</p>
                      <p className="font-medium">{selectedPrescription.doctorName}</p>
                    </div>
                  )}
                  {selectedPrescription.prescriptionDate && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Prescription Date</p>
                      <p className="font-medium">
                        {formatDate(selectedPrescription.prescriptionDate)}
                      </p>
                    </div>
                  )}
                  {selectedPrescription.confidence && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">AI Scan Confidence</p>
                      <Badge
                        variant={selectedPrescription.confidence >= 80 ? 'default' : 'secondary'}
                      >
                        {selectedPrescription.confidence}%
                      </Badge>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Information */}
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-lg mb-3">Customer Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Name</p>
                    <p className="font-medium">{selectedPrescription.customerName}</p>
                  </div>
                  {selectedPrescription.customerPhone && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Phone</p>
                      <p className="font-medium">{selectedPrescription.customerPhone}</p>
                    </div>
                  )}
                  {selectedPrescription.customerEmail && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="font-medium">{selectedPrescription.customerEmail}</p>
                    </div>
                  )}
                  {selectedPrescription.customerAddress && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Address</p>
                      <p className="font-medium">{selectedPrescription.customerAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Medications */}
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-lg mb-3">Medications</h3>
                <div className="space-y-3">
                  {selectedPrescription.medications.map((med, idx) => (
                    <div key={idx} className="bg-gray-50 p-3 rounded">
                      <p className="font-medium">{med.medicationName}</p>
                      <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                        <div>
                          <span className="font-semibold">Dosage:</span> {med.dosage}
                        </div>
                        <div>
                          <span className="font-semibold">Frequency:</span> {med.frequency}
                        </div>
                        <div>
                          <span className="font-semibold">Duration:</span> {med.duration}
                        </div>
                        <div>
                          <span className="font-semibold">Qty:</span> {med.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Transaction Details */}
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-lg mb-3">Transaction Details</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Total Amount</span>
                    <span className="font-semibold text-emerald-600 text-lg">
                      ₹{Number(selectedPrescription.totalAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Method</span>
                    <Badge variant="outline">{selectedPrescription.paymentMethod}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Transaction Date</span>
                    <span className="font-medium">
                      {formatDateTime(selectedPrescription.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedPrescription.notes && (
                <div className="px-6 py-4 border-b">
                  <h3 className="font-semibold text-lg mb-3">Notes</h3>
                  <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded">
                    {selectedPrescription.notes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="px-6 py-4 space-y-2">
                <Button
                  onClick={() => {
                    handleReorder(selectedPrescription);
                    setIsViewSheetOpen(false);
                  }}
                  className="w-full gap-2 bg-purple-600 hover:bg-purple-700"
                >
                  <RefreshCw className="h-4 w-4" />
                  Create Reorder Request
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}
