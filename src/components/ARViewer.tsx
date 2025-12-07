import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { useState, useRef, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { Move, RotateCw, ZoomIn } from "lucide-react";
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
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
      // If we have an image URL but no room photo, just show the product image directly
      if ((imageUrl || modelUrl) && !uploadedPhoto) {
        console.log('No room photo - showing product image for reference');
        setProcessedFurnitureUrl(imageUrl || null);
        setIsProcessing(false);
        return;
      }
      
      // If no room photo uploaded yet, nothing to process
      if (!uploadedPhoto) {
        console.log('No room photo uploaded - waiting for upload');
        setProcessedFurnitureUrl(null);
        setIsProcessing(false);
        return;
      }
      
      // Fall back to 2D image with background removal
      const urlToProcess = imageUrl;
      if (urlToProcess) {
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
          // If it's in processedUrls but not in cache, we need to use the current processedFurnitureUrl
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
            description: "Using original image. Background may be visible in AR view.",
            variant: "destructive",
          });
        } finally {
          setIsProcessing(false);
        }
      } else {
        setProcessedFurnitureUrl(null);
      }
    };

    // Always prefer 3D model if available
    // Process when URLs change or when room photo is uploaded
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
            className="w-full min-h-[350px] max-h-[55vh] bg-accent rounded-xl flex items-center justify-center relative overflow-hidden cursor-move"
            style={{ perspective: '1000px' }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {uploadedPhoto && processedFurnitureUrl ? (
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
                ) : (
                  <img
                    src={processedFurnitureUrl}
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
            ) : uploadedPhoto && (imageUrl || modelUrl) && !processedFurnitureUrl ? (
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
            ) : !uploadedPhoto && (imageUrl || modelUrl) ? (
              // Show product preview without room - just the product image
              <div className="relative w-full h-full flex items-center justify-center p-8">
                <div className="text-center space-y-4">
                  <img
                    src={imageUrl || ''}
                    alt={productName}
                    className="max-w-[250px] max-h-[200px] object-contain mx-auto rounded-lg shadow-lg"
                  />
                  <div>
                    <p className="text-sm font-medium text-foreground">{productName}</p>
                    <p className="text-xs text-muted-foreground mt-1">Upload a room photo below to see this in your space</p>
                  </div>
                </div>
              </div>
            ) : !imageUrl && !modelUrl ? (
              <div className="text-center space-y-3 p-8">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">AR Preview</p>
                  <p className="text-xs text-muted-foreground mt-2">Generate a design first, then upload a room photo</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3 p-8">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Ready for AR!</p>
                  <p className="text-xs text-muted-foreground mt-1">Processing...</p>
                </div>
              </div>
            )}
          </div>

          {uploadedPhoto && processedFurnitureUrl && (
            <div className="space-y-3 p-4 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Move className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground w-20 flex-shrink-0">Position</span>
                <p className="text-xs text-muted-foreground">Drag furniture to move</p>
              </div>
              
              <div className="flex items-center gap-3">
                <ZoomIn className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground w-20 flex-shrink-0">Scale</span>
                <Slider
                  value={[furnitureScale]}
                  onValueChange={(value) => setFurnitureScale(value[0])}
                  min={20}
                  max={100}
                  step={1}
                  className="flex-1"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <RotateCw className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                <span className="text-sm text-muted-foreground w-20 flex-shrink-0">Spin</span>
                <Slider
                  value={[furnitureRotation]}
                  onValueChange={(value) => setFurnitureRotation(value[0])}
                  min={0}
                  max={360}
                  step={1}
                  className="flex-1"
                />
              </div>
              
              <div className="flex items-center gap-3">
                <svg className="h-4 w-4 text-muted-foreground flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                </svg>
                <span className="text-sm text-muted-foreground w-20 flex-shrink-0">Tilt</span>
                <Slider
                  value={[furnitureLateralRotation]}
                  onValueChange={(value) => setFurnitureLateralRotation(value[0])}
                  min={-180}
                  max={180}
                  step={1}
                  className="flex-1"
                />
              </div>
            </div>
          )}

          {isARSupported ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <Button 
                  variant="default" 
                  className="bg-secondary hover:bg-secondary/90"
                  disabled={!imageUrl && !modelUrl}
                  onClick={onStartAR}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  Live AR
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={!imageUrl && !modelUrl}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Upload Photo
                </Button>
              </div>
              <input 
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handlePhotoUpload}
              />

              <div className="bg-accent rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <svg className="w-4 h-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  How AR works:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>AI removes background from furniture automatically</li>
                  <li>Upload a photo of your space</li>
                  <li>Drag to position the furniture</li>
                  <li>Use sliders to scale and rotate</li>
                  <li>Visualize before ordering</li>
                </ul>
                {!modelUrl && (
                  <p className="text-xs text-amber-600 mt-2 flex items-start gap-1">
                    <svg className="w-3 h-3 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                    <span>3D view unavailable. Using high-quality 2D AR with AI background removal.</span>
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" disabled={!imageUrl && !modelUrl}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share AR
                </Button>
                <Button variant="outline" size="sm" className="flex-1" disabled={!imageUrl && !modelUrl}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  Take Photo
                </Button>
              </div>
            </div>
          ) : (
            <div className="bg-accent rounded-lg p-4 text-center">
              <p className="text-sm text-muted-foreground">
                AR is not supported on this device. Try opening this page on a mobile device with AR capabilities.
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};