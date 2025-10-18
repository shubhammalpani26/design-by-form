import { useEffect, useRef } from 'react';
import '@google/model-viewer';

declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': ModelViewerJSX & React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

interface ModelViewerJSX {
  src?: string;
  poster?: string;
  alt?: string;
  ar?: boolean;
  'ar-modes'?: string;
  'camera-controls'?: boolean;
  'auto-rotate'?: boolean;
  'shadow-intensity'?: string;
  'exposure'?: string;
  'environment-image'?: string;
  loading?: string;
  'reveal'?: string;
  style?: React.CSSProperties;
}

interface Model3DViewerProps {
  modelUrl: string;
  posterUrl?: string;
  alt?: string;
  enableAR?: boolean;
  autoRotate?: boolean;
  className?: string;
}

export const Model3DViewer = ({ 
  modelUrl, 
  posterUrl, 
  alt = "3D Model", 
  enableAR = true,
  autoRotate = false,
  className = ""
}: Model3DViewerProps) => {
  const viewerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Load the model-viewer polyfills if needed
    const script = document.createElement('script');
    script.type = 'module';
    script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
    
    if (!document.querySelector('script[src*="model-viewer"]')) {
      document.head.appendChild(script);
    }
  }, []);

  return (
    <model-viewer
      ref={viewerRef}
      src={modelUrl}
      poster={posterUrl}
      alt={alt}
      ar={enableAR}
      ar-modes="webxr scene-viewer quick-look"
      camera-controls
      auto-rotate={autoRotate}
      shadow-intensity="1"
      exposure="1"
      environment-image="neutral"
      loading="eager"
      reveal="auto"
      className={className}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '400px',
      }}
    />
  );
};
