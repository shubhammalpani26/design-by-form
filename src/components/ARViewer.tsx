import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState, useRef, useEffect, useCallback } from "react";
import { useToast } from "@/hooks/use-toast";
import { Move, RotateCw, ZoomIn, Loader2 } from "lucide-react";
import { processImageUrl } from "@/lib/backgroundRemoval";

interface ARViewerProps {
  productName: string;
  imageUrl?: string;
  modelUrl?: string;
  onStartAR?: () => void;
  roomImage?: File | null;
}

export const ARViewer = ({ productName, imageUrl, modelUrl, onStartAR, roomImage }: ARViewerProps) => {
  const [isARSupported, setIsARSupported] = useState(true);
  const [uploadedPhoto, setUploadedPhoto] = useState<string | null>(null);
  const [processedFurnitureUrl, setProcessedFurnitureUrl] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [furniturePosition, setFurniturePosition] = useState({ x: 50, y: 50 });
  const [furnitureScale, setFurnitureScale] = useState(50);
  const [furnitureRotation, setFurnitureRotation] = useState(0);
  const [furnitureLateralRotation, setFurnitureLateralRotation] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [proxiedModelUrl, setProxiedModelUrl] = useState<string | null>(null);
  const [isModelLoading, setIsModelLoading] = useState(false);
  const [viewerKey, setViewerKey] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerElementRef = useRef<HTMLElement | null>(null);
  const { toast } = useToast();

  // Track which URLs have been processed to prevent re-processing
  const [processedUrls, setProcessedUrls] = useState<Set<string>>(() => {
    try {
      const saved = sessionStorage.getItem('ar-processed-urls');
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  // Persist AR state in sessionStorage
  useEffect(() => {
    const savedState = sessionStorage.getItem('ar-viewer-state');
    if (savedState) {
      try {
        const state = JSON.parse(savedState);
        setFurniturePosition(state.position || { x: 50, y: 50 });
        setFurnitureScale(state.scale || 50);
        setFurnitureRotation(state.rotation || 0);
        setFurnitureLateralRotation(state.lateralRotation || 0);
        if (state.uploadedPhoto) {
          setUploadedPhoto(state.uploadedPhoto);
        }
        if (state.processedFurnitureUrl) {
          setProcessedFurnitureUrl(state.processedFurnitureUrl);
        }
      } catch (e) {
        console.error('Failed to restore AR state:', e);
      }
    }
  }, []);

  // Save state when it changes
  useEffect(() => {
    const state = {
      position: furniturePosition,
      scale: furnitureScale,
      rotation: furnitureRotation,
      lateralRotation: furnitureLateralRotation,
      uploadedPhoto,
      processedFurnitureUrl,
    };
    sessionStorage.setItem('ar-viewer-state', JSON.stringify(state));
  }, [furniturePosition, furnitureScale, furnitureRotation, furnitureLateralRotation, uploadedPhoto, processedFurnitureUrl]);

  // Create proxied URL for 3D model to avoid CORS issues
  useEffect(() => {
    if (modelUrl) {
      const proxyUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/proxy-3d-model?url=${encodeURIComponent(modelUrl)}`;
      setProxiedModelUrl(proxyUrl);
      setIsModelLoading(true);
      setViewerKey(k => k + 1); // Force remount
    } else {
      setProxiedModelUrl(null);
      setIsModelLoading(false);
    }
  }, [modelUrl]);

  // Handle model-viewer element via callback ref
  const handleViewerRef = useCallback((element: HTMLElement | null) => {
    viewerElementRef.current = element;
    
    if (!element || !proxiedModelUrl) return;
    
    console.log('🎯 AR: Setting up model-viewer element');
    
    const handleLoad = () => {
      console.log('✅ AR model-viewer loaded');
      setIsModelLoading(false);
    };

    const handleError = () => {
      console.error('❌ AR model-viewer failed to load');
      setIsModelLoading(false);
      toast({
        title: "Failed to load 3D model",
        description: "Using 2D image instead",
        variant: "destructive"
      });
    };

    // Check if already loaded
    const modelViewer = element as any;
    if (modelViewer.loaded) {
      handleLoad();
      return;
    }

    element.addEventListener('load', handleLoad);
    element.addEventListener('error', handleError);
  }, [proxiedModelUrl, toast]);

  useEffect(() => {
    // Load room image if provided (only if we don't already have one cached)
    if (roomImage && !uploadedPhoto) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedPhoto(reader.result as string);
      };
      reader.readAsDataURL(roomImage);
    }
  }, [roomImage]);

  useEffect(() => {
    // Use 3D model directly if available, otherwise process 2D image ONLY if room photo is uploaded
    const processFurniture = async () => {
      // If we have a 3D model URL, use it directly - no background removal needed
      if (modelUrl) {
        console.log('Using 3D model for AR preview (no background removal needed)');
        // For 3D models, we still need the 2D image for AR overlay display
        setProcessedFurnitureUrl(imageUrl || modelUrl);
        setIsProcessing(false);
        return;
      }
      
      // If we have an image URL but no room photo, just show the product image directly
      if (imageUrl && !uploadedPhoto) {
        console.log('No room photo - showing product image for reference');
        setProcessedFurnitureUrl(imageUrl);
        setIsProcessing(false);
        return;
      }
      
      // If no room photo uploaded yet and no image, nothing to process
      if (!uploadedPhoto || !imageUrl) {
        console.log('No room photo or image - waiting');
        setProcessedFurnitureUrl(imageUrl || null);
        setIsProcessing(false);
        return;
      }
      
      // Only run background removal if we have BOTH room photo AND image, but NO 3D model
      const urlToProcess = imageUrl;
      
      // Check cache first - see if we have the processed result stored
      const cacheKey = `ar-processed-${urlToProcess}`;
      const cachedResult = sessionStorage.getItem(cacheKey);
      
      if (cachedResult) {
        console.log('Using cached processed furniture image');
        setProcessedFurnitureUrl(cachedResult);
        setProcessedUrls(prev => new Set(prev).add(urlToProcess));
        return;
      }

      // Check if we've already processed this URL in this session
      if (processedUrls.has(urlToProcess)) {
        console.log('Already processed this URL in this session');
        return;
      }

      setIsProcessing(true);
      console.log('Starting background removal for:', urlToProcess);
      toast({
        title: "Removing background",
        description: "Using AI to remove background from the furniture. This may take a moment...",
      });
      
      try {
        const processed = await processImageUrl(urlToProcess);
        setProcessedFurnitureUrl(processed);
        
        // Save both the URL marker and the processed result
        sessionStorage.setItem(cacheKey, processed);
        setProcessedUrls(prev => {
          const newSet = new Set(prev).add(urlToProcess);
          sessionStorage.setItem('ar-processed-urls', JSON.stringify([...newSet]));
          console.log('Saved processed URL to cache:', urlToProcess);
          return newSet;
        });
        
        console.log('Background removed from furniture image using AI');
        toast({
          title: "Background removed!",
          description: "The furniture is now ready for AR preview.",
        });
      } catch (error) {
        console.error('Failed to remove background:', error);
        setProcessedFurnitureUrl(urlToProcess); // Fallback to original
        setProcessedUrls(prev => {
          const newSet = new Set(prev).add(urlToProcess);
          sessionStorage.setItem('ar-processed-urls', JSON.stringify([...newSet]));
          return newSet;
        });
        toast({
          title: "Background removal failed",
          description: "Using original image for AR preview.",
          variant: "destructive",
        });
      } finally {
        setIsProcessing(false);
      }
    };

    processFurniture();
  }, [imageUrl, modelUrl, uploadedPhoto]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload a photo smaller than 10MB",
          variant: "destructive",
        });
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        setUploadedPhoto(event.target?.result as string);
        toast({
          title: "Photo uploaded",
          description: "Now you can preview the furniture in your space",
        });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (uploadedPhoto && processedFurnitureUrl) {
      setIsDragging(true);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setFurniturePosition({ 
        x: Math.max(0, Math.min(100, x)), 
        y: Math.max(0, Math.min(100, y)) 
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Render model-viewer element for AR with improved controls
  const renderModelViewer = (inRoom: boolean = false) => {
    if (!proxiedModelUrl) return null;
    
    const style: React.CSSProperties = inRoom ? {
      width: '100%',
      height: '100%',
      background: 'transparent',
      touchAction: 'pan-y', // Allow vertical scroll but capture horizontal for rotation
    } : {
      width: '100%',
      height: '100%',
      minHeight: '250px',
      background: 'transparent'
    };
    
    // For in-room AR: static model that user can only rotate manually, no auto-spin
    // For standalone: auto-rotate showcase mode
    if (inRoom) {
      return (
        <>
          {isModelLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg z-10">
              <div className="text-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
                <p className="text-sm text-muted-foreground">Loading 3D model...</p>
              </div>
            </div>
          )}
          {/* @ts-ignore - model-viewer is a web component */}
          <model-viewer
            key={viewerKey}
            ref={handleViewerRef}
            src={proxiedModelUrl}
            alt={productName}
            camera-controls
            disable-zoom
            disable-pan
            disable-tap
            interaction-prompt="none"
            interpolation-decay="100"
            orbit-sensitivity="0.5"
            camera-orbit="0deg 75deg 105%"
            min-camera-orbit="auto 30deg auto"
            max-camera-orbit="auto 150deg auto"
            field-of-view="30deg"
            loading="eager"
            style={style}
          />
        </>
      );
    }
    
    return (
      <>
        {isModelLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-lg z-10">
            <div className="text-center space-y-2">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <p className="text-sm text-muted-foreground">Loading 3D model...</p>
            </div>
          </div>
        )}
        {/* @ts-ignore - model-viewer is a web component */}
        <model-viewer
          key={viewerKey}
          ref={handleViewerRef}
          src={proxiedModelUrl}
          alt={productName}
          auto-rotate
          camera-controls
          rotation-per-second="30deg"
          loading="eager"
          style={style}
        />
      </>
    );
  };

  return (
    <Card className="border-secondary/20 shadow-medium bg-secondary/5">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-secondary/20 flex items-center justify-center">
              <svg className="w-5 h-5 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-foreground">AR Preview</h3>
          </div>

          <div 
            ref={containerRef}
            className="w-full min-h-[350px] max-h-[55vh] bg-accent rounded-xl flex items-center justify-center relative overflow-visible cursor-move"
            style={{ perspective: '1000px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {uploadedPhoto && (processedFurnitureUrl || proxiedModelUrl) ? (
              <>
                <img 
                  src={uploadedPhoto} 
                  alt="Your space" 
                  className="w-full h-full object-cover"
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                />
                {isProcessing ? (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                    <div className="bg-white/90 rounded-lg p-4 text-center space-y-2">
                      <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
                      <div className="text-sm font-medium text-foreground">Removing background with AI...</div>
                      <div className="text-xs text-muted-foreground">This may take 10-30 seconds</div>
                    </div>
                  </div>
                ) : proxiedModelUrl ? (
                  // Use 3D model viewer for AR when model is available
                  <div
                    className="absolute pointer-events-auto rounded-lg"
                    style={{
                      left: `${Math.max(15, Math.min(85, furniturePosition.x))}%`,
                      top: `${Math.max(20, Math.min(80, furniturePosition.y))}%`,
                      transform: `translate(-50%, -50%) scale(${furnitureScale / 50})`,
                      width: '35%',
                      minWidth: '180px',
                      maxWidth: '280px',
                      height: '200px',
                      transition: isDragging ? 'none' : 'all 0.2s ease-out',
                      zIndex: 10,
                    }}
                  >
                    <div className="w-full h-full relative">
                      {renderModelViewer(true)}
                      {/* Visual boundary indicator */}
                      <div className="absolute inset-0 border-2 border-dashed border-primary/30 rounded-lg pointer-events-none opacity-0 hover:opacity-100 transition-opacity" />
                    </div>
                  </div>
                ) : (
                  <img
                    src={processedFurnitureUrl || ''}
                    alt={productName}
                    className="absolute pointer-events-none"
                    style={{
                      left: `${furniturePosition.x}%`,
                      top: `${furniturePosition.y}%`,
                      transform: `translate(-50%, -50%) scale(${furnitureScale / 50}) rotateZ(${furnitureRotation}deg) rotateY(${furnitureLateralRotation}deg)`,
                      width: '40%',
                      maxWidth: '300px',
                      transition: isDragging ? 'none' : 'transform 0.2s ease-out',
                      transformStyle: 'preserve-3d',
                      backfaceVisibility: 'visible'
                    }}
                  />
                )}
              </>
            ) : uploadedPhoto && (imageUrl || proxiedModelUrl) && !processedFurnitureUrl && !proxiedModelUrl ? (
              <>
                <img 
                  src={uploadedPhoto} 
                  alt="Your space" 
                  className="w-full h-full object-cover"
                  style={{ imageRendering: '-webkit-optimize-contrast' }}
                />
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm">
                  <div className="bg-white/90 rounded-lg p-4 text-center space-y-2">
                    <div className="w-8 h-8 border-4 border-secondary border-t-transparent rounded-full animate-spin mx-auto"></div>
                    <div className="text-sm font-medium text-foreground">Preparing AR Preview...</div>
                    <div className="text-xs text-muted-foreground">Removing background with AI</div>
                  </div>
                </div>
              </>
            ) : !uploadedPhoto && proxiedModelUrl ? (
              // Show 3D model preview without room
              <div className="relative w-full h-full flex items-center justify-center p-4">
                {renderModelViewer(false)}
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <p className="text-xs text-muted-foreground bg-background/80 inline-block px-3 py-1 rounded-full">
                    Upload a room photo below to see this in your space
                  </p>
                </div>
              </div>
            ) : !uploadedPhoto && imageUrl ? (
              // Show product preview without room - just the product image
              <div className="relative w-full h-full flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                  <img
                    src={imageUrl}
                    alt={productName}
                    className="max-w-[250px] max-h-[200px] object-contain mx-auto rounded-lg shadow-lg"
                  />
                  <div className="space-y-2">
                    <p className="text-sm text-muted-foreground">
                      Upload a photo of your room to see this {productName} in your space
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center p-8 space-y-4">
                <div className="w-16 h-16 rounded-full bg-secondary/20 flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">
                  Upload a photo of your room to preview {productName} in your space
                </p>
              </div>
            )}
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />

          {/* Control Panel - Show for both 2D and 3D models */}
          {uploadedPhoto && (processedFurnitureUrl || proxiedModelUrl) && (
            <div className="space-y-4 p-4 bg-accent/50 rounded-lg">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Move className="w-4 h-4" />
                Position Controls
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <ZoomIn className="w-3 h-3" />
                    Size
                  </label>
                  <Slider
                    value={[furnitureScale]}
                    min={20}
                    max={100}
                    step={1}
                    onValueChange={(value) => setFurnitureScale(value[0])}
                  />
                </div>
                
                {!proxiedModelUrl && (
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <RotateCw className="w-3 h-3" />
                      Rotation
                    </label>
                    <Slider
                      value={[furnitureRotation]}
                      min={-180}
                      max={180}
                      step={5}
                      onValueChange={(value) => setFurnitureRotation(value[0])}
                    />
                  </div>
                )}

                {proxiedModelUrl && (
                  <div className="space-y-2">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <RotateCw className="w-3 h-3" />
                      3D Controls
                    </label>
                    <p className="text-xs text-muted-foreground">
                      Drag on model to rotate
                    </p>
                  </div>
                )}
              </div>

              {!proxiedModelUrl && (
                <div className="space-y-2">
                  <label className="text-xs text-muted-foreground flex items-center gap-1">
                    <RotateCw className="w-3 h-3" />
                    Lateral Rotation (3D effect)
                  </label>
                  <Slider
                    value={[furnitureLateralRotation]}
                    min={-60}
                    max={60}
                    step={5}
                    onValueChange={(value) => setFurnitureLateralRotation(value[0])}
                  />
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                {proxiedModelUrl 
                  ? "Tip: Drag outside the model to move it, drag on the model to rotate it" 
                  : "Tip: Click and drag on the image to move the furniture"}
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="flex-1"
            >
              {uploadedPhoto ? 'Change Room Photo' : 'Upload Room Photo'}
            </Button>
            
            {uploadedPhoto && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setUploadedPhoto(null);
                  setFurniturePosition({ x: 50, y: 50 });
                  setFurnitureScale(50);
                  setFurnitureRotation(0);
                  setFurnitureLateralRotation(0);
                  sessionStorage.removeItem('ar-viewer-state');
                }}
                className="flex-1"
              >
                Clear Photo
              </Button>
            )}
          </div>

          <div className="text-xs text-muted-foreground bg-accent/50 p-3 rounded-lg">
            <p>
              <strong>How it works:</strong> Upload a photo of your room, then position the furniture using drag or controls.
              {proxiedModelUrl ? ' Rotate the 3D model with your mouse.' : ''}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
