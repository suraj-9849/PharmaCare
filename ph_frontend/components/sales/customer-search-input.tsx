'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { Plus, User, X, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';
import { apiClient } from '@/lib/api-client';
import { Customer, ApiResponse } from '@/lib/types';

interface CustomerSearchInputProps {
  value: string | null;
  onChange: (customerId: string | null, customerName?: string) => void;
}

export function CustomerSearchInput({ onChange }: CustomerSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Quick create form state
  const [quickCreateData, setQuickCreateData] = useState({
    name: '',
    phone: '',
    email: '',
  });

  // Search for customers
  const searchCustomers = useCallback(async (query: string) => {
    if (!query || query.trim().length < 2) {
      setCustomers([]);
      setShowDropdown(false);
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.get<ApiResponse<Customer[]>>(
        `/customers/search?q=${encodeURIComponent(query)}`
      );
      setCustomers(response.data || []);
      setShowDropdown(true);
    } catch (error) {
      console.error('Failed to search customers:', error);
      setCustomers([]);
      setShowDropdown(false);
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (searchQuery && !selectedCustomer) {
      searchTimeoutRef.current = setTimeout(() => {
        searchCustomers(searchQuery);
      }, 300);
    } else if (!searchQuery) {
      setCustomers([]);
      setShowDropdown(false);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [searchQuery, searchCustomers, selectedCustomer]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
        setShowQuickCreate(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Handle customer selection
  const handleSelectCustomer = (customer: Customer) => {
    setSelectedCustomer(customer);
    onChange(customer.id, customer.name);
    setSearchQuery('');
    setShowDropdown(false);
    setShowQuickCreate(false);
  };

  // Handle clear selection
  const handleClear = () => {
    setSelectedCustomer(null);
    onChange(null);
    setSearchQuery('');
    setShowQuickCreate(false);
    setShowDropdown(false);
  };

  // Handle quick create
  const handleQuickCreate = async () => {
    if (!quickCreateData.name.trim()) {
      return;
    }

    try {
      const response = await apiClient.post<Customer>('/customers', {
        name: quickCreateData.name.trim(),
        phone: quickCreateData.phone.trim() || undefined,
        email: quickCreateData.email.trim() || undefined,
      });

      const newCustomer = response.data;
      if (newCustomer) {
        setSelectedCustomer(newCustomer);
        onChange(newCustomer.id, newCustomer.name);
        setShowQuickCreate(false);
        setShowDropdown(false);
        setQuickCreateData({ name: '', phone: '', email: '' });
        setSearchQuery('');
      }
    } catch (error) {
      console.error('Failed to create customer:', error);
    }
  };

  // Pre-fill quick create form with search query
  const handleShowQuickCreate = () => {
    setQuickCreateData({
      name: searchQuery,
      phone: '',
      email: '',
    });
    setShowQuickCreate(true);
  };

  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor="customer-search">
        Customer <span className="text-muted-foreground text-xs">(Optional)</span>
      </Label>

      {selectedCustomer ? (
        <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/50">
          <User className="h-4 w-4 text-muted-foreground" />
          <div className="flex-1">
            <p className="font-medium">{selectedCustomer.name}</p>
            {(selectedCustomer.phone || selectedCustomer.email) && (
              <p className="text-sm text-muted-foreground">
                {selectedCustomer.phone && selectedCustomer.phone}
                {selectedCustomer.phone && selectedCustomer.email && ' • '}
                {selectedCustomer.email && selectedCustomer.email}
              </p>
            )}
          </div>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleClear}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              id="customer-search"
              type="text"
              placeholder="Search by name, phone, or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => {
                if (searchQuery && customers.length > 0) {
                  setShowDropdown(true);
                }
              }}
              className="pl-10"
            />
            {loading && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2">
                <Spinner className="h-4 w-4" />
              </div>
            )}
          </div>

          {/* Dropdown */}
          {(showDropdown || showQuickCreate) && (
            <div
              ref={dropdownRef}
              className="absolute z-50 w-full mt-1 bg-white border rounded-md shadow-lg max-h-[400px] overflow-y-auto"
            >
              {!showQuickCreate ? (
                <div>
                  {loading ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Searching...
                    </div>
                  ) : customers.length > 0 ? (
                    <>
                      <div className="p-2 text-xs font-semibold text-muted-foreground border-b">
                        Existing Customers
                      </div>
                      {customers.map((customer) => (
                        <button
                          key={customer.id}
                          type="button"
                          onClick={() => handleSelectCustomer(customer)}
                          className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-b last:border-b-0"
                        >
                          <div className="flex flex-col">
                            <span className="font-medium">{customer.name}</span>
                            {(customer.phone || customer.email) && (
                              <span className="text-xs text-muted-foreground mt-0.5">
                                {customer.phone && customer.phone}
                                {customer.phone && customer.email && ' • '}
                                {customer.email && customer.email}
                              </span>
                            )}
                          </div>
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={handleShowQuickCreate}
                        className="w-full text-left px-4 py-3 hover:bg-muted transition-colors border-t flex items-center gap-2 text-sm font-medium"
                      >
                        <Plus className="h-4 w-4" />
                        Create new customer
                      </button>
                    </>
                  ) : searchQuery.length >= 2 ? (
                    <div className="p-4">
                      <p className="text-sm text-muted-foreground mb-3 text-center">
                        No customers found
                      </p>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={handleShowQuickCreate}
                        className="w-full"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create new customer
                      </Button>
                    </div>
                  ) : (
                    <div className="p-4 text-center text-sm text-muted-foreground">
                      Type at least 2 characters to search
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-sm">Create New Customer</h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowQuickCreate(false)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label htmlFor="quick-name" className="text-xs">
                        Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="quick-name"
                        value={quickCreateData.name}
                        onChange={(e) =>
                          setQuickCreateData({ ...quickCreateData, name: e.target.value })
                        }
                        placeholder="Customer name"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="quick-phone" className="text-xs">
                        Phone
                      </Label>
                      <Input
                        id="quick-phone"
                        value={quickCreateData.phone}
                        onChange={(e) =>
                          setQuickCreateData({ ...quickCreateData, phone: e.target.value })
                        }
                        placeholder="Phone number"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="quick-email" className="text-xs">
                        Email
                      </Label>
                      <Input
                        id="quick-email"
                        type="email"
                        value={quickCreateData.email}
                        onChange={(e) =>
                          setQuickCreateData({ ...quickCreateData, email: e.target.value })
                        }
                        placeholder="Email address"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      type="button"
                      onClick={handleQuickCreate}
                      disabled={!quickCreateData.name.trim()}
                      className="flex-1"
                      size="sm"
                    >
                      Create
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowQuickCreate(false)}
                      className="flex-1"
                      size="sm"
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {!selectedCustomer && (
        <p className="text-xs text-muted-foreground">Leave empty for walk-in customer</p>
      )}
    </div>
  );
}
