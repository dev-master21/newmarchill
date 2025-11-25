import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Currency = 'THB' | 'RUB' | 'USD';

interface CurrencyStore {
  currency: Currency;
  setCurrency: (currency: Currency) => void;
}

export const useCurrencyStore = create<CurrencyStore>()(
  persist(
    (set) => ({
      currency: 'THB',
      setCurrency: (currency: Currency) => set({ currency }),
    }),
    {
      name: 'currency-storage',
    }
  )
);