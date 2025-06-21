'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useProducts } from '@/context/ProductContext';
import { useToast } from '@/hooks/use-toast';
import { prefillProductDetails } from '@/ai/flows/prefill-product-details';
import { Loader2, ScanLine } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Quagga from '@ericblade/quagga2';

const formSchema = z.object({
  barcode: z.string().min(1, 'Barcode is required'),
  name: z.string().min(2, 'Product name is required'),
  description: z.string().optional(),
  mrp: z.coerce.number().min(0, 'MRP must be a positive number'),
  costPriceCode: z.string().optional(),
  stock: z.coerce.number().int().min(0, 'Stock must be a positive integer'),
  lowInventoryFactor: z.coerce.number().int().min(0, 'Threshold must be a positive integer'),
});

export default function AddProductPage() {
  const { addProduct, getProductByBarcode } = useProducts();
  const { toast } = useToast();
  const [isFetching, setIsFetching] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const scannerRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      barcode: '',
      name: '',
      description: '',
      mrp: 0,
      costPriceCode: '',
      stock: 0,
      lowInventoryFactor: 0,
    },
  });

  const handleFetchDetails = useCallback(async (barcodeValue?: string) => {
    const barcode = barcodeValue || form.getValues('barcode');
    if (!barcode) {
      form.setError('barcode', { message: 'Please enter a barcode first.' });
      return;
    }
    if(getProductByBarcode(barcode)) {
      toast({
        title: 'Product Exists',
        description: 'A product with this barcode already exists.',
        variant: 'destructive',
      });
      return;
    }
    setIsFetching(true);
    try {
      const details = await prefillProductDetails({ barcode });
      if (details.productName) {
        form.setValue('name', details.productName);
      }
      if (details.description) {
        form.setValue('description', details.description);
      }
      toast({
        title: 'Success',
        description: 'Product details fetched successfully.',
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Could not fetch product details. Please enter manually.',
        variant: 'destructive',
      });
      console.error(error);
    } finally {
      setIsFetching(false);
    }
  }, [form, getProductByBarcode, toast]);

  useEffect(() => {
    if (!isScannerOpen) {
      Quagga.stop();
      return;
    }

    let isMounted = true;

    const onDetected = (data: any) => {
      if (data?.codeResult?.code && isMounted) {
        Quagga.offDetected(onDetected); // Stop listening to avoid multiple triggers
        Quagga.stop();
        isMounted = false; // Prevent further state updates from this effect
        
        setIsScannerOpen(false);
        const barcode = data.codeResult.code;
        form.setValue('barcode', barcode);
        toast({
          title: 'Barcode Scanned!',
          description: `Automatically fetching details for ${barcode}`,
        });
        handleFetchDetails(barcode);
      }
    };

    const initScanner = async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ video: true });
        if (!isMounted) return;
        setHasCameraPermission(true);

        Quagga.init({
          inputStream: {
            name: "Live",
            type: "LiveStream",
            target: scannerRef.current!,
            constraints: {
                facingMode: "environment"
            },
          },
          decoder: {
            readers: ["ean_reader", "upc_reader", "code_128_reader", "ean_8_reader"]
          },
          locate: true,
        }, (err) => {
          if (err) {
            console.error("QuaggaJS init error:", err);
            if (isMounted) {
              setHasCameraPermission(false);
              toast({
                  variant: 'destructive',
                  title: 'Scanner Error',
                  description: 'Could not initialize barcode scanner.',
              });
            }
            return;
          }
          if (isMounted) {
            Quagga.onDetected(onDetected);
            Quagga.start();
          }
        });
      } catch (err) {
        console.error("Camera access denied:", err);
        if (isMounted) {
          setHasCameraPermission(false);
          toast({
            variant: 'destructive',
            title: 'Camera Access Denied',
            description: 'Please enable camera permissions in your browser settings to use the scanner.',
          });
        }
      }
    };

    if (scannerRef.current) {
      initScanner();
    }

    return () => {
      isMounted = false;
      // It's important to remove the listener and stop the scanner on cleanup
      Quagga.offDetected(onDetected);
      Quagga.stop();
    };
  }, [isScannerOpen, form, toast, handleFetchDetails]);

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if(getProductByBarcode(values.barcode)) {
      toast({
        title: 'Product Exists',
        description: 'A product with this barcode already exists.',
        variant: 'destructive',
      });
      return;
    }
    addProduct({
      id: values.barcode,
      ...values,
      description: values.description || '',
    });
    toast({
      title: 'Product Added',
      description: `${values.name} has been added to your inventory.`,
    });
    form.reset();
  };

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Add New Product</CardTitle>
        <CardDescription>Fill in the details to add a new product to your inventory.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="barcode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Barcode</FormLabel>
                  <div className="flex gap-2">
                    <FormControl>
                      <Input placeholder="e.g., 8901030974328" {...field} />
                    </FormControl>
                    <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                      <DialogTrigger asChild>
                        <Button type="button" variant="outline" size="icon">
                          <ScanLine className="h-4 w-4" />
                          <span className="sr-only">Scan Barcode</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Scan Barcode</DialogTitle>
                          <DialogDescription>
                            Point your camera at a product's barcode to fill the form.
                          </DialogDescription>
                        </DialogHeader>
                        <div>
                          <div ref={scannerRef} className="w-full aspect-video rounded-md bg-muted" />
                          {hasCameraPermission === false && (
                            <Alert variant="destructive" className="mt-4">
                              <AlertTitle>Camera Access Required</AlertTitle>
                              <AlertDescription>
                                Please allow camera access in your browser settings to use the scanner.
                              </AlertDescription>
                            </Alert>
                          )}
                        </div>
                      </DialogContent>
                    </Dialog>
                    <Button type="button" onClick={() => handleFetchDetails()} disabled={isFetching}>
                      {isFetching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Fetch Details
                    </Button>
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Product Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Parle-G Gold" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Input placeholder="Product description" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="mrp"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>MRP (Maximum Retail Price)</FormLabel>
                    <div className="relative">
                       <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₹</span>
                       <FormControl>
                          <Input type="number" placeholder="100" className="pl-7" {...field} />
                       </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="costPriceCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cost Price/Less Code</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., PGG-10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <FormField
                control={form.control}
                name="stock"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>In-Stock Quantity</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lowInventoryFactor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Low Inventory Threshold</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="10" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Button type="submit" className="w-full" disabled={isFetching}>
              Save Product
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
