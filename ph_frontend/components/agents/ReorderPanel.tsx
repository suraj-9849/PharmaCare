'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertTriangle,
  Package,
  Mail,
  Search,
  ExternalLink,
  ChevronRight,
  UserPlus,
  Loader2,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Building2,
  Phone,
  RefreshCw,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import { cn } from '@/lib/utils';

interface DrugNeedingReorder {
  id: string;
  brandName: string;
  genericName: string | null;
  category: string | null;
  manufacturer: string | null;
  reorderLevel: number;
  totalStock: number;
  stockPercentage: number;
  hasActiveReorder: boolean;
  needsReorder: boolean;
}

interface PreviousSupplier {
  id: string;
  name: string;
  email: string | null;
  contactNumber: string | null;
  address: string | null;
  lastPurchaseDate: string;
  lastPurchasePrice: number;
  totalPurchases: number;
}

interface PublicSupplier {
  name: string;
  url: string;
  snippet: string;
  price?: string;
  source: string;
}

type FlowStep =
  | 'list'
  | 'supplier-choice'
  | 'previous-suppliers'
  | 'new-supplier-search'
  | 'add-supplier'
  | 'email-form';

interface ReorderPanelProps {
  onClose?: () => void;
}

export function ReorderPanel({ onClose }: ReorderPanelProps) {
  // State
  const [drugs, setDrugs] = useState<DrugNeedingReorder[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDrug, setSelectedDrug] = useState<DrugNeedingReorder | null>(null);
  const [flowStep, setFlowStep] = useState<FlowStep>('list');

  // Previous suppliers
  const [previousSuppliers, setPreviousSuppliers] = useState<PreviousSupplier[]>([]);
  const [loadingPrevSuppliers, setLoadingPrevSuppliers] = useState(false);

  // New suppliers
  const [publicSuppliers, setPublicSuppliers] = useState<PublicSupplier[]>([]);
  const [loadingPublicSuppliers, setLoadingPublicSuppliers] = useState(false);
  const [supplierSearch, setSupplierSearch] = useState('');

  // Email form
  const [selectedSupplier, setSelectedSupplier] = useState<PreviousSupplier | null>(null);
  const [emailQuantity, setEmailQuantity] = useState('');
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const [emailError, setEmailError] = useState('');

  // New supplier form
  const [newSupplierData, setNewSupplierData] = useState({
    name: '',
    email: '',
    contactNumber: '',
    address: '',
  });
  const [savingSupplier, setSavingSupplier] = useState(false);

  // Reorder creation
  const [reorderId, setReorderId] = useState<string | null>(null);

  // Fetch drugs needing reorder
  useEffect(() => {
    fetchDrugsNeedingReorder();
  }, []);

  const fetchDrugsNeedingReorder = async () => {
    setLoading(true);
    try {
      const response = await apiClient.reorders.getDrugsNeedingReorder();
      const data = response as { success: boolean; data: DrugNeedingReorder[] };
      if (data.success) {
        setDrugs(data.data);
      }
    } catch (error) {
      console.error('Error fetching drugs:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectDrug = async (drug: DrugNeedingReorder) => {
    setSelectedDrug(drug);
    setFlowStep('supplier-choice');

    // Create reorder request in background
    try {
      const response = await apiClient.reorders.create({
        drugId: drug.id,
        requestedQty: drug.reorderLevel - drug.totalStock,
        priority:
          drug.stockPercentage <= 10 ? 'HIGH' : drug.stockPercentage <= 25 ? 'MEDIUM' : 'LOW',
      });
      const data = response as { success: boolean; data: { id: string } };
      if (data.success) {
        setReorderId(data.data.id);
      }
    } catch (error) {
      console.error('Error creating reorder:', error);
    }
  };

  const handlePreviousSupplier = async () => {
    if (!reorderId) return;

    setFlowStep('previous-suppliers');
    setLoadingPrevSuppliers(true);

    try {
      const response = await apiClient.reorders.getPreviousSuppliers(reorderId);
      const data = response as { success: boolean; data: PreviousSupplier[] };
      if (data.success) {
        setPreviousSuppliers(data.data);
      }
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    } finally {
      setLoadingPrevSuppliers(false);
    }
  };

  const handleNewSupplier = async () => {
    if (!reorderId) return;

    setFlowStep('new-supplier-search');
    setLoadingPublicSuppliers(true);

    try {
      const response = await apiClient.reorders.searchSuppliers(reorderId);
      const data = response as { success: boolean; data: { suppliers: PublicSupplier[] } };
      if (data.success) {
        setPublicSuppliers(data.data.suppliers || []);
      }
    } catch (error) {
      console.error('Error searching suppliers:', error);
    } finally {
      setLoadingPublicSuppliers(false);
    }
  };

  const handleEmailSupplier = (supplier: PreviousSupplier) => {
    setSelectedSupplier(supplier);
    setEmailQuantity((selectedDrug?.reorderLevel ?? 0) - (selectedDrug?.totalStock ?? 0) + '');
    setFlowStep('email-form');
  };

  const handleSendEmail = async () => {
    if (!reorderId || !selectedSupplier || !emailQuantity) return;

    setSendingEmail(true);
    setEmailError('');

    try {
      const response = await apiClient.reorders.sendEmail(reorderId, {
        quantity: parseInt(emailQuantity),
        contactPerson: selectedSupplier.name,
        contactEmail: selectedSupplier.email || '',
        contactPhone: selectedSupplier.contactNumber || undefined,
      });

      const data = response as { success: boolean; message?: string };
      if (data.success) {
        setEmailSent(true);
        // Update reorder status to ordered
        await apiClient.reorders.markOrdered(reorderId);
      } else {
        setEmailError('Failed to send email');
      }
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to send email');
    } finally {
      setSendingEmail(false);
    }
  };

  const handleAddSupplier = () => {
    setFlowStep('add-supplier');
  };

  const handleSaveNewSupplier = async () => {
    if (!newSupplierData.name || !newSupplierData.email) return;

    setSavingSupplier(true);

    try {
      const response = await apiClient.suppliers.create({
        supplierName: newSupplierData.name,
        email: newSupplierData.email,
        contactNumber: newSupplierData.contactNumber,
        address: newSupplierData.address,
      });

      const data = response as { success: boolean; data: { id: string } };
      if (data.success) {
        // Navigate back to previous suppliers with new supplier added
        setFlowStep('previous-suppliers');
        setPreviousSuppliers((prev) => [
          {
            id: data.data.id,
            name: newSupplierData.name,
            email: newSupplierData.email,
            contactNumber: newSupplierData.contactNumber,
            address: newSupplierData.address,
            lastPurchaseDate: new Date().toISOString(),
            lastPurchasePrice: 0,
            totalPurchases: 0,
          },
          ...prev,
        ]);
        setNewSupplierData({ name: '', email: '', contactNumber: '', address: '' });
      }
    } catch (error) {
      console.error('Error saving supplier:', error);
    } finally {
      setSavingSupplier(false);
    }
  };

  const handleBack = () => {
    switch (flowStep) {
      case 'supplier-choice':
        setFlowStep('list');
        setSelectedDrug(null);
        break;
      case 'previous-suppliers':
      case 'new-supplier-search':
        setFlowStep('supplier-choice');
        break;
      case 'email-form':
        setFlowStep('previous-suppliers');
        setSelectedSupplier(null);
        setEmailSent(false);
        setEmailError('');
        break;
      case 'add-supplier':
        setFlowStep('new-supplier-search');
        break;
      default:
        setFlowStep('list');
    }
  };

  const getStockBadgeColor = (percentage: number) => {
    if (percentage === 0) return 'bg-red-500 text-white';
    if (percentage <= 25) return 'bg-red-100 text-red-700';
    if (percentage <= 50) return 'bg-amber-100 text-amber-700';
    return 'bg-green-100 text-green-700';
  };

  // Render list of drugs needing reorder
  const renderDrugList = () => (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Low Stock Items</h2>
          <p className="text-sm text-gray-500">Click on an item to start reorder process</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchDrugsNeedingReorder}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-xl" />
          ))}
        </div>
      ) : drugs.length === 0 ? (
        <div className="text-center py-12">
          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-3" />
          <p className="font-medium text-gray-900">All stock levels are healthy!</p>
          <p className="text-sm text-gray-500">No items need reordering at this time.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {drugs.map((drug) => (
            <Card
              key={drug.id}
              className={cn(
                'cursor-pointer transition-all hover:shadow-md hover:border-violet-200',
                drug.hasActiveReorder && 'opacity-60'
              )}
              onClick={() => !drug.hasActiveReorder && handleSelectDrug(drug)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{drug.brandName}</span>
                      {drug.stockPercentage === 0 && (
                        <Badge className="bg-red-500 text-white text-xs">OUT OF STOCK</Badge>
                      )}
                      {drug.hasActiveReorder && (
                        <Badge variant="secondary" className="text-xs">
                          Reorder Active
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      {drug.genericName || 'N/A'} • {drug.category}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                      <span className="text-sm">
                        Stock: <strong className="text-red-600">{drug.totalStock}</strong> /{' '}
                        {drug.reorderLevel}
                      </span>
                      <Badge className={cn('text-xs', getStockBadgeColor(drug.stockPercentage))}>
                        {drug.stockPercentage}%
                      </Badge>
                    </div>
                  </div>
                  {!drug.hasActiveReorder && (
                    <Button size="sm" className="bg-violet-600 hover:bg-violet-700 gap-1">
                      Reorder
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Render supplier choice
  const renderSupplierChoice = () => (
    <div className="space-y-6">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to list
      </button>

      <div className="text-center py-4">
        <Package className="h-12 w-12 text-violet-600 mx-auto mb-3" />
        <h2 className="text-xl font-semibold text-gray-900">{selectedDrug?.brandName}</h2>
        <p className="text-gray-500">{selectedDrug?.genericName}</p>
        <p className="text-sm text-red-600 mt-2">
          Need to order:{' '}
          <strong>
            {(selectedDrug?.reorderLevel ?? 0) - (selectedDrug?.totalStock ?? 0)} units
          </strong>
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card
          className="cursor-pointer hover:shadow-md hover:border-violet-200 transition-all"
          onClick={handlePreviousSupplier}
        >
          <CardContent className="p-6 text-center">
            <Building2 className="h-10 w-10 text-blue-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">Previous Supplier</h3>
            <p className="text-sm text-gray-500 mt-1">
              Order from suppliers you&apos;ve worked with before
            </p>
          </CardContent>
        </Card>

        <Card
          className="cursor-pointer hover:shadow-md hover:border-violet-200 transition-all"
          onClick={handleNewSupplier}
        >
          <CardContent className="p-6 text-center">
            <Search className="h-10 w-10 text-green-600 mx-auto mb-3" />
            <h3 className="font-semibold text-gray-900">New Supplier</h3>
            <p className="text-sm text-gray-500 mt-1">
              Search the web for new pharmaceutical suppliers
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  // Render previous suppliers
  const renderPreviousSuppliers = () => (
    <div className="space-y-4">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div>
        <h2 className="text-lg font-semibold text-gray-900">Previous Suppliers</h2>
        <p className="text-sm text-gray-500">
          Select a supplier to send a reorder email for {selectedDrug?.brandName}
        </p>
      </div>

      {loadingPrevSuppliers ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : previousSuppliers.length === 0 ? (
        <div className="text-center py-8">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto mb-3" />
          <p className="font-medium text-gray-900">No previous suppliers found</p>
          <p className="text-sm text-gray-500 mb-4">Try searching for new suppliers instead</p>
          <Button onClick={handleNewSupplier} className="bg-violet-600 hover:bg-violet-700">
            Search New Suppliers
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {previousSuppliers.map((supplier) => (
            <Card key={supplier.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-gray-400" />
                      <span className="font-medium text-gray-900">{supplier.name}</span>
                    </div>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                      {supplier.email && (
                        <span className="flex items-center gap-1">
                          <Mail className="h-3 w-3" />
                          {supplier.email}
                        </span>
                      )}
                      {supplier.contactNumber && (
                        <span className="flex items-center gap-1">
                          <Phone className="h-3 w-3" />
                          {supplier.contactNumber}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      Last purchase: {new Date(supplier.lastPurchaseDate).toLocaleDateString()} • ₹
                      {supplier.lastPurchasePrice}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 gap-1"
                    onClick={() => handleEmailSupplier(supplier)}
                    disabled={!supplier.email}
                  >
                    <Mail className="h-4 w-4" />
                    Send Email
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );

  // Render new supplier search
  const renderNewSupplierSearch = () => (
    <div className="space-y-4">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Search Suppliers</h2>
          <p className="text-sm text-gray-500">Find new suppliers for {selectedDrug?.brandName}</p>
        </div>
        <Button onClick={handleAddSupplier} variant="outline" size="sm" className="gap-1">
          <UserPlus className="h-4 w-4" />
          Add Manually
        </Button>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Search suppliers..."
          value={supplierSearch}
          onChange={(e) => setSupplierSearch(e.target.value)}
          className="flex-1"
        />
        <Button onClick={handleNewSupplier} disabled={loadingPublicSuppliers}>
          {loadingPublicSuppliers ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Search className="h-4 w-4" />
          )}
        </Button>
      </div>

      {loadingPublicSuppliers ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : publicSuppliers.length === 0 ? (
        <div className="text-center py-8">
          <Search className="h-10 w-10 text-gray-400 mx-auto mb-3" />
          <p className="font-medium text-gray-900">No suppliers found</p>
          <p className="text-sm text-gray-500 mb-4">Try adding a supplier manually</p>
          <Button onClick={handleAddSupplier} className="bg-violet-600 hover:bg-violet-700 gap-1">
            <UserPlus className="h-4 w-4" />
            Add Supplier Manually
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {publicSuppliers.map((supplier, index) => (
            <Card key={index} className="hover:shadow-md transition-all">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="font-medium text-gray-900 truncate">{supplier.name}</span>
                      <Badge variant="secondary" className="text-xs shrink-0">
                        {supplier.source}
                      </Badge>
                    </div>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{supplier.snippet}</p>
                    {supplier.price && (
                      <p className="text-sm text-green-600 mt-1 font-medium">{supplier.price}</p>
                    )}
                  </div>
                  <a
                    href={supplier.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0"
                  >
                    <Button size="sm" variant="outline" className="gap-1">
                      <ExternalLink className="h-4 w-4" />
                      Visit
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          ))}

          <div className="border-t pt-4 mt-4">
            <p className="text-sm text-gray-500 text-center mb-3">
              Found a supplier you like? Add them to your database
            </p>
            <Button
              onClick={handleAddSupplier}
              className="w-full bg-violet-600 hover:bg-violet-700 gap-1"
            >
              <UserPlus className="h-4 w-4" />
              Add New Supplier
            </Button>
          </div>
        </div>
      )}
    </div>
  );

  // Render add supplier form
  const renderAddSupplierForm = () => (
    <div className="space-y-4">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      <div>
        <h2 className="text-lg font-semibold text-gray-900">Add New Supplier</h2>
        <p className="text-sm text-gray-500">Enter supplier details to add them to your database</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="supplier-name">Supplier Name *</Label>
          <Input
            id="supplier-name"
            placeholder="Enter supplier name"
            value={newSupplierData.name}
            onChange={(e) => setNewSupplierData((prev) => ({ ...prev, name: e.target.value }))}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="supplier-email">Email *</Label>
          <Input
            id="supplier-email"
            type="email"
            placeholder="supplier@example.com"
            value={newSupplierData.email}
            onChange={(e) => setNewSupplierData((prev) => ({ ...prev, email: e.target.value }))}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="supplier-phone">Contact Number</Label>
          <Input
            id="supplier-phone"
            placeholder="+91 XXXXX XXXXX"
            value={newSupplierData.contactNumber}
            onChange={(e) =>
              setNewSupplierData((prev) => ({ ...prev, contactNumber: e.target.value }))
            }
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="supplier-address">Address</Label>
          <Input
            id="supplier-address"
            placeholder="Enter supplier address"
            value={newSupplierData.address}
            onChange={(e) => setNewSupplierData((prev) => ({ ...prev, address: e.target.value }))}
            className="mt-1"
          />
        </div>

        <Button
          onClick={handleSaveNewSupplier}
          disabled={!newSupplierData.name || !newSupplierData.email || savingSupplier}
          className="w-full bg-violet-600 hover:bg-violet-700"
        >
          {savingSupplier ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin mr-2" />
              Saving...
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Save Supplier
            </>
          )}
        </Button>
      </div>
    </div>
  );

  // Render email form
  const renderEmailForm = () => (
    <div className="space-y-4">
      <button
        onClick={handleBack}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
      >
        <ArrowLeft className="h-4 w-4" />
        Back
      </button>

      {emailSent ? (
        <div className="text-center py-8">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900">Email Sent Successfully!</h2>
          <p className="text-gray-500 mt-2">
            Your purchase order has been sent to {selectedSupplier?.name}
          </p>
          <p className="text-sm text-gray-400 mt-1">
            The reorder status has been updated to &quot;Ordered&quot;
          </p>
          <Button
            onClick={onClose || (() => setFlowStep('list'))}
            className="mt-6 bg-violet-600 hover:bg-violet-700"
          >
            Done
          </Button>
        </div>
      ) : (
        <>
          <div className="text-center pb-4 border-b">
            <Mail className="h-12 w-12 text-blue-600 mx-auto mb-3" />
            <h2 className="text-lg font-semibold text-gray-900">Send Order Email</h2>
            <p className="text-sm text-gray-500">
              Sending to: <strong>{selectedSupplier?.name}</strong>
            </p>
            <p className="text-sm text-gray-400">{selectedSupplier?.email}</p>
          </div>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-4">
                <Package className="h-5 w-5 text-violet-600" />
                <div>
                  <p className="font-medium">{selectedDrug?.brandName}</p>
                  <p className="text-sm text-gray-500">{selectedDrug?.genericName}</p>
                </div>
              </div>

              <div>
                <Label htmlFor="quantity">Quantity to Order</Label>
                <Input
                  id="quantity"
                  type="number"
                  placeholder="Enter quantity"
                  value={emailQuantity}
                  onChange={(e) => setEmailQuantity(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Suggested: {(selectedDrug?.reorderLevel ?? 0) - (selectedDrug?.totalStock ?? 0)}{' '}
                  units
                </p>
              </div>
            </CardContent>
          </Card>

          {emailError && (
            <div className="flex items-center gap-2 text-red-600 text-sm">
              <XCircle className="h-4 w-4" />
              {emailError}
            </div>
          )}

          <Button
            onClick={handleSendEmail}
            disabled={!emailQuantity || sendingEmail}
            className="w-full bg-blue-600 hover:bg-blue-700"
          >
            {sendingEmail ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Sending Email...
              </>
            ) : (
              <>
                <Mail className="h-4 w-4 mr-2" />
                Send Purchase Order Email
              </>
            )}
          </Button>
        </>
      )}
    </div>
  );

  return (
    <div className="h-full overflow-auto p-4">
      {flowStep === 'list' && renderDrugList()}
      {flowStep === 'supplier-choice' && renderSupplierChoice()}
      {flowStep === 'previous-suppliers' && renderPreviousSuppliers()}
      {flowStep === 'new-supplier-search' && renderNewSupplierSearch()}
      {flowStep === 'add-supplier' && renderAddSupplierForm()}
      {flowStep === 'email-form' && renderEmailForm()}
    </div>
  );
}
