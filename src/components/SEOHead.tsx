import { useEffect } from 'react';

interface SEOHeadProps {
  title: string;
  description: string;
  image?: string;
  url?: string;
  type?: 'website' | 'article' | 'profile' | 'product';
  author?: string;
  keywords?: string[];
}

export const SEOHead = ({
  title,
  description,
  image = `${window.location.origin}/og-default.png`,
  url = window.location.href,
  type = 'website',
  author,
  keywords = [],
}: SEOHeadProps) => {
  useEffect(() => {
    // Update document title
    document.title = `${title} | Forma`;

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
    setMetaTag('og:url', url);
    setMetaTag('og:type', type);
    setMetaTag('og:site_name', 'Forma');

    // Twitter Card meta tags
    setMetaTag('twitter:card', 'summary_large_image', true);
    setMetaTag('twitter:title', title, true);
    setMetaTag('twitter:description', description, true);
    setMetaTag('twitter:image', image, true);

    // Additional meta tags
    setMetaTag('robots', 'index, follow', true);
    setMetaTag('viewport', 'width=device-width, initial-scale=1.0', true);

    // Canonical URL
    let canonicalLink = document.querySelector('link[rel="canonical"]');
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.setAttribute('rel', 'canonical');
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.setAttribute('href', url);

  }, [title, description, image, url, type, author, keywords]);

  return null; // This component doesn't render anything
};
