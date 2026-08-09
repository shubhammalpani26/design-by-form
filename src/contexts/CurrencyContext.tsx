import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface CurrencyContextType {
  currency: string;
  setCurrency: (currency: string) => void;
  exchangeRate: number;
  convertPrice: (priceInINR: number) => number;
  formatPrice: (priceInINR: number) => string;
  isLoading: boolean;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

const currencySymbols: Record<string, string> = {
  'INR': '₹',
  'USD': '$',
  'EUR': '€',
  'GBP': '£',
  'AUD': 'A$',
  'CAD': 'C$',
  'JPY': '¥',
  'CNY': '¥',
  'SGD': 'S$',
  'AED': 'د.إ',
  'SAR': 'ر.س',
  'ZAR': 'R',
  'BRL': 'R$',
  'MXN': 'MX$',
  'KRW': '₩',
  'CHF': 'CHF',
  'SEK': 'kr',
  'NOK': 'kr',
  'DKK': 'kr',
  'NZD': 'NZ$',
  'HKD': 'HK$',
  'THB': '฿',
  'MYR': 'RM',
  'IDR': 'Rp',
  'PHP': '₱',
  'VND': '₫',
  'PLN': 'zł',
  'TRY': '₺',
  'RUB': '₽',
  'ILS': '₪',
  'EGP': 'E£',
  'NGN': '₦',
  'KES': 'KSh',
  'ARS': '$',
  'CLP': '$',
  'COP': '$',
  'PEN': 'S/',
  'BDT': '৳',
  'PKR': '₨',
  'LKR': 'Rs',
  'NPR': 'Rs',
  'MMK': 'K',
  'KHR': '៛',
  'LAK': '₭'
};

export const CurrencyProvider = ({ children }: { children: ReactNode }) => {
  // US-first: default to USD unless the visitor is detected in India
  const [currency, setCurrency] = useState<string>('USD');
  // Conservative INR→USD fallback so prices never render as raw rupee numbers
  const FALLBACK_USD_RATE = 0.0115;
  const [exchangeRate, setExchangeRate] = useState<number>(FALLBACK_USD_RATE);
  const [isLoading, setIsLoading] = useState(true);

  // Detect user location and set currency
  useEffect(() => {
    detectLocationAndSetCurrency();
  }, []);

  // Fetch exchange rate when currency changes
  useEffect(() => {
    if (currency === 'INR') {
      setExchangeRate(1);
      setIsLoading(false);
      return;
    }
    fetchExchangeRate(currency);
  }, [currency]);

  const detectLocationAndSetCurrency = async () => {
    try {
      const savedCurrency = localStorage.getItem('preferredCurrency');
      if (savedCurrency) {
        setCurrency(savedCurrency);
        return;
      }

      const { data, error } = await supabase.functions.invoke('detect-location');
      
      if (error) throw error;
      
      if (data?.currency) {
        setCurrency(data.currency);
        console.log('Detected currency:', data.currency, 'for country:', data.country);
      } else {
        setCurrency('USD');
      }
    } catch (error) {
      console.error('Error detecting location:', error);
      setCurrency('USD');
    }
  };

  const fetchExchangeRate = async (targetCurrency: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('get-exchange-rates', {
        body: { targetCurrency }
      });

      if (error) throw error;

      if (data?.rate) {
        setExchangeRate(data.rate);
        console.log(`Exchange rate INR to ${targetCurrency}:`, data.rate, data.fromCache ? '(cached)' : '(fresh)');
      }
    } catch (error) {
      console.error('Error fetching exchange rate:', error);
      setExchangeRate(targetCurrency === 'USD' ? FALLBACK_USD_RATE : 1);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSetCurrency = (newCurrency: string) => {
    setCurrency(newCurrency);
    localStorage.setItem('preferredCurrency', newCurrency);
  };

  const convertPrice = (priceInINR: number): number => {
    return priceInINR * exchangeRate;
  };

  const formatPrice = (priceInINR: number): string => {
    const converted = convertPrice(priceInINR);
    const symbol = currencySymbols[currency] || currency;
    
    // Format with appropriate decimals
    const formatted = currency === 'JPY' || currency === 'KRW' || currency === 'VND'
      ? Math.round(converted).toLocaleString()
      : converted.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    
    return `${symbol}${formatted}`;
  };

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency: handleSetCurrency,
        exchangeRate,
        convertPrice,
        formatPrice,
        isLoading
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = () => {
  const context = useContext(CurrencyContext);
  if (context === undefined) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};