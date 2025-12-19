'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Spinner } from '@/components/ui/spinner';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Search,
  X,
  AlertCircle,
  Trash2,
  CreditCard,
  Banknote,
  Smartphone,
  User,
  Users,
  Minus,
  Plus,
  ArrowLeft,
  Package,
  Calendar,
  AlertTriangle,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Check,
  ShieldAlert,
} from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type { InventoryBatch, Customer } from '@/lib/types';
import { cn } from '@/lib/utils';

interface CartItem {
  batchId: string;
  drugId: string;
  batch: InventoryBatch;
  quantity: number;
  unitPrice: number;
}

interface POSModeProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCreated: () => void;
}

interface NewCustomerForm {
  name: string;
  phone: string;
  email: string;
  address: string;
}

export function POSMode({ isOpen, onClose, onSaleCreated }: POSModeProps) {
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<InventoryBatch[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Customer state
  const [customerType, setCustomerType] = useState<'walk-in' | 'registered'>('walk-in');
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [customerSearchQuery, setCustomerSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [showCustomerDropdown, setShowCustomerDropdown] = useState(false);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [showNewCustomerForm, setShowNewCustomerForm] = useState(false);
  const [newCustomerForm, setNewCustomerForm] = useState<NewCustomerForm>({
    name: '',
    phone: '',
    email: '',
    address: '',
  });
  const [creatingCustomer, setCreatingCustomer] = useState(false);

  // Cash payment state
  const [cashReceived, setCashReceived] = useState(0);
  const [showCashInput, setShowCashInput] = useState(false);

  // FEFO Alert state
  const [showFefoAlert, setShowFefoAlert] = useState(false);
  const [fefoAlertData, setFefoAlertData] = useState<{
    batchNumber: string;
    expiryDate: string;
    remainingQty: number;
  } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const customerSearchRef = useRef<HTMLInputElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load available batches
  useEffect(() => {
    if (isOpen) {
      loadBatches();
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      handleReset();
    }
  }, [isOpen]);

  // Filter batches based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredBatches(batches.slice(0, 20));
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = batches.filter((batch) => {
      const brandName = batch.drug?.brandName?.toLowerCase() || '';
      const genericName = batch.drug?.genericName?.toLowerCase() || '';
      const batchNumber = batch.batchNumber?.toLowerCase() || '';
      const sku = batch.drug?.sku?.toLowerCase() || '';

      return (
        brandName.includes(query) ||
        genericName.includes(query) ||
        batchNumber.includes(query) ||
        sku.includes(query)
      );
    });

    setFilteredBatches(filtered);
  }, [searchQuery, batches]);

  // Customer search with debounce
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (customerSearchQuery.trim().length >= 2) {
      searchTimeoutRef.current = setTimeout(() => {
        searchCustomers(customerSearchQuery);
      }, 300);
    } else {
      setCustomers([]);
      setShowCustomerDropdown(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [customerSearchQuery]);

  // Keyboard shortcuts
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F1') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'F2') {
        e.preventDefault();
        setCustomerType((prev) => (prev === 'walk-in' ? 'registered' : 'walk-in'));
      }
      if (e.key === 'F10' && cart.length > 0) {
        e.preventDefault();
        setShowCashInput(true);
      }
      if (e.key === 'Escape') {
        if (searchQuery) {
          setSearchQuery('');
        } else if (showCashInput) {
          setShowCashInput(false);
        } else if (showNewCustomerForm) {
          setShowNewCustomerForm(false);
        } else {
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, cart.length, searchQuery, showCashInput, showNewCustomerForm, onClose]);

  const loadBatches = async () => {
    try {
      setIsLoadingBatches(true);
      const response = await apiClient.get<{ success: boolean; data: InventoryBatch[] }>(
        '/inventory/available'
      );
      const availableBatches = response?.data || [];
      setBatches(availableBatches);
      setFilteredBatches(availableBatches.slice(0, 20));
    } catch {
      setError('Failed to load available products');
    } finally {
      setIsLoadingBatches(false);
    }
  };

  const searchCustomers = async (query: string) => {
    setLoadingCustomers(true);
    try {
      const response = await apiClient.get<{ success: boolean; data: Customer[] }>(
        `/customers/search?q=${encodeURIComponent(query)}`
      );
      setCustomers(response.data || []);
      setShowCustomerDropdown(true);
    } catch (error) {
      console.error('Failed to search customers:', error);
      setCustomers([]);
    } finally {
      setLoadingCustomers(false);
    }
  };

  const createNewCustomer = async () => {
    if (!newCustomerForm.name.trim()) {
      setError('Customer name is required');
      return;
    }

    try {
      setCreatingCustomer(true);
      const response = await apiClient.post<{ success: boolean; data: Customer }>('/customers', {
        name: newCustomerForm.name.trim(),
        phone: newCustomerForm.phone.trim() || undefined,
        email: newCustomerForm.email.trim() || undefined,
        address: newCustomerForm.address.trim() || undefined,
      });

      const newCustomer = response.data?.data;
      if (newCustomer) {
        setSelectedCustomer(newCustomer);
        setShowNewCustomerForm(false);
        setNewCustomerForm({ name: '', phone: '', email: '', address: '' });
        setError('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create customer');
    } finally {
      setCreatingCustomer(false);
    }
  };

  const addToCart = (batch: InventoryBatch, quantity: number = 1) => {
    if (quantity <= 0 || quantity > batch.quantity) {
      setError(`Only ${batch.quantity} items available`);
      return;
    }

    // FEFO Check: Ensure first-expiring batch is selected
    const firstExpiringBatch = getFirstExpiringBatchForDrug(batch.drugId);
    if (firstExpiringBatch && firstExpiringBatch.id !== batch.id) {
      // Check if the first-expiring batch is already fully added to cart
      const firstBatchInCart = cart.find((i) => i.batchId === firstExpiringBatch.id);
      const remainingFirstBatchQty = firstExpiringBatch.quantity - (firstBatchInCart?.quantity || 0);
      
      if (remainingFirstBatchQty > 0) {
        // Show FEFO Alert Dialog
        setFefoAlertData({
          batchNumber: firstExpiringBatch.batchNumber,
          expiryDate: new Date(firstExpiringBatch.expiryDate).toLocaleDateString('en-IN', { 
            day: '2-digit', 
            month: 'short', 
            year: 'numeric' 
          }),
          remainingQty: remainingFirstBatchQty,
        });
        setShowFefoAlert(true);
        return;
      }
    }

    const existingItem = cart.find((i) => i.batchId === batch.id);
    if (existingItem) {
      if (existingItem.quantity + quantity > batch.quantity) {
        setError(`Total quantity exceeds available stock`);
        return;
      }
      setCart(
        cart.map((i) => (i.batchId === batch.id ? { ...i, quantity: i.quantity + quantity } : i))
      );
    } else {
      setCart([
        ...cart,
        {
          batchId: batch.id,
          drugId: batch.drugId,
          batch,
          quantity,
          unitPrice: Number(batch.sellPrice),
        },
      ]);
    }

    setError('');
    setSearchQuery('');
    searchInputRef.current?.focus();
  };

  const updateCartQuantity = (batchId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(batchId);
      return;
    }

    const item = cart.find((i) => i.batchId === batchId);
    if (item && quantity > item.batch.quantity) {
      setError(`Only ${item.batch.quantity} items available`);
      return;
    }

    setCart(cart.map((i) => (i.batchId === batchId ? { ...i, quantity } : i)));
    setError('');
  };

  const removeFromCart = (batchId: string) => {
    setCart(cart.filter((i) => i.batchId !== batchId));
  };

  const getSubtotal = () => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  const getTax = () => {
    return getSubtotal() * 0.0; // Adjust tax rate as needed
  };

  const getTotal = () => {
    return getSubtotal() + getTax();
  };

  const getChangeGiven = () => {
    const change = cashReceived - getTotal();
    return change > 0 ? change : 0;
  };

  const getDaysUntilExpiry = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // FEFO: Get the first-expiring batch for a given drug (excluding expired batches)
  const getFirstExpiringBatchForDrug = (drugId: string): InventoryBatch | null => {
    const drugBatches = batches
      .filter((b) => b.drugId === drugId && b.quantity > 0 && getDaysUntilExpiry(b.expiryDate) > 0)
      .sort((a, b) => new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime());
    return drugBatches.length > 0 ? drugBatches[0] : null;
  };

  // Check if a batch is the first-expiring batch for its drug
  const isFirstExpiringBatch = (batch: InventoryBatch): boolean => {
    const firstExpiring = getFirstExpiringBatchForDrug(batch.drugId);
    return firstExpiring?.id === batch.id;
  };

  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    setCustomerSearchQuery('');
    setShowCustomerDropdown(false);
  };

  const handleRazorpayPayment = async () => {
    if (cart.length === 0) {
      setError('Please add at least one item to the cart');
      return;
    }

    const total = getTotal();

    try {
      setPaymentProcessing(true);
      setError('');

      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        const currentCart = cart;
        const currentTotal = total;

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: Math.round(currentTotal * 100),
          currency: 'INR',
          name: 'PharmaCare',
          description: 'Medicine Purchase',
          handler: async (response: { razorpay_payment_id: string }) => {
            try {
              const payload = {
                customerId: selectedCustomer?.id || undefined,
                paymentMethod: 'UPI',
                transactionId: response.razorpay_payment_id,
                items: currentCart.map((item) => ({
                  drugId: item.drugId,
                  batchId: item.batchId,
                  quantity: item.quantity,
                  unitPrice: item.unitPrice,
                })),
              };

              await apiClient.post('/sales', payload);
              setError('');
              onSaleCreated();
              onClose();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to create sale');
              setPaymentProcessing(false);
            }
          },
          prefill: {
            contact: selectedCustomer?.phone || '',
            email: selectedCustomer?.email || '',
          },
          theme: {
            color: '#059669',
          },
          modal: {
            ondismiss: () => {
              setPaymentProcessing(false);
              setError('Payment cancelled');
            },
          },
        };

        interface RazorpayOptions {
          key: string | undefined;
          amount: number;
          currency: string;
          name: string;
          description: string;
          handler: (response: { razorpay_payment_id: string }) => Promise<void>;
          prefill: { contact: string; email: string };
          theme: { color: string };
          modal: { ondismiss: () => void };
        }

        interface RazorpayWindow extends Window {
          Razorpay: new (options: RazorpayOptions) => { open: () => void };
        }
        const rzp = new (window as unknown as RazorpayWindow).Razorpay(options);
        rzp.open();
      };
      document.body.appendChild(script);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Payment initialization failed');
      setPaymentProcessing(false);
    }
  };

  const createSale = async (paymentMethod: string) => {
    if (cart.length === 0) {
      setError('Please add at least one item to the cart');
      return;
    }

    try {
      setIsSubmitting(true);
      const total = getTotal();

      if (paymentMethod === 'CASH' && cashReceived < total) {
        setError('Cash received must be at least equal to the total amount');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        customerId: selectedCustomer?.id || undefined,
        paymentMethod,
        cashReceived: paymentMethod === 'CASH' ? cashReceived : null,
        changeGiven: paymentMethod === 'CASH' ? getChangeGiven() : null,
        items: cart.map((item) => ({
          drugId: item.drugId,
          batchId: item.batchId,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
        })),
      };

      await apiClient.post('/sales', payload);
      setError('');
      onSaleCreated();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sale');
      setIsSubmitting(false);
    }
  };

  const handleQuickPay = (method: 'CASH' | 'UPI' | 'CARD') => {
    if (method === 'CASH') {
      setShowCashInput(true);
    } else if (method === 'UPI') {
      handleRazorpayPayment();
    } else {
      createSale(method);
    }
  };

  const handleCompleteCashSale = () => {
    createSale('CASH');
  };

  const handleReset = () => {
    setCart([]);
    setSearchQuery('');
    setCustomerType('walk-in');
    setSelectedCustomer(null);
    setCustomerSearchQuery('');
    setCashReceived(0);
    setShowCashInput(false);
    setShowNewCustomerForm(false);
    setNewCustomerForm({ name: '', phone: '', email: '', address: '' });
    setError('');
    setIsSubmitting(false);
    setPaymentProcessing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-white z-50 flex flex-col">
      {/* Professional Header */}
      <div className="h-20 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white px-8 flex items-center justify-between shrink-0 shadow-lg">
        <div className="flex items-center gap-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="text-white hover:bg-emerald-800 px-4 py-2 h-10"
          >
            <ArrowLeft className="h-5 w-5 mr-2" />
            Exit POS
          </Button>
          <Separator orientation="vertical" className="h-10 bg-emerald-500" />
          <div>
            <h1 className="text-2xl font-bold">PharmaCare Point of Sale</h1>
            <p className="text-emerald-100 text-sm">Fast & Efficient Transaction System</p>
          </div>
        </div>

        {/* Keyboard Shortcuts & Customer Toggle */}
        <div className="flex items-center gap-6">
          <div className="text-sm text-emerald-100 hidden lg:flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="px-2.5 py-1 bg-emerald-800 rounded text-xs font-mono">F1</kbd>
              <span className="text-xs">Search</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2.5 py-1 bg-emerald-800 rounded text-xs font-mono">F2</kbd>
              <span className="text-xs">Customer</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-2.5 py-1 bg-emerald-800 rounded text-xs font-mono">F10</kbd>
              <span className="text-xs">Pay</span>
            </span>
          </div>
          <Separator orientation="vertical" className="h-10 bg-emerald-500 hidden lg:block" />
          <div className="flex items-center gap-2 bg-emerald-800 rounded-lg p-1.5">
            <button
              onClick={() => setCustomerType('walk-in')}
              className={cn(
                'px-5 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2',
                customerType === 'walk-in'
                  ? 'bg-white text-emerald-700 shadow-md'
                  : 'text-white hover:bg-emerald-700'
              )}
            >
              <User className="h-4 w-4" />
              Walk-in
            </button>
            <button
              onClick={() => setCustomerType('registered')}
              className={cn(
                'px-5 py-2 rounded-md text-sm font-semibold transition-all flex items-center gap-2',
                customerType === 'registered'
                  ? 'bg-white text-emerald-700 shadow-md'
                  : 'text-white hover:bg-emerald-700'
              )}
            >
              <Users className="h-4 w-4" />
              Registered
            </button>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mx-8 mt-4 rounded-lg">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Main Content - Split Screen */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Side - Product Search & Grid (65%) */}
        <div className="w-[65%] border-r-2 border-gray-200 flex flex-col bg-gray-50">
          {/* Search Bar */}
          <div className="p-6 bg-white border-b-2 border-gray-200 shadow-sm">
            <div className="relative">
              <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-6 w-6 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Scan barcode or type product name, generic name, batch number..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && filteredBatches.length === 1) {
                    addToCart(filteredBatches[0], 1);
                  }
                }}
                className="pl-16 pr-14 h-16 text-lg border-2 border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl shadow-sm"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-5 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full p-2 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
            <div className="flex items-center justify-between mt-3">
              <p className="text-sm text-gray-600 font-medium">
                {filteredBatches.length} product{filteredBatches.length !== 1 ? 's' : ''} available
              </p>
              {searchQuery && (
                <Badge variant="secondary" className="text-xs">
                  Searching: {searchQuery}
                </Badge>
              )}
            </div>
          </div>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto p-6">
            {isLoadingBatches ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <Spinner className="h-10 w-10 text-emerald-600 mx-auto mb-4" />
                  <p className="text-gray-500 font-medium">Loading products...</p>
                </div>
              </div>
            ) : filteredBatches.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                <Package className="h-20 w-20 mb-4 text-gray-300" />
                <p className="text-xl font-semibold text-gray-500">No products found</p>
                <p className="text-sm text-gray-400 mt-1">Try a different search term</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredBatches.map((batch) => {
                  const daysUntilExpiry = getDaysUntilExpiry(batch.expiryDate);
                  const isExpiringSoon = daysUntilExpiry <= 90 && daysUntilExpiry > 0;
                  const isExpired = daysUntilExpiry <= 0;
                  const isFirstExpiring = isFirstExpiringBatch(batch);
                  
                  // Check if this batch can be selected (FEFO compliance)
                  const firstExpiringBatch = getFirstExpiringBatchForDrug(batch.drugId);
                  const firstBatchInCart = firstExpiringBatch ? cart.find((i) => i.batchId === firstExpiringBatch.id) : null;
                  const remainingFirstBatchQty = firstExpiringBatch ? firstExpiringBatch.quantity - (firstBatchInCart?.quantity || 0) : 0;
                  const canSelect = isFirstExpiring || remainingFirstBatchQty <= 0;

                  return (
                    <button
                      key={batch.id}
                      onClick={() => addToCart(batch, 1)}
                      className={cn(
                        "bg-white border-2 rounded-xl p-5 text-left transition-all group relative overflow-hidden",
                        isFirstExpiring 
                          ? "border-emerald-400 ring-2 ring-emerald-100 hover:border-emerald-500 hover:shadow-xl" 
                          : canSelect
                            ? "border-gray-200 hover:border-emerald-500 hover:shadow-xl"
                            : "border-gray-200 opacity-60 cursor-not-allowed"
                      )}
                    >
                      {/* Hover Effect */}
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-br to-transparent opacity-0 transition-opacity",
                        canSelect ? "from-emerald-50 group-hover:opacity-100" : "from-gray-50"
                      )} />

                      {/* FEFO Badge */}
                      {isFirstExpiring && !isExpired && (
                        <div className="absolute -top-1 -right-1 z-10">
                          <Badge className="bg-emerald-500 text-white text-[10px] px-2 py-0.5 shadow-md">
                            SELL FIRST
                          </Badge>
                        </div>
                      )}
                      
                      {/* Locked Badge for non-first batches */}
                      {!isFirstExpiring && !canSelect && (
                        <div className="absolute -top-1 -right-1 z-10">
                          <Badge variant="secondary" className="bg-gray-400 text-white text-[10px] px-2 py-0.5 shadow-md">
                            FEFO LOCKED
                          </Badge>
                        </div>
                      )}

                      <div className="relative">
                        <div className="flex justify-between items-start mb-3">
                          <h3 className={cn(
                            "font-bold line-clamp-2 text-base leading-tight",
                            canSelect ? "text-gray-900 group-hover:text-emerald-700" : "text-gray-500"
                          )}>
                            {batch.drug?.brandName || 'Unknown'}
                          </h3>
                          {(isExpiringSoon || isExpired) && (
                            <AlertTriangle
                              className={cn(
                                'h-5 w-5 shrink-0 ml-2',
                                isExpired ? 'text-red-500' : 'text-orange-500'
                              )}
                            />
                          )}
                        </div>

                        <p className="text-sm text-gray-600 mb-4 line-clamp-1 font-medium">
                          {batch.drug?.genericName || 'N/A'}
                        </p>

                        <div className="space-y-2.5">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center text-gray-600 font-medium">
                              <Package className="h-4 w-4 mr-2" />
                              Stock
                            </span>
                            <Badge
                              variant={batch.quantity > 10 ? 'default' : 'destructive'}
                              className="font-bold text-xs px-2.5 py-1"
                            >
                              {batch.quantity} units
                            </Badge>
                          </div>

                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center text-gray-600 font-medium">
                              <Calendar className="h-4 w-4 mr-2" />
                              Expiry
                            </span>
                            <span
                              className={cn(
                                'font-semibold text-xs',
                                isExpired
                                  ? 'text-red-600'
                                  : isExpiringSoon
                                    ? 'text-orange-600'
                                    : 'text-gray-700'
                              )}
                            >
                              {new Date(batch.expiryDate).toLocaleDateString('en-IN', {
                                day: '2-digit',
                                month: 'short',
                                year: '2-digit',
                              })}
                            </span>
                          </div>

                          <Separator className="my-2" />

                          <div className="flex items-center justify-between pt-1">
                            <span className="text-sm text-gray-600 font-medium">Price</span>
                            <span className="text-2xl font-bold text-emerald-600">
                              ₹{Number(batch.sellPrice).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Side - Cart & Customer (35%) */}
        <div className="w-[35%] flex flex-col bg-white">
          {/* Customer Section */}
          {customerType === 'registered' && (
            <div className="p-6 bg-gradient-to-br from-emerald-50 to-blue-50 border-b-2 border-gray-200">
              {selectedCustomer ? (
                <div className="bg-white rounded-xl p-5 shadow-md border-2 border-emerald-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="bg-emerald-100 p-3 rounded-full">
                        <User className="h-6 w-6 text-emerald-700" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-lg">{selectedCustomer.name}</p>
                        <Badge variant="secondary" className="text-xs mt-1">
                          <Check className="h-3 w-3 mr-1" />
                          Verified Customer
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setSelectedCustomer(null)}
                      className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-2 text-sm">
                    {selectedCustomer.phone && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Phone className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium">{selectedCustomer.phone}</span>
                      </div>
                    )}
                    {selectedCustomer.email && (
                      <div className="flex items-center gap-2 text-gray-700">
                        <Mail className="h-4 w-4 text-emerald-600" />
                        <span className="font-medium">{selectedCustomer.email}</span>
                      </div>
                    )}
                    {selectedCustomer.address && (
                      <div className="flex items-start gap-2 text-gray-700">
                        <MapPin className="h-4 w-4 text-emerald-600 mt-0.5" />
                        <span className="font-medium">{selectedCustomer.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : showNewCustomerForm ? (
                <div className="bg-white rounded-xl p-5 shadow-md border-2 border-blue-200">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-gray-900 flex items-center gap-2">
                      <UserPlus className="h-5 w-5 text-blue-600" />
                      New Customer
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowNewCustomerForm(false)}
                      className="h-7 w-7 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-xs font-semibold text-gray-700">
                        Name <span className="text-red-500">*</span>
                      </Label>
                      <Input
                        value={newCustomerForm.name}
                        onChange={(e) =>
                          setNewCustomerForm({ ...newCustomerForm, name: e.target.value })
                        }
                        placeholder="Customer name"
                        className="mt-1 h-10"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-gray-700">Phone</Label>
                      <Input
                        value={newCustomerForm.phone}
                        onChange={(e) =>
                          setNewCustomerForm({ ...newCustomerForm, phone: e.target.value })
                        }
                        placeholder="Phone number"
                        className="mt-1 h-10"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-gray-700">Email</Label>
                      <Input
                        type="email"
                        value={newCustomerForm.email}
                        onChange={(e) =>
                          setNewCustomerForm({ ...newCustomerForm, email: e.target.value })
                        }
                        placeholder="Email address"
                        className="mt-1 h-10"
                      />
                    </div>

                    <div>
                      <Label className="text-xs font-semibold text-gray-700">Address</Label>
                      <Input
                        value={newCustomerForm.address}
                        onChange={(e) =>
                          setNewCustomerForm({ ...newCustomerForm, address: e.target.value })
                        }
                        placeholder="Full address"
                        className="mt-1 h-10"
                      />
                    </div>

                    <div className="flex gap-2 pt-2">
                      <Button
                        onClick={createNewCustomer}
                        disabled={!newCustomerForm.name.trim() || creatingCustomer}
                        className="flex-1 bg-emerald-600 hover:bg-emerald-700 h-10"
                      >
                        {creatingCustomer ? (
                          <>
                            <Spinner className="h-4 w-4 mr-2" />
                            Creating...
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4 mr-2" />
                            Create Customer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      ref={customerSearchRef}
                      type="text"
                      placeholder="Search customer by name or phone..."
                      value={customerSearchQuery}
                      onChange={(e) => setCustomerSearchQuery(e.target.value)}
                      className="pl-10 h-12 border-2 border-gray-300 focus:border-emerald-500 rounded-lg"
                    />
                    {loadingCustomers && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Spinner className="h-4 w-4" />
                      </div>
                    )}

                    {showCustomerDropdown && customers.length > 0 && (
                      <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                        {customers.map((customer) => (
                          <button
                            key={customer.id}
                            onClick={() => handleSelectCustomer(customer)}
                            className="w-full text-left px-4 py-3 hover:bg-emerald-50 border-b last:border-b-0 transition-colors"
                          >
                            <p className="font-semibold text-gray-900">{customer.name}</p>
                            {customer.phone && (
                              <p className="text-xs text-gray-600 mt-0.5">{customer.phone}</p>
                            )}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => setShowNewCustomerForm(true)}
                    variant="outline"
                    className="w-full h-11 border-2 border-dashed border-emerald-300 hover:border-emerald-500 hover:bg-emerald-50 text-emerald-700 font-semibold"
                  >
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add New Customer
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Cart Header */}
          <div className="p-5 bg-gray-50 border-b-2 border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                <Package className="h-6 w-6 text-emerald-600" />
                Current Bill
              </h2>
              <Badge className="text-base font-bold px-3 py-1 bg-emerald-600">
                {cart.length} {cart.length === 1 ? 'item' : 'items'}
              </Badge>
            </div>
          </div>

          {/* Cart Items */}
          <div className="flex-1 overflow-y-auto">
            {cart.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8">
                <Package className="h-20 w-20 mb-4 text-gray-300" />
                <p className="text-lg font-semibold text-gray-500">Cart is empty</p>
                <p className="text-sm text-gray-400 mt-1">Scan or select products to add</p>
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {cart.map((item, index) => (
                  <div key={item.batchId} className="p-5 hover:bg-gray-50 transition-colors">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex-1 pr-3">
                        <p className="font-bold text-gray-900 text-base leading-tight">
                          {index + 1}. {item.batch.drug?.brandName}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{item.batch.drug?.genericName}</p>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.batchId)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 shrink-0"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateCartQuantity(item.batchId, item.quantity - 1)}
                          className="h-8 w-8 p-0 hover:bg-white"
                        >
                          <Minus className="h-4 w-4" />
                        </Button>
                        <span className="w-12 text-center font-bold text-gray-900">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateCartQuantity(item.batchId, item.quantity + 1)}
                          disabled={item.quantity >= item.batch.quantity}
                          className="h-8 w-8 p-0 hover:bg-white"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          ₹{item.unitPrice.toFixed(2)} × {item.quantity}
                        </p>
                        <p className="font-bold text-lg text-emerald-600">
                          ₹{(item.unitPrice * item.quantity).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Total Section */}
          <div className="border-t-2 border-gray-200 bg-gray-50 p-5 space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center text-base">
                <span className="text-gray-600 font-medium">Subtotal</span>
                <span className="font-semibold text-gray-900">₹{getSubtotal().toFixed(2)}</span>
              </div>
              {getTax() > 0 && (
                <div className="flex justify-between items-center text-base">
                  <span className="text-gray-600 font-medium">Tax</span>
                  <span className="font-semibold text-gray-900">₹{getTax().toFixed(2)}</span>
                </div>
              )}
            </div>
            <Separator />
            <div className="flex justify-between items-center">
              <span className="text-xl font-bold text-gray-900">Total</span>
              <span className="text-3xl font-bold text-emerald-600">₹{getTotal().toFixed(2)}</span>
            </div>

            {showCashInput && (
              <div className="space-y-3 pt-3 border-t-2 border-gray-300">
                <div>
                  <Label className="text-sm font-semibold text-gray-700 mb-2 block">
                    Cash Received
                  </Label>
                  <Input
                    type="number"
                    min={getTotal()}
                    step="0.01"
                    value={cashReceived || ''}
                    onChange={(e) => setCashReceived(parseFloat(e.target.value) || 0)}
                    placeholder={`Min: ₹${getTotal().toFixed(2)}`}
                    className="h-14 text-lg font-semibold border-2 border-emerald-300 focus:border-emerald-500"
                    autoFocus
                  />
                </div>
                {cashReceived >= getTotal() && (
                  <div className="bg-emerald-50 border-2 border-emerald-200 rounded-lg p-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-semibold text-emerald-800">
                        Change to Return
                      </span>
                      <span className="text-2xl font-bold text-emerald-700">
                        ₹{getChangeGiven().toFixed(2)}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Payment Buttons */}
          <div className="p-5 border-t-2 border-gray-200 bg-white space-y-3">
            {!showCashInput ? (
              <div className="grid grid-cols-3 gap-3">
                <Button
                  onClick={() => handleQuickPay('CASH')}
                  disabled={cart.length === 0 || isSubmitting || paymentProcessing}
                  className="h-24 flex flex-col items-center justify-center bg-blue-100 hover:bg-blue-200 text-blue-700 shadow-md hover:shadow-lg transition-all border border-blue-200"
                >
                  <Banknote className="h-10 w-10 mb-2 stroke-[2.5]" />
                  <span className="text-2xl font-bold">Cash</span>
                </Button>
                <Button
                  onClick={() => handleQuickPay('UPI')}
                  disabled={cart.length === 0 || isSubmitting || paymentProcessing}
                  className="h-24 flex flex-col items-center justify-center bg-green-100 hover:bg-green-200 text-green-700 shadow-md hover:shadow-lg transition-all border border-green-200"
                >
                  <Smartphone className="h-6xl w-6xl mb-2 stroke-[2.5]" />
                  <span className="text-2xl font-bold">UPI</span>
                </Button>
                <Button
                  onClick={() => handleQuickPay('CARD')}
                  disabled={cart.length === 0 || isSubmitting || paymentProcessing}
                  className="h-24 flex flex-col items-center justify-center bg-purple-100 hover:bg-purple-200 text-purple-700 shadow-md hover:shadow-lg transition-all border border-purple-200"
                >
                  <CreditCard className="h-10 w-10 mb-2 stroke-[2.5]" />
                  <span className="text-2xl font-bold">Card</span>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Button
                  onClick={handleCompleteCashSale}
                  disabled={
                    cart.length === 0 ||
                    isSubmitting ||
                    paymentProcessing ||
                    cashReceived < getTotal()
                  }
                  className="w-full h-16 text-lg font-bold bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 shadow-lg"
                >
                  {isSubmitting ? (
                    <>
                      <Spinner className="h-5 w-5 mr-2" />
                      Processing Payment...
                    </>
                  ) : (
                    <>
                      <Check className="h-6 w-6 mr-2" />
                      Complete Sale - ₹{getTotal().toFixed(2)}
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCashInput(false);
                    setCashReceived(0);
                  }}
                  className="w-full h-12 border-2 hover:bg-gray-50"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FEFO Compliance Alert Dialog */}
      <AlertDialog open={showFefoAlert} onOpenChange={setShowFefoAlert}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-amber-100">
                <ShieldAlert className="h-6 w-6 text-amber-600" />
              </div>
              <AlertDialogTitle className="text-xl font-bold text-gray-900">
                FEFO Compliance Required
              </AlertDialogTitle>
            </div>
            <AlertDialogDescription asChild>
              <div className="space-y-4 text-left">
                <p className="text-gray-600">
                  To maintain proper inventory rotation and regulatory compliance, you must sell the earliest expiring batch first.
                </p>
                
                {fefoAlertData && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Required Batch:</span>
                      <span className="font-bold text-gray-900">{fefoAlertData.batchNumber}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Expiry Date:</span>
                      <span className="font-bold text-amber-700">{fefoAlertData.expiryDate}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-gray-600">Available Quantity:</span>
                      <span className="font-bold text-emerald-600">{fefoAlertData.remainingQty} units</span>
                    </div>
                  </div>
                )}

                <p className="text-sm text-gray-500 italic">
                  Please select the batch marked &quot;SELL FIRST&quot; before selecting other batches of the same product.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction 
              onClick={() => setShowFefoAlert(false)}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-semibold"
            >
              I Understand
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
