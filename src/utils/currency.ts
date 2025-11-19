import { Product } from '../types';

export type Currency = 'THB' | 'RUB' | 'USD';

export const getPriceForCurrency = (product: Product, currency: Currency): number => {
  switch (currency) {
    case 'RUB':
      return product.price_rub || product.price || 0;
    case 'USD':
      return product.price_usd || product.price || 0;
    case 'THB':
    default:
      return product.price || 0;
  }
};

export const formatPrice = (
  priceThb: number | undefined | null,
  priceRub: number | undefined | null,
  priceUsd: number | undefined | null,
  currency: Currency
): string => {
  let price: number;
  let symbol: string;
  
  switch (currency) {
    case 'RUB':
      price = priceRub || priceThb || 0;
      symbol = '₽';
      break;
    case 'USD':
      price = priceUsd || priceThb || 0;
      symbol = '$';
      break;
    case 'THB':
    default:
      price = priceThb || 0;
      symbol = '฿';
      break;
  }
  
  return `${symbol}${price.toLocaleString('en-US', { 
    minimumFractionDigits: 0,
    maximumFractionDigits: 2 
  })}`;
};

export const getCurrencySymbol = (currency: Currency): string => {
  switch (currency) {
    case 'RUB':
      return '₽';
    case 'USD':
      return '$';
    case 'THB':
    default:
      return '฿';
  }
};