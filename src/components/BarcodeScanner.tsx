'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected }) => {
  const scannerRegionRef = useRef<HTMLDivElement>(null);
  const scannerInstanceRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (!scannerRegionRef.current || scannerInstanceRef.current) {
      return;
    }

    const scanner = new Html5Qrcode(scannerRegionRef.current.id, false);
    scannerInstanceRef.current = scanner;

    const startScanner = async () => {
      try {
        await Html5Qrcode.getCameras();
        setHasPermission(true);

        const config = {
          fps: 10,
          qrbox: (w: number, h: number) => ({ width: w * 0.8, height: h * 0.5 }),
          supportedScanTypes: [],
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.ITF,
          ],
        };

        const successCallback = (decodedText: string) => {
          if (scannerInstanceRef.current?.isScanning) {
            scannerInstanceRef.current.stop()
              .then(() => {
                onDetected(decodedText);
              })
              .catch((err) => {
                console.error("Failed to stop the scanner after success.", err);
                onDetected(decodedText);
              });
          }
        };

        const errorCallback = (errorMessage: string) => {
          // This callback is called frequently, so we typically ignore the errors.
        };

        await scanner.start(
          { facingMode: 'environment' },
          config,
          successCallback,
          errorCallback
        );

      } catch (err) {
        console.error('Error starting scanner:', err);
        setHasPermission(false);
        toast({
          variant: 'destructive',
          title: 'Scanner Error',
          description: 'Could not start the scanner. Please grant camera permissions and ensure your camera is not in use by another application.',
        });
      }
    };

    startScanner();

    return () => {
      if (scannerInstanceRef.current?.isScanning) {
        scannerInstanceRef.current.stop().catch(err => {
          console.warn('Failed to stop scanner on cleanup, it might have been stopped already.', err);
        });
      }
      scannerInstanceRef.current = null;
    };
  }, [onDetected, toast]);

  return (
    <div>
      <div id="barcode-scanner-region" ref={scannerRegionRef} className="w-full aspect-video rounded-md bg-muted" />
      {hasPermission === false && (
        <Alert variant="destructive" className="mt-4">
          <AlertTitle>Camera Access Required</AlertTitle>
          <AlertDescription>
            Please grant camera permissions in your browser settings to use the scanner.
          </AlertDescription>
        </Alert>
      )}
      {hasPermission === null && (
         <div className="mt-2 text-center text-muted-foreground">Requesting camera permission...</div>
      )}
    </div>
  );
};

export default BarcodeScanner;
