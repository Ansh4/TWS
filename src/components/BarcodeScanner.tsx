'use client';

import { useEffect, useRef } from 'react';
import {
  Html5Qrcode,
  Html5QrcodeSupportedFormats,
  Html5QrcodeScannerState,
} from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
}

const scannerRegionId = 'barcode-scanner-region';

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected }) => {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // This ref will persist across re-renders, preventing re-initialization.
    if (!scannerRef.current) {
      scannerRef.current = new Html5Qrcode(scannerRegionId, false);
    }
    const scanner = scannerRef.current;

    // This prevents the double-camera issue in React's Strict Mode.
    if (scanner.getState() === Html5QrcodeScannerState.SCANNING) {
      return;
    }
    
    const start = async () => {
      try {
        await Html5Qrcode.getCameras();
        const config = {
          fps: 10,
          qrbox: { width: 250, height: 150 },
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
          // Check if scanner is still active to prevent multiple callbacks.
          if (scanner.isScanning) {
            // Stop the scanner first, then call onDetected to prevent race conditions.
            scanner.stop()
              .then(() => {
                onDetected(decodedText);
              })
              .catch((err) => {
                console.error("Failed to stop scanner after success", err);
                // Still proceed even if stopping fails.
                onDetected(decodedText);
              });
          }
        };

        const errorCallback = (errorMessage: string) => {
          // This is called frequently, so we ignore it.
        };

        await scanner.start(
          { facingMode: 'environment' },
          config,
          successCallback,
          errorCallback
        );
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Scanner Error',
          description:
            'Could not start scanner. Please grant camera permissions and try again.',
        });
      }
    };
    
    start();

    // The cleanup function is critical for stopping the scanner when the dialog is closed.
    return () => {
      if (scannerRef.current && scannerRef.current.isScanning) {
        scannerRef.current.stop().catch((error) => {
          console.error("Failed to stop the scanner during cleanup.", error);
        });
      }
    };
  }, [onDetected, toast]);

  return (
    <div>
      <div id={scannerRegionId} className="w-full aspect-video rounded-md bg-muted" />
      <Alert className="mt-4" variant="default">
        <AlertTitle>Scanning Tip</AlertTitle>
        <AlertDescription>
          Center the product's barcode in the box. Make sure it's well-lit and in focus. Some barcodes may not scan if they have an invalid format.
        </AlertDescription>
      </Alert>
    </div>
  );
};

export default BarcodeScanner;
