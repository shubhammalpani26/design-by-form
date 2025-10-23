import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef } from "react";

// Extend the JSX types to include model-viewer
declare global {
  namespace JSX {
    interface IntrinsicElements {
      'model-viewer': React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          src?: string;
          alt?: string;
          'auto-rotate'?: boolean;
          'camera-controls'?: boolean;
          'shadow-intensity'?: string;
          loading?: string;
          'interaction-prompt'?: string;
          ar?: boolean;
          'ar-modes'?: string;
        },
        HTMLElement
      >;
    }
  }
}

interface ModelViewer3DProps {
  modelUrl?: string;
  productName: string;
}

export const ModelViewer3D = ({ modelUrl, productName }: ModelViewer3DProps) => {
  const modelViewerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    // Load model-viewer script if not already loaded
    const loadScript = async () => {
      if (!customElements.get('model-viewer')) {
        const script = document.createElement('script');
        script.type = 'module';
        script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
        document.head.appendChild(script);
        
        // Wait for script to load
        await new Promise((resolve) => {
          script.onload = resolve;
        });
      }
    };
    
    loadScript();
  }, []);

  return (
    <Card className="border-primary/20 shadow-medium h-full">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="space-y-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">3D Model Viewer</h3>
          </div>

          <div className="flex-1 bg-accent rounded-xl flex items-center justify-center relative overflow-hidden min-h-[500px]">
            {modelUrl ? (
              <model-viewer
                ref={modelViewerRef}
                src={modelUrl}
                alt={productName}
                auto-rotate
                camera-controls
                shadow-intensity="1"
                loading="eager"
                interaction-prompt="auto"
                ar
                ar-modes="webxr scene-viewer quick-look"
                style={{ 
                  width: '100%', 
                  height: '100%',
                  minHeight: '500px'
                }}
              />
            ) : (
              <div className="text-center space-y-3 p-8">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">
                  3D model will be generated
                </p>
              </div>
            )}
          </div>

          {modelUrl && (
            <div className="text-xs text-muted-foreground bg-accent rounded-lg p-3">
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Drag to rotate • Pinch to zoom • Double-click to reset
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
