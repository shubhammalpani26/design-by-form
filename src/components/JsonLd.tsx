import { useEffect } from 'react';

interface JsonLdProps {
  /** Stable id so we can swap the same script tag on route change */
  id: string;
  data: Record<string, any> | Record<string, any>[];
}

/**
 * Inject a JSON-LD <script> tag into <head>.
 * Used for SEO structured data (Product, Person, BreadcrumbList, etc).
 */
export const JsonLd = ({ id, data }: JsonLdProps) => {
  useEffect(() => {
    const scriptId = `jsonld-${id}`;
    let el = document.getElementById(scriptId) as HTMLScriptElement | null;
    if (!el) {
      el = document.createElement('script');
      el.type = 'application/ld+json';
      el.id = scriptId;
      document.head.appendChild(el);
    }
    el.text = JSON.stringify(data);

    return () => {
      const node = document.getElementById(scriptId);
      if (node) node.remove();
    };
  }, [id, data]);

  return null;
};
