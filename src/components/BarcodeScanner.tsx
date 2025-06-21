'use client';

import { useEffect, useRef, useState } from 'react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected }) => {
  const scannerRef = useRef<HTMLDivElement>(null);
  const qrCodeScannerRef = useRef<Html5Qrcode | null>(null);
  const { toast } = useToast();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    if (!scannerRef.current) return;

    const qrCodeScanner = new Html5Qrcode(scannerRef.current.id, false);
    qrCodeScannerRef.current = qrCodeScanner;

    const startScanner = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
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
          ]
        };
        const successCallback = (decodedText: string) => {
            onDetected(decodedText);
        };
        const errorCallback = (errorMessage: string) => { /* ignore */ };
        
        qrCodeScanner.start(
          { facingMode: 'environment' },
          config,
          successCallback,
          errorCallback
        ).catch(err => {
            console.error('Scanner start failed', err);
            toast({
              variant: 'destructive',
              title: 'Scanner Error',
              description: 'Could not start the scanner.',
            });
        });

      } catch (err) {
        console.error('Camera permission denied', err);
        setHasPermission(false);
        toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please grant camera permissions in your browser settings.',
        });
      }
    };
    
    startScanner();

    return () => {
      if (qrCodeScannerRef.current && qrCodeScannerRef.current.isScanning) {
        // Checking for isScanning before calling stop
        qrCodeScannerRef.current.stop().catch(err => {
          console.error('Failed to stop scanner.', err);
        });
      }
    };
  }, [onDetected, toast]);

  return (
    <div>
      <div id="barcode-scanner-container" ref={scannerRef} className="w-full aspect-video rounded-md bg-muted" />
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
