import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Currency mapping by country
const currencyByCountry: Record<string, string> = {
  'US': 'USD', 'GB': 'GBP', 'EU': 'EUR', 'IN': 'INR',
  'AU': 'AUD', 'CA': 'CAD', 'JP': 'JPY', 'CN': 'CNY',
  'SG': 'SGD', 'AE': 'AED', 'SA': 'SAR', 'ZA': 'ZAR',
  'BR': 'BRL', 'MX': 'MXN', 'KR': 'KRW', 'CH': 'CHF',
  'SE': 'SEK', 'NO': 'NOK', 'DK': 'DKK', 'NZ': 'NZD',
  'HK': 'HKD', 'TH': 'THB', 'MY': 'MYR', 'ID': 'IDR',
  'PH': 'PHP', 'VN': 'VND', 'PL': 'PLN', 'TR': 'TRY',
  'RU': 'RUB', 'IL': 'ILS', 'EG': 'EGP', 'NG': 'NGN',
  'KE': 'KES', 'AR': 'ARS', 'CL': 'CLP', 'CO': 'COP',
  'PE': 'PEN', 'BD': 'BDT', 'PK': 'PKR', 'LK': 'LKR',
  'NP': 'NPR', 'MM': 'MMK', 'KH': 'KHR', 'LA': 'LAK'
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get IP from request header (Cloudflare/proxy adds this)
    const ip = req.headers.get('cf-connecting-ip') || 
               req.headers.get('x-forwarded-for')?.split(',')[0] ||
               req.headers.get('x-real-ip') ||
               '8.8.8.8'; // Fallback for local dev

    console.log('Detecting location for IP:', ip);

    // Use free IP geolocation API (ipapi.co has 1000 free requests/day)
    const response = await fetch(`https://ipapi.co/${ip}/json/`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch location data');
    }

    const data = await response.json();
    console.log('Location data:', data);

    const countryCode = data.country_code || 'IN';
    const currency = currencyByCountry[countryCode] || 'INR';
    
    return new Response(
      JSON.stringify({ 
        countryCode,
        country: data.country_name || 'India',
        currency,
        city: data.city || 'Unknown',
        region: data.region || 'Unknown'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in detect-location:', error);
    
    // Return default location on error
    return new Response(
      JSON.stringify({ 
        countryCode: 'IN',
        country: 'India',
        currency: 'INR',
        city: 'Unknown',
        region: 'Unknown',
        error: 'Failed to detect location, using default'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});