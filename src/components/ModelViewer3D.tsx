import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Global flag to track if model-viewer script is loaded
let modelViewerScriptLoaded = false;

// Global cache for loaded models - persists across component mounts/unmounts
const loadedModelsCache = new Map<string, string>();

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
  onError?: (error: string) => void;
}

type LoadingState = 'idle' | 'loading-script' | 'loading-model' | 'loaded' | 'error';

export const ModelViewer3D = ({ modelUrl, productName, onError }: ModelViewer3DProps) => {
  const modelViewerRef = useRef<HTMLElement>(null);
  
  // Initialize from cache if available to prevent flashing/reloading
  const cachedUrl = modelUrl ? loadedModelsCache.get(modelUrl) : undefined;
  const [loadingState, setLoadingState] = useState<LoadingState>(() => {
    return cachedUrl ? 'loaded' : 'idle';
  });
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loadProgress, setLoadProgress] = useState(cachedUrl ? 100 : 0);
  const [proxiedUrl, setProxiedUrl] = useState<string>(() => {
    return cachedUrl || "";
  });
  const [modelFileSize, setModelFileSize] = useState<string>("");

  // Load model-viewer script
  useEffect(() => {
    const loadScript = async () => {
      // Check if already loaded globally
      if (modelViewerScriptLoaded || customElements.get('model-viewer')) {
        setLoadingState('idle');
        return;
      }

      setLoadingState('loading-script');

      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
      
      script.onload = () => {
        const checkElement = setInterval(() => {
          if (customElements.get('model-viewer')) {
            modelViewerScriptLoaded = true;
            setLoadingState('idle');
            clearInterval(checkElement);
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkElement);
          if (!modelViewerScriptLoaded) {
            setLoadingState('error');
            setErrorMessage('Failed to load 3D viewer library');
          }
        }, 5000);
      };
      
      script.onerror = () => {
        setLoadingState('error');
        setErrorMessage('Failed to load 3D viewer library');
      };
      
      document.head.appendChild(script);

      return () => {
        // Cleanup is handled globally, so we don't remove the script
      };
    };
    
    loadScript();
  }, []);

  // Setup model viewer - always use proxy to avoid CORS issues
  useEffect(() => {
    if (!modelUrl || loadingState === 'loading-script') {
      return;
    }
    
    // Skip if already loaded (states initialized from cache on mount)
    if (loadingState === 'loaded' && proxiedUrl) {
      return;
    }
    
    // Skip if in cache (shouldn't happen as states are initialized from cache)
    const cachedUrl = loadedModelsCache.get(modelUrl);
    if (cachedUrl) {
      setProxiedUrl(cachedUrl);
      setLoadingState('loaded');
      setLoadProgress(100);
      setErrorMessage("");
      return;
    }

    const setupModel = async () => {
      setLoadingState('loading-model');
      setLoadProgress(0);
      setErrorMessage("");

      // Always use proxy to avoid CORS issues with external GLB files
      
      try {
        // Build proxy URL - the edge function will fetch and serve the GLB with CORS headers
        const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-3d-model?url=${encodeURIComponent(modelUrl)}`;
        setProxiedUrl(proxyUrl);
        
        const viewer = modelViewerRef.current;
        if (!viewer) return;

        const handleLoad = () => {
          loadedModelsCache.set(modelUrl, proxyUrl); // Cache this model with its proxy URL
          setLoadingState('loaded');
          setLoadProgress(100);
        };

        const handleError = async (event: Event) => {
          console.error('❌ Model load failed:', event);
          setLoadingState('error');
          const msg = 'Failed to load 3D model. Please try again or contact support.';
          setErrorMessage(msg);
          onError?.(msg);
        };

        const handleProgress = (event: any) => {
          if (event.detail && event.detail.totalProgress !== undefined) {
            const progress = Math.round(event.detail.totalProgress * 100);
            setLoadProgress(progress);
          }
        };

        viewer.addEventListener('load', handleLoad);
        viewer.addEventListener('error', handleError);
        viewer.addEventListener('progress', handleProgress);

        return () => {
          viewer.removeEventListener('load', handleLoad);
          viewer.removeEventListener('error', handleError);
          viewer.removeEventListener('progress', handleProgress);
        };
      } catch (error) {
        console.error('Error setting up 3D model:', error);
        setLoadingState('error');
        const msg = 'Failed to setup 3D viewer. Please try again.';
        setErrorMessage(msg);
        onError?.(msg);
      }
    };

    setupModel();
  }, [modelUrl, onError]);

  const handleDownloadModel = () => {
    if (modelUrl) {
      // Create a download link
      const link = document.createElement('a');
      link.href = modelUrl;
      link.download = `${productName.replace(/\s+/g, '_')}_3D_Model.glb`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const handleTestSampleModel = () => {
    // Use a known-good sample GLB from the internet
    setProxiedUrl('https://modelviewer.dev/shared-assets/models/Astronaut.glb');
  };

  if (loadingState === 'loading-script') {
    return (
      <Card className="border-primary/20 shadow-medium h-full">
        <CardContent className="p-6 h-full flex flex-col">
          <div className="space-y-4 flex-1 flex flex-col">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-foreground">3D Model Viewer</h3>
            </div>
            <div className="flex-1 bg-accent rounded-xl flex items-center justify-center relative overflow-hidden min-h-[400px] max-h-[500px]">
              <div className="text-center space-y-3 p-8">
                <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                <p className="text-sm text-muted-foreground">Loading 3D viewer library...</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-primary/20 shadow-medium h-full">
      <CardContent className="p-6 h-full flex flex-col">
        <div className="space-y-4 flex-1 flex flex-col">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">3D Model Viewer</h3>
            {modelUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadModel}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Download 3D Model
              </Button>
            )}
          </div>

          <div className="flex-1 bg-accent rounded-xl flex items-center justify-center relative overflow-hidden min-h-[400px] max-h-[500px]">
            {loadingState === 'error' ? (
              <div className="text-center space-y-4 p-8 max-w-md">
                <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mx-auto">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <div className="space-y-2">
                  <p className="text-sm font-medium text-destructive">{errorMessage}</p>
                  <p className="text-xs text-muted-foreground">
                    The 3D model could not be loaded. This may be due to CORS restrictions or the model file format.
                  </p>
                </div>
                <div className="flex gap-2 justify-center">
                  {modelUrl && (
                    <Button variant="outline" size="sm" onClick={handleDownloadModel}>
                      Download Model
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={handleTestSampleModel}>
                    Test Sample Model
                  </Button>
                </div>
              </div>
            ) : !proxiedUrl ? (
              <div className="text-center space-y-3 p-8">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">
                  3D model will be generated
                </p>
                <Button variant="outline" size="sm" onClick={handleTestSampleModel}>
                  Test with Sample Model
                </Button>
              </div>
            ) : (
              <>
                <model-viewer
                  ref={modelViewerRef}
                  src={proxiedUrl}
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
                    maxHeight: '500px',
                    backgroundColor: 'transparent'
                  }}
                />
                {loadingState === 'loading-model' && loadProgress < 100 && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center">
                    <div className="text-center space-y-3">
                      <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto" />
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-foreground">Loading 3D model...</p>
                        <p className="text-xs text-muted-foreground">{loadProgress}%</p>
                        {modelFileSize && (
                          <p className="text-xs text-muted-foreground">{modelFileSize}</p>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {proxiedUrl && loadingState === 'loaded' && (
            <div className="text-xs text-muted-foreground bg-accent rounded-lg p-3">
              <p className="flex items-center gap-2">
                <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                Drag to rotate • Pinch to zoom • Double-click to reset
              </p>
            </div>
          )}

          {modelUrl && loadingState !== 'error' && (
            <div className="text-xs text-muted-foreground">
              <details className="cursor-pointer">
                <summary className="hover:text-foreground transition-colors">Debug Info</summary>
                <div className="mt-2 space-y-1 font-mono text-[10px] bg-muted p-2 rounded">
                  <p><strong>Status:</strong> {loadingState}</p>
                  <p><strong>Progress:</strong> {loadProgress}%</p>
                  {modelFileSize && <p><strong>Size:</strong> {modelFileSize}</p>}
                  <p className="break-all"><strong>URL:</strong> {modelUrl}</p>
                  {proxiedUrl !== modelUrl && (
                    <p className="text-primary"><strong>Using proxy:</strong> Yes</p>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
