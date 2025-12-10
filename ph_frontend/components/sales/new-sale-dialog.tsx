'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Spinner } from '@/components/ui/spinner';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from '@/components/ui/sheet';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Plus, Trash2, ShoppingCart } from 'lucide-react';
import { apiClient } from '@/lib/api-client';
import type { InventoryBatch } from '@/lib/types';

interface CartItem {
  batchId: string;
  drugId: string;
  batch: InventoryBatch;
  quantity: number;
  unitPrice: number;
}

interface SaleFormData {
  paymentMethod: string;
  cashReceived: number;
}

interface NewSaleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSaleCreated: () => void;
}

const paymentMethods = ['CASH', 'CARD', 'UPI', 'CREDIT'];

export function NewSaleDialog({ isOpen, onClose, onSaleCreated }: NewSaleDialogProps) {
  const [batches, setBatches] = useState<InventoryBatch[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedBatchId, setSelectedBatchId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [formData, setFormData] = useState<SaleFormData>({
    paymentMethod: 'CASH',
    cashReceived: 0,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingBatches, setIsLoadingBatches] = useState(false);
  const [error, setError] = useState('');
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Load available batches
  useEffect(() => {
    if (isOpen) {
      loadBatches();
    }
  }, [isOpen]);

  const loadBatches = async () => {
    try {
      setIsLoadingBatches(true);
      const response = await apiClient.get<{ success: boolean; data: InventoryBatch[] }>(
        '/inventory/available'
      );
      setBatches(response?.data || []);
    } catch {
      setError('Failed to load available products');
    } finally {
      setIsLoadingBatches(false);
    }
  };

  const addToCart = () => {
    if (!selectedBatchId || itemQuantity <= 0) {
      setError('Please select a product and enter quantity');
      return;
    }

    const batch = batches.find((b) => b.id === selectedBatchId);
    if (!batch) return;

    if (itemQuantity > batch.quantity) {
      setError(`Only ${batch.quantity} items available`);
      return;
    }

    const existingItem = cart.find((i) => i.batchId === selectedBatchId);
    if (existingItem) {
      if (existingItem.quantity + itemQuantity > batch.quantity) {
        setError(`Total quantity exceeds available stock`);
        return;
      }
      setCart(
        cart.map((i) =>
          i.batchId === selectedBatchId ? { ...i, quantity: i.quantity + itemQuantity } : i
        )
      );
    } else {
      setCart([
        ...cart,
        {
          batchId: batch.id,
          drugId: batch.drugId,
          batch,
          quantity: itemQuantity,
          unitPrice: Number(batch.sellPrice),
        },
      ]);
    }

    setError('');
    setSelectedBatchId('');
    setItemQuantity(1);
  };

  const removeFromCart = (batchId: string) => {
    setCart(cart.filter((i) => i.batchId !== batchId));
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

  const getTotal = () => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  };

  const getChangeGiven = () => {
    if (formData.paymentMethod !== 'CASH') return 0;
    const change = formData.cashReceived - getTotal();
    return change > 0 ? change : 0;
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

      // Initialize Razorpay
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      script.onload = () => {
        const currentCart = cart;
        const currentTotal = total;

        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
          amount: Math.round(currentTotal * 100), // Amount in paise
          currency: 'INR',
          name: 'PharmaCare',
          description: 'Medicine Purchase',
          handler: async (response: { razorpay_payment_id: string }) => {
            try {
              const payload = {
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
              handleClose();
            } catch (err) {
              setError(err instanceof Error ? err.message : 'Failed to create sale');
              setPaymentProcessing(false);
            }
          },
          prefill: {
            contact: '',
            email: '',
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

  const createSale = async (paymentMethod: string, transactionId?: string) => {
    try {
      setIsSubmitting(true);
      const total = getTotal();

      if (formData.paymentMethod === 'CASH' && formData.cashReceived < total) {
        setError('Cash received must be at least equal to the total amount');
        setIsSubmitting(false);
        return;
      }

      const payload = {
        paymentMethod,
        cashReceived: paymentMethod === 'CASH' ? formData.cashReceived : null,
        changeGiven: paymentMethod === 'CASH' ? getChangeGiven() : null,
        transactionId,
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
      handleClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create sale');
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (cart.length === 0) {
      setError('Please add at least one item to the cart');
      return;
    }

    if (formData.paymentMethod === 'UPI') {
      handleRazorpayPayment();
    } else if (formData.paymentMethod === 'CASH') {
      await createSale('CASH');
    } else {
      await createSale(formData.paymentMethod);
    }
  };

  const handleClose = () => {
    setCart([]);
    setFormData({ paymentMethod: 'CASH', cashReceived: 0 });
    setSelectedBatchId('');
    setItemQuantity(1);
    setError('');
    setPaymentProcessing(false);
    onClose();
  };

  return (
    <Sheet open={isOpen} onOpenChange={handleClose}>
      <SheetContent
        side="right"
        className="w-full sm:w-[90vw] md:w-[85vw] lg:w-[80vw] flex flex-col max-h-screen overflow-y-auto"
      >
        <SheetHeader className="border-b pb-4">
          <SheetTitle className="text-2xl">New Sale</SheetTitle>
          <SheetDescription>Add items to cart and complete the sale transaction</SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          {error && (
            <Alert variant="destructive" className="mb-4 mx-4 mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-6 p-4">
            {/* Product Selection */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Add Items</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Select Product</Label>
                  <div className="flex gap-2">
                    <Select value={selectedBatchId} onValueChange={setSelectedBatchId}>
                      <SelectTrigger className="flex-1">
                        <SelectValue placeholder="Choose a product..." />
                      </SelectTrigger>
                      <SelectContent>
                        {isLoadingBatches ? (
                          <div className="p-4 text-center">
                            <Spinner className="h-4 w-4" />
                          </div>
                        ) : (
                          batches.map((batch) => (
                            <SelectItem key={batch.id} value={batch.id}>
                              {batch.drug?.brandName} ({batch.quantity} avail.) - ₹
                              {Number(batch.sellPrice).toFixed(2)}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex gap-2">
                  <div className="space-y-2 flex-1">
                    <Label className="text-sm font-medium">Quantity</Label>
                    <Input
                      type="number"
                      min="1"
                      value={itemQuantity}
                      onChange={(e) => setItemQuantity(parseInt(e.target.value) || 1)}
                      className="h-10"
                    />
                  </div>
                  <div className="pt-6">
                    <Button
                      type="button"
                      onClick={addToCart}
                      className="h-10 gap-2 bg-emerald-600 hover:bg-emerald-700"
                    >
                      <Plus className="h-4 w-4" />
                      Add to Cart
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Separator />

            {/* Cart Items */}
            <div className="space-y-3">
              <h3 className="font-semibold text-lg">Cart ({cart.length} items)</h3>
              {cart.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500 bg-gray-50 rounded-lg">
                  <ShoppingCart className="mb-2 h-12 w-12 text-gray-300" />
                  <p className="text-sm">Cart is empty. Add products to continue</p>
                </div>
              ) : (
                <ScrollArea className="h-[300px] border rounded-lg">
                  <div className="space-y-2 p-4">
                    {cart.map((item) => (
                      <div
                        key={item.batchId}
                        className="flex items-center justify-between gap-4 rounded-lg border bg-white p-4 hover:bg-gray-50 transition"
                      >
                        <div className="flex-1">
                          <p className="font-semibold text-gray-900">
                            {item.batch.drug?.brandName}
                          </p>
                          <p className="text-xs text-gray-500">
                            Batch: {item.batch.batchNumber} • ₹{Number(item.unitPrice).toFixed(2)}
                            /unit
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <Input
                            type="number"
                            min="1"
                            max={item.batch.quantity}
                            value={item.quantity}
                            onChange={(e) =>
                              updateCartQuantity(item.batchId, parseInt(e.target.value) || 0)
                            }
                            className="w-16 h-9 text-center text-sm"
                          />
                          <p className="w-24 text-right font-semibold text-emerald-600">
                            ₹{(item.unitPrice * item.quantity).toFixed(2)}
                          </p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeFromCart(item.batchId)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            <Separator />

            {/* Payment Section */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Payment Details</h3>

              <div className="space-y-2">
                <Label className="text-sm font-medium">Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(value) => setFormData({ ...formData, paymentMethod: value })}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paymentMethods.map((method) => (
                      <SelectItem key={method} value={method}>
                        {method}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {formData.paymentMethod === 'CASH' && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Cash Received</Label>
                  <Input
                    type="number"
                    min={getTotal()}
                    step="0.01"
                    value={formData.cashReceived || ''}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        cashReceived: parseFloat(e.target.value) || 0,
                      })
                    }
                    placeholder={`Min: ₹${getTotal().toFixed(2)}`}
                    className="h-10"
                  />
                </div>
              )}

              {/* Summary */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">₹{getTotal().toFixed(2)}</span>
                </div>
                {formData.paymentMethod === 'CASH' && formData.cashReceived >= getTotal() && (
                  <>
                    <div className="flex justify-between text-sm border-t pt-2">
                      <span className="text-gray-600">Cash Received</span>
                      <span className="font-medium">₹{formData.cashReceived.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm font-semibold text-emerald-600 border-t pt-2">
                      <span>Change</span>
                      <span>₹{getChangeGiven().toFixed(2)}</span>
                    </div>
                  </>
                )}
                {formData.paymentMethod !== 'CASH' && (
                  <div className="flex justify-between text-sm font-semibold text-emerald-600 border-t pt-2">
                    <span>Total Amount</span>
                    <span>₹{getTotal().toFixed(2)}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </form>

        <SheetFooter className="border-t bg-gray-50 p-4 gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting || paymentProcessing}
            className="flex-1"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              paymentProcessing ||
              cart.length === 0 ||
              (formData.paymentMethod === 'CASH' && formData.cashReceived < getTotal())
            }
            className="flex-1 gap-2 bg-emerald-600 hover:bg-emerald-700 h-10 text-base"
          >
            {isSubmitting || paymentProcessing ? (
              <>
                <Spinner className="h-4 w-4" />
                Processing...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Complete Sale (₹{getTotal().toFixed(2)})
              </>
            )}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
