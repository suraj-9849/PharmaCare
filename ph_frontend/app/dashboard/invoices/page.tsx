'use client';

import { useState } from 'react';
import { Upload, FileText, CheckCircle, AlertCircle, Loader2, X } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

interface InvoiceItem {
  drugName: string;
  genericName: string | null;
  batchNumber: string;
  quantity: number;
  unitPrice: number | null;
  totalPrice: number | null;
  expiryDate: string;
  manufacturer: string | null;
  category: string | null;
}

interface ExtractedData {
  invoiceNumber: string | null;
  invoiceDate: string | null;
  supplier: {
    name: string;
    contactNumber: string | null;
    email: string | null;
    address: string | null;
  } | null;
  items: InvoiceItem[];
  totalAmount: number | null;
  gstAmount: number | null;
  confidence: number;
}

export default function InvoiceUploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
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
    setExtractedData(null);
    setSuccess(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setError(null);
      setExtractedData(null);
      setSuccess(null);
    } else {
      setError('Please drop an image file');
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleExtract = async () => {
    if (!selectedFile) return;

    setIsExtracting(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.invoices.extract(selectedFile);
      setExtractedData(response.data as ExtractedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to extract invoice data');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleProcess = async () => {
    if (!extractedData) return;

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await apiClient.invoices.process(extractedData);
      setSuccess((response as any).message || 'Invoice processed successfully!');

      // Reset form after 3 seconds
      setTimeout(() => {
        setSelectedFile(null);
        setPreviewUrl(null);
        setExtractedData(null);
        setSuccess(null);
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process invoice');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setExtractedData(null);
    setError(null);
    setSuccess(null);
  };

  const updateItemField = (index: number, field: keyof InvoiceItem, value: string | number) => {
    if (!extractedData) return;

    const updatedItems = [...extractedData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      [field]: value,
    };

    setExtractedData({
      ...extractedData,
      items: updatedItems,
    });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Invoice Upload</h1>
          <p className="text-muted-foreground mt-1">
            Upload supplier invoices to automatically add items to inventory
          </p>
        </div>
        {(selectedFile || extractedData) && (
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
            <h2 className="text-xl font-semibold mb-4">Upload Invoice Image</h2>

            {!previewUrl ? (
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center hover:border-primary/50 transition-colors cursor-pointer"
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <p className="text-lg font-medium mb-1">Drop invoice image here</p>
                <p className="text-sm text-muted-foreground mb-4">or click to browse</p>
                <p className="text-xs text-muted-foreground">
                  Supports: JPG, PNG, WEBP (Max 10MB)
                </p>
                <input
                  id="file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            ) : (
              <div className="space-y-4">
                <div className="relative rounded-lg overflow-hidden border">
                  <img
                    src={previewUrl}
                    alt="Invoice preview"
                    className="w-full h-auto max-h-96 object-contain"
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleExtract}
                    disabled={isExtracting || !!extractedData}
                    className="flex-1"
                  >
                    {isExtracting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Extracting with AI...
                      </>
                    ) : extractedData ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Extracted
                      </>
                    ) : (
                      <>
                        <FileText className="w-4 h-4 mr-2" />
                        Extract Data
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* Right: Extracted Data */}
        <div className="space-y-4">
          {extractedData && (
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Extracted Data</h2>
                <Badge variant={extractedData.confidence >= 80 ? 'default' : 'secondary'}>
                  {extractedData.confidence}% Confident
                </Badge>
              </div>

              <div className="space-y-4">
                {/* Invoice Details */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Invoice #</label>
                    <p className="text-sm">{extractedData.invoiceNumber || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date</label>
                    <p className="text-sm">{extractedData.invoiceDate || 'N/A'}</p>
                  </div>
                </div>

                {/* Supplier Details */}
                {extractedData.supplier && (
                  <div className="p-4 bg-muted/50 rounded-lg">
                    <h3 className="font-medium mb-2">Supplier</h3>
                    <div className="space-y-1 text-sm">
                      <p><span className="font-medium">Name:</span> {extractedData.supplier.name}</p>
                      {extractedData.supplier.email && (
                        <p><span className="font-medium">Email:</span> {extractedData.supplier.email}</p>
                      )}
                      {extractedData.supplier.contactNumber && (
                        <p><span className="font-medium">Phone:</span> {extractedData.supplier.contactNumber}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* Items Table */}
                <div>
                  <h3 className="font-medium mb-2">Items ({extractedData.items.length})</h3>
                  <div className="max-h-96 overflow-y-auto border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-muted sticky top-0">
                        <tr>
                          <th className="text-left p-2">Drug</th>
                          <th className="text-right p-2">Qty</th>
                          <th className="text-right p-2">Price</th>
                        </tr>
                      </thead>
                      <tbody>
                        {extractedData.items.map((item, index) => (
                          <tr key={index} className="border-t">
                            <td className="p-2">
                              <div>
                                <p className="font-medium">{item.drugName}</p>
                                {item.genericName && (
                                  <p className="text-xs text-muted-foreground">{item.genericName}</p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                  Batch: {item.batchNumber}
                                </p>
                              </div>
                            </td>
                            <td className="text-right p-2">{item.quantity}</td>
                            <td className="text-right p-2">₹{item.unitPrice?.toFixed(2) ?? 'N/A'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Total */}
                <div className="p-4 bg-primary/10 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">Total Amount</span>
                    <span className="text-xl font-bold">₹{extractedData.totalAmount?.toFixed(2) ?? 'N/A'}</span>
                  </div>
                </div>

                {/* Process Button */}
                <Button
                  onClick={handleProcess}
                  disabled={isProcessing}
                  className="w-full"
                  size="lg"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Processing Invoice...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Confirm & Add to Inventory
                    </>
                  )}
                </Button>
              </div>
            </Card>
          )}

          {!extractedData && (
            <Card className="p-12 text-center">
              <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Upload and extract an invoice to see the data here
              </p>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
