import { Card, CardContent } from "@/components/ui/card";
import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { ExternalLink, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

// Global flag to track if model-viewer script is loaded
let modelViewerScriptLoaded = false;

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
  const [loadingState, setLoadingState] = useState<LoadingState>('idle');
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [loadProgress, setLoadProgress] = useState(0);
  const [proxiedUrl, setProxiedUrl] = useState<string>("");
  const [modelFileSize, setModelFileSize] = useState<string>("");

  // Load model-viewer script
  useEffect(() => {
    const loadScript = async () => {
      // Check if already loaded globally
      if (modelViewerScriptLoaded || customElements.get('model-viewer')) {
        console.log('✅ model-viewer already loaded');
        setLoadingState('idle');
        return;
      }

      setLoadingState('loading-script');
      console.log('📦 Loading model-viewer script...');

      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/3.4.0/model-viewer.min.js';
      
      script.onload = () => {
        const checkElement = setInterval(() => {
          if (customElements.get('model-viewer')) {
            modelViewerScriptLoaded = true;
            console.log('✅ model-viewer script loaded successfully');
            setLoadingState('idle');
            clearInterval(checkElement);
          }
        }, 100);
        
        setTimeout(() => {
          clearInterval(checkElement);
          if (!modelViewerScriptLoaded) {
            console.error('❌ model-viewer custom element not defined after 5 seconds');
            setLoadingState('error');
            setErrorMessage('Failed to load 3D viewer library');
          }
        }, 5000);
      };
      
      script.onerror = () => {
        console.error('❌ Failed to load model-viewer script');
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

  // Setup model viewer event listeners and proxy if needed
  useEffect(() => {
    if (!modelUrl || loadingState === 'loading-script') return;

    const setupModel = async () => {
      console.log('🎨 Setting up 3D model:', modelUrl);
      setLoadingState('loading-model');
      setLoadProgress(0);
      setErrorMessage("");

      // Try to get file size
      try {
        const response = await fetch(modelUrl, { method: 'HEAD' });
        const size = response.headers.get('content-length');
        if (size) {
          const sizeInMB = (parseInt(size) / (1024 * 1024)).toFixed(2);
          setModelFileSize(`${sizeInMB} MB`);
          console.log(`📊 Model file size: ${sizeInMB} MB`);
        }
      } catch (e) {
        console.log('⚠️ Could not fetch file size:', e);
      }

      // Try direct URL first
      setProxiedUrl(modelUrl);
      
      const viewer = modelViewerRef.current;
      if (!viewer) return;

      const handleLoad = () => {
        console.log('✅ 3D model loaded successfully');
        setLoadingState('loaded');
        setLoadProgress(100);
      };

      const handleError = async (event: Event) => {
        console.error('❌ Direct model load failed:', event);
        console.log('🔄 Attempting to load via proxy...');
        
        // Try loading through proxy
        try {
          const { data, error } = await supabase.functions.invoke('proxy-3d-model', {
            body: { modelUrl }
          });

          if (error) throw error;

          if (data?.proxyUrl) {
            console.log('✅ Using proxy URL:', data.proxyUrl);
            setProxiedUrl(data.proxyUrl);
          } else {
            throw new Error('Proxy did not return a valid URL');
          }
        } catch (proxyError) {
          console.error('❌ Proxy failed:', proxyError);
          setLoadingState('error');
          const msg = 'Failed to load 3D model. The model file may have CORS restrictions.';
          setErrorMessage(msg);
          onError?.(msg);
        }
      };

      const handleProgress = (event: any) => {
        if (event.detail && event.detail.totalProgress !== undefined) {
          const progress = Math.round(event.detail.totalProgress * 100);
          setLoadProgress(progress);
          console.log(`📈 Loading progress: ${progress}%`);
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
    };

    setupModel();
  }, [modelUrl, loadingState, onError]);

  const handleOpenInNewTab = () => {
    if (modelUrl) {
      window.open(modelUrl, '_blank');
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
            <div className="flex-1 bg-accent rounded-xl flex items-center justify-center relative overflow-hidden min-h-[500px]">
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
                onClick={handleOpenInNewTab}
                className="gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View in New Tab
              </Button>
            )}
          </div>

          <div className="flex-1 bg-accent rounded-xl flex items-center justify-center relative overflow-hidden min-h-[500px]">
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
                    <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
                      Open Model URL
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
                    minHeight: '500px',
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
