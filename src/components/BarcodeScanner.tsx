'use client';

import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { DecodeHintType, BarcodeFormat } from '@zxing/library';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);

  useEffect(() => {
    // Instantiate the reader directly within the effect. This ensures the cleanup
    // function will close over this specific instance, avoiding ref-related issues.
    const hints = new Map();
    const formats = [
      BarcodeFormat.UPC_A, BarcodeFormat.UPC_E,
      BarcodeFormat.EAN_13, BarcodeFormat.EAN_8,
      BarcodeFormat.CODE_39, BarcodeFormat.CODE_128,
      BarcodeFormat.ITF, BarcodeFormat.QR_CODE,
    ];
    hints.set(DecodeHintType.POSSIBLE_FORMATS, formats);
    const codeReader = new BrowserMultiFormatReader(hints);

    const startScanner = async () => {
      if (!videoRef.current) return;

      try {
        // Request camera permission and start the video stream
        await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        // Start decoding from the video element.
        codeReader.decodeFromVideoDevice(undefined, videoRef.current, (result, error) => {
          if (result) {
            onDetected(result.getText());
          }
          if (error && error.name !== 'NotFoundException') {
            console.error('Barcode scan error:', error);
          }
        });

      } catch (err: any) {
        console.error('Camera access error:', err);
        setHasCameraPermission(false);
        let description = 'Could not access camera. Please grant camera permission in your browser settings.';
        if (err.name === 'NotAllowedError') {
          description = 'Camera permission was denied. Please grant permission in your browser settings.';
        } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
           description = 'No camera found. Please ensure a camera is connected and enabled.';
        }
        toast({
          variant: 'destructive',
          title: 'Camera Error',
          description,
        });
      }
    };

    startScanner();

    // The cleanup function will now have the correct `codeReader` instance in its scope.
    return () => {
      codeReader.reset();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onDetected, toast]);

  return (
    <div>
      <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
       {hasCameraPermission === null && (
         <div className="absolute inset-0 flex items-center justify-center bg-background/80 rounded-md">
            <p className="text-muted-foreground">Requesting camera permission...</p>
         </div>
      )}
      {hasCameraPermission === false && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Camera Access Required</AlertTitle>
          <AlertDescription>
            Camera access was denied or is not available. Please grant permission in your browser settings.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default BarcodeScanner;
