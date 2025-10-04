import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface ModelViewer3DProps {
  modelUrl?: string;
  productName: string;
}

export const ModelViewer3D = ({ modelUrl, productName }: ModelViewer3DProps) => {
  const [isRotating, setIsRotating] = useState(false);

  return (
    <Card className="border-primary/20 shadow-medium">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-foreground">3D Model Viewer</h3>
            {modelUrl && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsRotating(!isRotating)}
              >
                {isRotating ? "Stop Rotation" : "Auto Rotate"}
              </Button>
            )}
          </div>

          <div className="aspect-square bg-accent rounded-xl flex items-center justify-center relative overflow-hidden">
            {modelUrl ? (
              <div className="w-full h-full flex items-center justify-center">
                {/* Placeholder for 3D model - will integrate with actual 3D library */}
                <div className="text-center space-y-4 p-8">
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto animate-pulse">
                    <svg className="w-10 h-10 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">3D Model Loading</p>
                    <p className="text-xs text-muted-foreground mt-1">{productName}</p>
                  </div>
                </div>
              </div>
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
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
                </svg>
                Zoom In
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
                </svg>
                Zoom Out
              </Button>
              <Button variant="outline" size="sm" className="flex-1">
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Reset
              </Button>
            </div>
          )}

          <div className="text-xs text-muted-foreground bg-accent rounded-lg p-3">
            <p className="flex items-center gap-2">
              <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              Drag to rotate • Scroll to zoom • Double-click to reset
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
