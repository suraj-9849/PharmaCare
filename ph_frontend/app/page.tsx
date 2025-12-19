'use client';

import { useState, useCallback } from 'react';
import {
  Upload,
  Pill,
  CheckCircle,
  AlertCircle,
  Loader2,
  X,
  ShoppingCart,
  RefreshCw,
  Plus,
  Calendar,
  Eye,
  Search,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import Image from 'next/image';
import { formatDateTime, formatDate } from '@/lib/utils';
import type { PaginatedResponse } from '@/lib/types';

interface Medication {
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
  instructions: string | null;
}

interface PrescriptionData {
  patientName: string | null;
  doctorName: string | null;
  prescriptionDate: string | null;
  medications: Medication[];
  confidence: number;
}

interface InventoryBatch {
  id: string;
  batchNumber: string;
  quantity: number;
  expiryDate: string;
  sellPrice: number;
}

interface AvailabilityResult {
  prescribedMedication: Medication;
  matchResult: {
    matchedDrugId: string | null;
    matchedDrugName: string;
    confidence: number;
    requiresPrescription: boolean;
    availableQuantity: number;
    isAvailable: boolean;
    alternativeSuggestions: string[];
  };
  availableBatches: InventoryBatch[];
  status: 'IN_STOCK' | 'LOW_STOCK' | 'OUT_OF_STOCK';
}

interface PurchaseResponse {
  message: string;
}

interface CustomerDetails {
  id?: string;
  name: string;
  phone: string;
  email: string;
  address: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  address?: string;
}

interface MedicationDialogState {
  isOpen: boolean;
  medicationName: string;
  dosage: string;
  frequency: string;
  duration: string;
  quantity: number;
}

interface Drug {
  id: string;
  brandName: string;
  genericName: string;
  category: string;
  manufacturer: string;
  requiresPrescription: boolean;
  sku: string;
}

interface ReorderDialogState {
  isOpen: boolean;
  medication: AvailabilityResult | null;
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

export default function PrescriptionVerificationPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isCheckingAvailability, setIsCheckingAvailability] = useState(false);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [prescriptionData, setPrescriptionData] = useState<PrescriptionData | null>(null);
  const [availabilityResults, setAvailabilityResults] = useState<AvailabilityResult[] | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<string>('CASH');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [customerSearchResults, setCustomerSearchResults] = useState<Customer[]>([]);
  const [isSearchingCustomers, setIsSearchingCustomers] = useState(false);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [medicationDialog, setMedicationDialog] = useState<MedicationDialogState>({
    isOpen: false,
    medicationName: '',
    dosage: '',
    frequency: '',
    duration: '',
    quantity: 1,
  });
  const [drugSearchResults, setDrugSearchResults] = useState<Drug[]>([]);
  const [isSearchingDrugs, setIsSearchingDrugs] = useState(false);
  const [showDrugDropdown, setShowDrugDropdown] = useState(false);
  const [reorderDialog, setReorderDialog] = useState<ReorderDialogState>({
    isOpen: false,
    medication: null,
  });
  const [prescriptionHistory, setPrescriptionHistory] = useState<PrescriptionHistory[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  const [historySearchQuery, setHistorySearchQuery] = useState('');
  const [isViewHistorySheetOpen, setIsViewHistorySheetOpen] = useState(false);
  const [selectedHistoryPrescription, setSelectedHistoryPrescription] =
    useState<PrescriptionHistory | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setError(null);
    setPrescriptionData(null);
    setAvailabilityResults(null);
    setSuccess(null);
  };

  const handleCustomerSearch = async (searchTerm: string) => {
    setCustomerDetails({ ...customerDetails, name: searchTerm });

    if (searchTerm.length < 2) {
      setCustomerSearchResults([]);
      setShowCustomerDropdown(false);
      return;
    }

    setIsSearchingCustomers(true);
    try {
      const response = await apiClient.get<{ data: Customer[] }>('/customers', {
        search: searchTerm,
        limit: 10,
      });

      // API returns: { success, message, data: [...], pagination }
      const customers = response.data || [];
      console.log('Customer search response:', response);
      setCustomerSearchResults(customers);
      setShowCustomerDropdown(customers.length > 0);
    } catch (err) {
      console.error('Failed to search customers:', err);
      setCustomerSearchResults([]);
    } finally {
      setIsSearchingCustomers(false);
    }
  };

  const handleSelectCustomer = (customer: Customer) => {
    setCustomerDetails({
      id: customer.id,
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address || '',
    });
    setShowCustomerDropdown(false);
    setCustomerSearchResults([]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      setPrescriptionData(null);
      setAvailabilityResults(null);
      setSuccess(null);
    } else {
      setError('Please drop an image file');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleScan = async () => {
    if (!selectedFile) return;

    setIsScanning(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.prescriptions.scan(selectedFile);
      const data = response.data as PrescriptionData;
      setPrescriptionData(data);

      // Automatically check availability
      await checkAvailability(data.medications);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to scan prescription');
    } finally {
      setIsScanning(false);
    }
  };

  const checkAvailability = async (medications: Medication[]) => {
    setIsCheckingAvailability(true);
    setError(null);

    try {
      const response = await apiClient.prescriptions.checkAvailability(medications);
      const data = response.data as { results: AvailabilityResult[] };
      setAvailabilityResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to check availability');
    } finally {
      setIsCheckingAvailability(false);
    }
  };

  const handlePurchase = async () => {
    if (!prescriptionData || !availabilityResults) return;

    // Check if all items are at least partially available
    const allOutOfStock = availabilityResults.every((r) => r.status === 'OUT_OF_STOCK');
    if (allOutOfStock) {
      setError('All prescribed medications are out of stock');
      return;
    }

    // Validate at least customer name is provided
    if (!customerDetails.name.trim()) {
      setError('Please provide customer name');
      return;
    }

    setIsPurchasing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.prescriptions.purchase(
        prescriptionData,
        availabilityResults,
        paymentMethod,
        customerDetails.id,
        customerDetails.name,
        customerDetails.phone,
        customerDetails.email,
        customerDetails.address
      );

      const data = response as PurchaseResponse;
      setSuccess(data.message || 'Purchase completed successfully! Stock updated.');

      // Reset form after 3 seconds
      setTimeout(() => {
        handleClear();
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process purchase');
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setPrescriptionData(null);
    setAvailabilityResults(null);
    setError(null);
    setSuccess(null);
    setPaymentMethod('CASH');
    setCustomerDetails({
      name: '',
      phone: '',
      email: '',
      address: '',
    });
  };

  const handleAddManualMedication = () => {
    if (!medicationDialog.medicationName || !medicationDialog.dosage) {
      setError('Please fill in medicine name and dosage');
      return;
    }

    const newMedication: Medication = {
      medicationName: medicationDialog.medicationName,
      dosage: medicationDialog.dosage,
      frequency: medicationDialog.frequency,
      duration: medicationDialog.duration,
      quantity: medicationDialog.quantity,
      instructions: null,
    };

    if (prescriptionData) {
      const updatedPrescriptionData = {
        ...prescriptionData,
        medications: [...prescriptionData.medications, newMedication],
      };
      setPrescriptionData(updatedPrescriptionData);

      // Automatically check availability for the updated medications
      checkAvailability(updatedPrescriptionData.medications);
    }

    setMedicationDialog({
      isOpen: false,
      medicationName: '',
      dosage: '',
      frequency: '',
      duration: '',
      quantity: 1,
    });

    setError(null);
  };
  const handleRequestReorder = async (medicationName: string) => {
    try {
      await apiClient.post('/reorders', {
        medicineName: medicationName,
        priority: 'HIGH',
        notes: `Requested from prescription: ${medicationName}`,
      });
      setSuccess(`Reorder request created for ${medicationName}`);
      setReorderDialog({
        isOpen: false,
        medication: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create reorder request');
    }
  };

  const handleDrugSearch = async (searchTerm: string) => {
    setMedicationDialog({
      ...medicationDialog,
      medicationName: searchTerm,
    });

    if (searchTerm.length < 2) {
      setDrugSearchResults([]);
      setShowDrugDropdown(false);
      return;
    }

    setIsSearchingDrugs(true);
    try {
      const response = await apiClient.get<{ data: Drug[] }>('/drugs', {
        search: searchTerm,
        limit: 10,
      });

      // API returns: { success, message, data: [...], pagination }
      const drugs = response.data || [];
      console.log('Drug search response:', response);
      setDrugSearchResults(drugs);
      setShowDrugDropdown(drugs.length > 0);
    } catch (err) {
      console.error('Failed to search drugs:', err);
      setDrugSearchResults([]);
    } finally {
      setIsSearchingDrugs(false);
    }
  };

  const handleSelectDrug = (drug: Drug) => {
    setMedicationDialog({
      ...medicationDialog,
      medicationName: drug.brandName,
    });
    setShowDrugDropdown(false);
    setDrugSearchResults([]);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return <Badge className="bg-green-500">✓ In Stock</Badge>;
      case 'LOW_STOCK':
        return <Badge className="bg-yellow-500">⚠ Low Stock</Badge>;
      case 'OUT_OF_STOCK':
        return <Badge variant="destructive">✗ Out of Stock</Badge>;
      default:
        return null;
    }
  };

  const fetchPrescriptionHistory = useCallback(async () => {
    try {
      setIsLoadingHistory(true);
      const response = await apiClient.get<PaginatedResponse<PrescriptionHistory>>(
        '/prescription-histories',
        {
          limit: 100,
        }
      );
      setPrescriptionHistory(response.data || []);
    } catch (err) {
      console.error('Failed to fetch prescription history:', err);
    } finally {
      setIsLoadingHistory(false);
    }
  }, []);

  const handleViewHistoryPrescription = (prescription: PrescriptionHistory) => {
    setSelectedHistoryPrescription(prescription);
    setIsViewHistorySheetOpen(true);
  };

  const handleHistoryReorder = async (prescription: PrescriptionHistory) => {
    try {
      for (const med of prescription.medications) {
        await apiClient.post('/reorders', {
          medicineName: med.medicationName,
          dosage: med.dosage,
          quantity: med.quantity,
          priority: 'MEDIUM',
          notes: `Reorder from previous prescription: ${prescription.patientName}`,
        });
      }
      setSuccess('Reorder requests created successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to create reorder requests:', err);
      setError('Failed to create reorder requests');
      setTimeout(() => setError(null), 3000);
    }
  };

  const filteredPrescriptionHistory = prescriptionHistory.filter(
    (prescription) =>
      prescription.patientName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      prescription.customerName.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      prescription.doctorName?.toLowerCase().includes(historySearchQuery.toLowerCase()) ||
      prescription.id.toLowerCase().includes(historySearchQuery.toLowerCase())
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Prescriptions</h1>
        <p className="text-muted-foreground mt-1">
          Manage prescription verification and view history
        </p>
      </div>

      <Tabs
        defaultValue="verification"
        className="w-full"
        onValueChange={(value) => {
          if (value === 'history') {
            fetchPrescriptionHistory();
          }
        }}
      >
        <TabsList className="grid w-full max-w-md grid-cols-2 mb-5">
          <TabsTrigger value="verification">
            <Pill className="w-4 h-4 mr-2" />
            Verification
          </TabsTrigger>
          <TabsTrigger value="history">
            <Calendar className="w-4 h-4 mr-2" />
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="verification" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold">Prescription Verification</h2>
              <p className="text-muted-foreground text-sm">
                Upload prescription to check availability and process purchase
              </p>
            </div>
            {(selectedFile || prescriptionData) && (
              <Button variant="outline" onClick={handleClear}>
                <X className="w-4 h-4 mr-2" />
                Clear
              </Button>
            )}
          </div>

          {/* Alerts */}
          {error && (
            <Card className="p-4 bg-destructive/10 border-destructive">
              <div className="flex items-center gap-2 text-destructive">
                <AlertCircle className="w-5 h-5" />
                <p>{error}</p>
              </div>
            </Card>
          )}

          {success && (
            <Card className="p-4 bg-green-50 border-green-200">
              <div className="flex items-center gap-2 text-green-700">
                <CheckCircle className="w-5 h-5" />
                <p>{success}</p>
              </div>
            </Card>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Upload & Preview */}
            <div className="space-y-4">
              <Card className="p-6">
                <h2 className="text-xl font-semibold mb-4">Upload Prescription Image</h2>

                {!previewUrl ? (
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                    onClick={() => document.getElementById('prescription-input')?.click()}
                  >
                    <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                    <p className="text-lg font-medium mb-1">Drop prescription here</p>
                    <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                    <p className="text-xs text-muted-foreground">
                      Supports handwritten & printed prescriptions
                    </p>
                    <input
                      id="prescription-input"
                      type="file"
                      accept="image/*"
                      onChange={handleFileSelect}
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="relative rounded-lg overflow-hidden border">
                      <Image
                        src={previewUrl}
                        alt="Prescription preview"
                        width={800}
                        height={600}
                        className="w-full h-auto max-h-96 object-contain"
                        unoptimized
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        onClick={handleScan}
                        disabled={isScanning || !!prescriptionData}
                        className="flex-1"
                      >
                        {isScanning ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Scanning with AI...
                          </>
                        ) : prescriptionData ? (
                          <>
                            <CheckCircle className="w-4 h-4 mr-2" />
                            Scanned
                          </>
                        ) : (
                          <>
                            <Pill className="w-4 h-4 mr-2" />
                            Scan Prescription
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>

              {prescriptionData && (
                <Card className="p-6">
                  <h3 className="font-semibold mb-3">Prescription Details</h3>
                  <div className="space-y-2 text-sm">
                    {prescriptionData.patientName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Patient:</span>
                        <span className="font-medium">{prescriptionData.patientName}</span>
                      </div>
                    )}
                    {prescriptionData.doctorName && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Doctor:</span>
                        <span className="font-medium">{prescriptionData.doctorName}</span>
                      </div>
                    )}
                    {prescriptionData.prescriptionDate && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Date:</span>
                        <span className="font-medium">{prescriptionData.prescriptionDate}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Confidence:</span>
                      <Badge variant={prescriptionData.confidence >= 80 ? 'default' : 'secondary'}>
                        {prescriptionData.confidence}%
                      </Badge>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Right: Medications & Availability */}
            <div className="space-y-4">
              {availabilityResults ? (
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold">
                      Medications ({availabilityResults.length})
                    </h2>
                    {prescriptionData && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() =>
                          setMedicationDialog({
                            ...medicationDialog,
                            isOpen: true,
                          })
                        }
                        className="gap-1"
                      >
                        <Plus className="w-3 h-3" />
                        Add Medicine
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                    {availabilityResults.map((result, index) => (
                      <Card key={index} className="p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="font-medium">
                              {result.prescribedMedication.medicationName}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {result.prescribedMedication.dosage} •{' '}
                              {result.prescribedMedication.frequency}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Duration: {result.prescribedMedication.duration} • Qty:{' '}
                              {result.prescribedMedication.quantity}
                            </p>
                          </div>
                          {getStatusBadge(result.status)}
                        </div>

                        {result.matchResult.matchedDrugId && (
                          <div className="mt-3 pt-3 border-t text-sm">
                            <div className="flex justify-between items-center">
                              <span className="text-muted-foreground">Matched Drug:</span>
                              <span className="font-medium">
                                {result.matchResult.matchedDrugName}
                              </span>
                            </div>
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-muted-foreground">Available:</span>
                              <span className="font-medium">
                                {result.matchResult.availableQuantity} units
                              </span>
                            </div>
                            {result.matchResult.requiresPrescription && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                Requires Prescription
                              </Badge>
                            )}
                          </div>
                        )}

                        {result.status === 'OUT_OF_STOCK' && (
                          <div className="space-y-2 mt-3 pt-3 border-t">
                            <p className="text-xs text-destructive font-medium">
                              This medication is currently out of stock
                            </p>
                            <Button
                              size="sm"
                              variant="outline"
                              className="w-full text-xs gap-1"
                              onClick={() =>
                                setReorderDialog({
                                  isOpen: true,
                                  medication: result,
                                })
                              }
                            >
                              <RefreshCw className="w-3 h-3" />
                              Request Reorder
                            </Button>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>

                  {isCheckingAvailability && (
                    <div className="text-center py-4">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Checking availability...</p>
                    </div>
                  )}

                  {/* Customer Details */}
                  <div className="space-y-3 pb-4 border-b">
                    <h3 className="font-medium text-sm">Customer Details</h3>
                    <div className="relative">
                      <Input
                        placeholder="Customer Name (Search or create new)"
                        value={customerDetails.name}
                        onChange={(e) => handleCustomerSearch(e.target.value)}
                        onFocus={() =>
                          customerSearchResults.length > 0 && setShowCustomerDropdown(true)
                        }
                        className="text-sm"
                      />
                      {isSearchingCustomers && (
                        <div className="absolute right-3 top-2.5">
                          <Loader2 className="w-4 h-4 animate-spin" />
                        </div>
                      )}
                      {showCustomerDropdown && customerSearchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto">
                          {customerSearchResults.map((customer) => (
                            <button
                              key={customer.id}
                              onClick={() => handleSelectCustomer(customer)}
                              className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0 text-sm"
                            >
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-xs text-gray-600">{customer.phone}</div>
                              {customer.email && (
                                <div className="text-xs text-gray-600">{customer.email}</div>
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <Input
                      placeholder="Phone (Optional)"
                      type="tel"
                      value={customerDetails.phone}
                      onChange={(e) =>
                        setCustomerDetails({ ...customerDetails, phone: e.target.value })
                      }
                      className="text-sm"
                    />
                    <Input
                      placeholder="Email (Optional)"
                      type="email"
                      value={customerDetails.email}
                      onChange={(e) =>
                        setCustomerDetails({ ...customerDetails, email: e.target.value })
                      }
                      className="text-sm"
                    />
                    <Input
                      placeholder="Address (Optional)"
                      value={customerDetails.address}
                      onChange={(e) =>
                        setCustomerDetails({ ...customerDetails, address: e.target.value })
                      }
                      className="text-sm"
                    />
                  </div>

                  {/* Payment & Purchase */}
                  <div className="space-y-4 pt-4 border-t">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Payment Method</label>
                      <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="CASH">Cash</SelectItem>
                          <SelectItem value="CARD">Card</SelectItem>
                          <SelectItem value="UPI">UPI</SelectItem>
                          <SelectItem value="CREDIT">Credit</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <Button
                      onClick={handlePurchase}
                      disabled={
                        isPurchasing ||
                        availabilityResults.every((r) => r.status === 'OUT_OF_STOCK')
                      }
                      className="w-full"
                      size="lg"
                    >
                      {isPurchasing ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing Purchase...
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4 mr-2" />
                          Process Purchase & Update Stock
                        </>
                      )}
                    </Button>
                  </div>
                </Card>
              ) : (
                <Card className="p-12 text-center">
                  <Pill className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Upload and scan a prescription to check medication availability
                  </p>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <Input
              type="text"
              placeholder="Search by patient name, doctor, or prescription ID..."
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          {/* History Table */}
          <Card>
            <CardContent className="p-0">
              {isLoadingHistory ? (
                <div className="p-8 space-y-4">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              ) : filteredPrescriptionHistory.length === 0 ? (
                <div className="p-8 text-center">
                  <Pill className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                  <p className="text-gray-500 mb-2">No prescription history found</p>
                  <p className="text-sm text-gray-400">
                    {historySearchQuery
                      ? 'Try adjusting your search'
                      : 'No prescriptions processed yet'}
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
                      {filteredPrescriptionHistory.map((prescription) => (
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
                              onClick={() => handleViewHistoryPrescription(prescription)}
                              className="gap-1 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleHistoryReorder(prescription)}
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
        </TabsContent>
      </Tabs>

      {/* Add Manual Medicine Dialog */}
      <Dialog
        open={medicationDialog.isOpen}
        onOpenChange={(open) => setMedicationDialog({ ...medicationDialog, isOpen: open })}
      >
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Medicine Manually</DialogTitle>
            <DialogDescription>
              Add medicine that couldn&apos;t be scanned or detected by AI
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Medicine Name</label>
              <div className="relative">
                <Input
                  value={medicationDialog.medicationName}
                  onChange={(e) => handleDrugSearch(e.target.value)}
                  onFocus={() => drugSearchResults.length > 0 && setShowDrugDropdown(true)}
                  placeholder="Type medicine name to search"
                />
                {isSearchingDrugs && (
                  <div className="absolute right-3 top-2.5">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                )}
                {showDrugDropdown && drugSearchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white border rounded-md shadow-lg z-10 max-h-48 overflow-y-auto mt-1">
                    {drugSearchResults.map((drug) => (
                      <button
                        key={drug.id}
                        onClick={() => handleSelectDrug(drug)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b last:border-b-0 text-sm"
                      >
                        <div className="font-medium">{drug.brandName}</div>
                        <div className="text-xs text-gray-600">{drug.genericName}</div>
                        <div className="text-xs text-gray-500">{drug.manufacturer}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Dosage</label>
              <Input
                value={medicationDialog.dosage}
                onChange={(e) =>
                  setMedicationDialog({
                    ...medicationDialog,
                    dosage: e.target.value,
                  })
                }
                placeholder="e.g., 500mg"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Frequency</label>
              <Input
                value={medicationDialog.frequency}
                onChange={(e) =>
                  setMedicationDialog({
                    ...medicationDialog,
                    frequency: e.target.value,
                  })
                }
                placeholder="e.g., 2 times daily"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Duration</label>
              <Input
                value={medicationDialog.duration}
                onChange={(e) =>
                  setMedicationDialog({
                    ...medicationDialog,
                    duration: e.target.value,
                  })
                }
                placeholder="e.g., 5 days"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Quantity</label>
              <Input
                type="number"
                value={medicationDialog.quantity}
                onChange={(e) =>
                  setMedicationDialog({
                    ...medicationDialog,
                    quantity: parseInt(e.target.value) || 1,
                  })
                }
                placeholder="1"
                min="1"
              />
            </div>
            <Button onClick={handleAddManualMedication} className="w-full">
              <Plus className="w-4 h-4 mr-2" />
              Add Medicine
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reorder Request Dialog */}
      <Dialog
        open={reorderDialog.isOpen}
        onOpenChange={(open) => setReorderDialog({ ...reorderDialog, isOpen: open })}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Reorder</DialogTitle>
            <DialogDescription>
              Create a reorder request for out-of-stock medicine
            </DialogDescription>
          </DialogHeader>
          {reorderDialog.medication && (
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Medicine Name</label>
                <p className="text-sm p-2 bg-gray-50 rounded">
                  {reorderDialog.medication.matchResult.matchedDrugName}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Required Quantity</label>
                <p className="text-sm p-2 bg-gray-50 rounded">
                  {reorderDialog.medication.prescribedMedication.quantity}
                </p>
              </div>
              <Button
                onClick={() => {
                  handleRequestReorder(reorderDialog.medication!.matchResult.matchedDrugName);
                }}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Create Reorder Request
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* View History Prescription Details Sheet */}
      <Sheet open={isViewHistorySheetOpen} onOpenChange={setIsViewHistorySheetOpen}>
        <SheetContent
          side="right"
          className="w-full sm:w-[600px] p-0 flex flex-col max-h-screen overflow-hidden"
        >
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle>Prescription Details</SheetTitle>
            <SheetDescription>{selectedHistoryPrescription?.id}</SheetDescription>
          </SheetHeader>

          {selectedHistoryPrescription && (
            <div className="flex-1 overflow-y-auto">
              {/* Patient Information */}
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-lg mb-3">Patient Information</h3>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Patient Name</p>
                    <p className="font-medium">{selectedHistoryPrescription.patientName}</p>
                  </div>
                  {selectedHistoryPrescription.doctorName && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Doctor Name</p>
                      <p className="font-medium">{selectedHistoryPrescription.doctorName}</p>
                    </div>
                  )}
                  {selectedHistoryPrescription.prescriptionDate && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Prescription Date</p>
                      <p className="font-medium">
                        {formatDate(selectedHistoryPrescription.prescriptionDate)}
                      </p>
                    </div>
                  )}
                  {selectedHistoryPrescription.confidence && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">AI Scan Confidence</p>
                      <Badge
                        variant={
                          selectedHistoryPrescription.confidence >= 80 ? 'default' : 'secondary'
                        }
                      >
                        {selectedHistoryPrescription.confidence}%
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
                    <p className="font-medium">{selectedHistoryPrescription.customerName}</p>
                  </div>
                  {selectedHistoryPrescription.customerPhone && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Phone</p>
                      <p className="font-medium">{selectedHistoryPrescription.customerPhone}</p>
                    </div>
                  )}
                  {selectedHistoryPrescription.customerEmail && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Email</p>
                      <p className="font-medium">{selectedHistoryPrescription.customerEmail}</p>
                    </div>
                  )}
                  {selectedHistoryPrescription.customerAddress && (
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Address</p>
                      <p className="font-medium">{selectedHistoryPrescription.customerAddress}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Medications */}
              <div className="px-6 py-4 border-b">
                <h3 className="font-semibold text-lg mb-3">Medications</h3>
                <div className="space-y-3">
                  {selectedHistoryPrescription.medications.map((med, idx) => (
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
                      ₹{Number(selectedHistoryPrescription.totalAmount).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Payment Method</span>
                    <Badge variant="outline">{selectedHistoryPrescription.paymentMethod}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Transaction Date</span>
                    <span className="font-medium">
                      {formatDateTime(selectedHistoryPrescription.createdAt)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedHistoryPrescription.notes && (
                <div className="px-6 py-4 border-b">
                  <h3 className="font-semibold text-lg mb-3">Notes</h3>
                  <p className="text-gray-700 text-sm bg-gray-50 p-3 rounded">
                    {selectedHistoryPrescription.notes}
                  </p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="px-6 py-4 space-y-2">
                <Button
                  onClick={() => {
                    handleHistoryReorder(selectedHistoryPrescription);
                    setIsViewHistorySheetOpen(false);
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

