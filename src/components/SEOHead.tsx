import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'product';
  author?: string;
  keywords?: string[];
  canonical?: string;
  noIndex?: boolean;
}

const SITE_URL = 'https://nyzora.ai';

export const getCanonicalUrl = (pathOverride?: string) => {
  const sourceUrl = new URL(pathOverride || `${window.location.pathname}${window.location.search}`, SITE_URL);
  const params = sourceUrl.searchParams;
  ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'fbclid', 'ref'].forEach((key) => params.delete(key));
  const query = params.toString();

  return `${SITE_URL}${sourceUrl.pathname.replace(/\/+$/, '') || '/'}${query ? `?${query}` : ''}`;
};

export const SEOHead = ({
  title,
  description,
  image = `${window.location.origin}/og-default.png`,
  url = window.location.href,
  type = 'website',
  author,
  keywords = [],
  canonical,
  noIndex = false,
}: SEOHeadProps) => {
  useEffect(() => {
    const canonicalUrl = canonical || getCanonicalUrl();

    // Update document title
    document.title = `${title} | Nyzora`;

    // Helper function to set or update meta tags
    const setMetaTag = (property: string, content: string, isName = false) => {
      const attribute = isName ? 'name' : 'property';
      let element = document.querySelector(`meta[${attribute}="${property}"]`);
      
      if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, property);
        document.head.appendChild(element);
      }
      
      element.setAttribute('content', content);
    };

    // Standard meta tags
    setMetaTag('description', description, true);
    if (keywords.length > 0) {
      setMetaTag('keywords', keywords.join(', '), true);
    }
    if (author) {
      setMetaTag('author', author, true);
    }

    // Open Graph meta tags (Facebook, LinkedIn, etc.)
    setMetaTag('og:title', title);
    setMetaTag('og:description', description);
    setMetaTag('og:image', image);
    setMetaTag('og:url', canonicalUrl);
    setMetaTag('og:type', type);
    setMetaTag('og:site_name', 'Nyzora');

    // Twitter Card meta tags
    setMetaTag('twitter:card', 'summary_large_image', true);
    setMetaTag('twitter:title', title, true);
    setMetaTag('twitter:description', description, true);
    setMetaTag('twitter:image', image, true);

    // Additional meta tags
    setMetaTag('robots', noIndex ? 'noindex, nofollow' : 'index, follow', true);
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0', true);

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', canonicalUrl);

  }, [title, description, image, url, type, author, keywords, canonical, noIndex]);

  return null; // This component doesn't render anything
};
