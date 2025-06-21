'use client';

import { useEffect, useRef } from 'react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { useToast } from '@/hooks/use-toast';

interface BarcodeScannerProps {
  onDetected: (code: string) => void;
}

const BarcodeScanner: React.FC<BarcodeScannerProps> = ({ onDetected }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    let controls: any;

    const startScan = async () => {
      if (!videoRef.current) return;

      try {
        const videoInputDevices = await codeReader.listVideoInputDevices();
        if (videoInputDevices.length === 0) {
           toast({
              variant: 'destructive',
              title: 'Camera Error',
              description: 'No camera found. Please connect a camera.',
            });
          return;
        }
        
        const firstDeviceId = videoInputDevices[0].deviceId;

        controls = codeReader.decodeFromVideoDevice(firstDeviceId, videoRef.current, (result, error) => {
          if (result) {
            onDetected(result.getText());
          }

          if (error) {
            // We ignore NotFoundException, which is thrown when no barcode is found in a frame.
            if (error.name !== 'NotFoundException') {
              console.error('Barcode scan error:', error);
              toast({
                variant: 'destructive',
                title: 'Scan Error',
                description: 'An error occurred while scanning.',
              });
            }
          }
        });
      } catch (err: any) {
        console.error('Camera access error:', err);
        let description = 'Could not access camera. Please grant camera permission in your browser settings.';
        if(err && err.name === 'NotAllowedError') {
          description = 'Camera permission was denied. Please grant permission in your browser settings.'
        }
        toast({
          variant: 'destructive',
          title: 'Camera Error',
          description: description,
        });
      }
    };

    startScan();

    return () => {
      if (controls) {
        controls.reset();
      }
    };
  }, [onDetected, toast]);

  return <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" />;
};

export default BarcodeScanner;
