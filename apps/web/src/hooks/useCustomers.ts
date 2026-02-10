import { useState, useEffect, useCallback } from 'react';
import {
  customersApi,
  Customer,
  CustomerListParams,
  CreateCustomerData,
  UpdateCustomerData,
} from '../api/customers.api';

interface UseCustomersState {
  customers: Customer[];
  loading: boolean;
  error: string | null;
  page: number;
  totalPages: number;
  total: number;
}

export function useCustomers(initialParams: CustomerListParams = {}) {
  const [state, setState] = useState<UseCustomersState>({
    customers: [],
    loading: true,
    error: null,
    page: 1,
    totalPages: 1,
    total: 0,
  });

  const [params, setParams] = useState<CustomerListParams>({
    page: 1,
    limit: 20,
    sortBy: 'created_at',
    sortOrder: 'desc',
    ...initialParams,
  });

  const fetchCustomers = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));

    try {
      const response = await customersApi.getAll(params);
      setState({
        customers: response.data,
        loading: false,
        error: null,
        page: response.meta?.page || 1,
        totalPages: response.meta?.totalPages || 1,
        total: response.meta?.total || 0,
      });
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : 'Bir hata olustu',
      }));
    }
  }, [params]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const setPage = (page: number) => {
    setParams((prev) => ({ ...prev, page }));
  };

  const setSearch = (search: string) => {
    setParams((prev) => ({ ...prev, search, page: 1 }));
  };

  const setSort = (sortBy: string, sortOrder: 'asc' | 'desc') => {
    setParams((prev) => ({ ...prev, sortBy, sortOrder }));
  };

  const createCustomer = async (data: CreateCustomerData) => {
    const response = await customersApi.create(data);
    await fetchCustomers();
    return response.data;
  };

  const updateCustomer = async (id: string, data: UpdateCustomerData) => {
    const response = await customersApi.update(id, data);
    await fetchCustomers();
    return response.data;
  };

  const deleteCustomer = async (id: string) => {
    await customersApi.delete(id);
    await fetchCustomers();
  };

  return {
    ...state,
    params,
    setPage,
    setSearch,
    setSort,
    refetch: fetchCustomers,
    createCustomer,
    updateCustomer,
    deleteCustomer,
  };
}
