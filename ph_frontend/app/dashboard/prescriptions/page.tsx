'use client';

import { useState } from 'react';
import { Upload, Pill, CheckCircle, AlertCircle, Loader2, X, ShoppingCart } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import Image from 'next/image';

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

    setIsPurchasing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.prescriptions.purchase(
        prescriptionData,
        availabilityResults,
        paymentMethod
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

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Prescription Verification</h1>
          <p className="text-muted-foreground mt-1">
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
              </div>

              <div className="space-y-3 mb-6 max-h-96 overflow-y-auto">
                {availabilityResults.map((result, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <p className="font-medium">{result.prescribedMedication.medicationName}</p>
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
                          <span className="font-medium">{result.matchResult.matchedDrugName}</span>
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
                      <p className="text-xs text-destructive mt-2">
                        This medication is currently out of stock
                      </p>
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
                    isPurchasing || availabilityResults.every((r) => r.status === 'OUT_OF_STOCK')
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
    </div>
  );
}
