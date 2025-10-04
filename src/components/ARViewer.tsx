import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ARViewerProps {
  productName: string;
  modelUrl?: string;
  onStartAR?: () => void;
}

export const ARViewer = ({ productName, modelUrl, onStartAR }: ARViewerProps) => {
  const [isARSupported, setIsARSupported] = useState(true);

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
            <span className="ml-auto px-2 py-1 bg-secondary/20 text-secondary text-xs font-semibold rounded-full">
              BETA
            </span>
          </div>

          <div className="aspect-video bg-accent rounded-xl flex items-center justify-center relative overflow-hidden">
            {modelUrl ? (
              <div className="text-center space-y-4 p-8">
                <div className="w-20 h-20 rounded-full bg-secondary/20 flex items-center justify-center mx-auto">
                  <svg className="w-10 h-10 text-secondary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Ready for AR</p>
                  <p className="text-xs text-muted-foreground mt-1">Tap the button to view in your space</p>
                </div>
              </div>
            ) : (
              <div className="text-center space-y-3 p-8">
                <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <svg className="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                  </svg>
                </div>
                <p className="text-sm text-muted-foreground">
                  AR model will be available after generation
                </p>
              </div>
            )}
          </div>

          {isARSupported ? (
            <div className="space-y-3">
              <Button 
                variant="default" 
                className="w-full bg-secondary hover:bg-secondary/90"
                disabled={!modelUrl}
                onClick={onStartAR}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
                View in Your Space
              </Button>

              <div className="bg-accent rounded-lg p-4 space-y-2">
                <p className="text-xs font-semibold text-foreground flex items-center gap-2">
                  <svg className="w-4 h-4 text-secondary" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  How AR works:
                </p>
                <ul className="text-xs text-muted-foreground space-y-1 ml-6 list-disc">
                  <li>Point your camera at a flat surface</li>
                  <li>Move around to place the furniture</li>
                  <li>Take photos to share or save</li>
                  <li>Try different angles and positions</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" disabled={!modelUrl}>
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                  Share AR
                </Button>
                <Button variant="outline" size="sm" className="flex-1" disabled={!modelUrl}>
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
