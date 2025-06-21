'use client';

import { useState, useMemo, useRef, useEffect, useCallback } from 'react';
import { useProducts } from '@/context/ProductContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import type { Product, CartItem } from '@/lib/types';
import { Search, PlusCircle, Trash2, ShoppingCart, ScanLine } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import jsQR from 'jsqr';


export default function SellPage() {
  const { products, updateProduct, isLoading } = useProducts();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [saleQuantity, setSaleQuantity] = useState(1);
  const [salePrice, setSalePrice] = useState(0);

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const filteredProducts = useMemo(() => {
    if (!searchQuery) return [];
    return products.filter(
      (p) =>
        p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.barcode.includes(searchQuery)
    ).slice(0, 5);
  }, [searchQuery, products]);

  const addScannedItemToCart = useCallback((product: Product) => {
    setCart(currentCart => {
      const existingCartItemIndex = currentCart.findIndex(item => item.product.id === product.id);

      if (existingCartItemIndex > -1) {
        if (currentCart[existingCartItemIndex].quantity + 1 > product.stock) {
          toast({ title: 'Error', description: 'Not enough stock available.', variant: 'destructive' });
          return currentCart;
        }
        const updatedCart = [...currentCart];
        updatedCart[existingCartItemIndex].quantity += 1;
        toast({ title: 'Success', description: `${product.name} quantity updated.` });
        return updatedCart;
      } else {
         if (1 > product.stock) {
          toast({ title: 'Error', description: 'Not enough stock available.', variant: 'destructive' });
          return currentCart;
        }
        toast({ title: 'Success', description: `${product.name} added to cart.` });
        return [...currentCart, { product, quantity: 1, salePrice: product.mrp }];
      }
    });
  }, [toast]);

  useEffect(() => {
    if (!isScannerOpen) {
      return;
    }

    let stream: MediaStream | null = null;
    let animationFrameId: number;
    let isScanning = true;

    const tick = () => {
      if (!isScanning) return;

      if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA && canvasRef.current) {
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (ctx) {
          canvas.height = video.videoHeight;
          canvas.width = video.videoWidth;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);

          if (code) {
            isScanning = false;
            const product = products.find(p => p.barcode === code.data);
            if (product) {
              addScannedItemToCart(product);
            } else {
              toast({
                title: 'Product Not Found',
                description: `No product with barcode ${code.data} found.`,
                variant: 'destructive',
              });
            }
            setIsScannerOpen(false);
            return;
          }
        }
      }
      if (isScanning) {
        animationFrameId = requestAnimationFrame(tick);
      }
    };

    const getCamera = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
        setHasCameraPermission(true);

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
          requestAnimationFrame(tick);
        }
      } catch (error) {
        console.error('Error accessing camera:', error);
        setHasCameraPermission(false);
        toast({
          variant: 'destructive',
          title: 'Camera Access Denied',
          description: 'Please enable camera permissions to use the scanner.',
        });
      }
    };

    getCamera();

    return () => {
      isScanning = false;
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
    };
  }, [isScannerOpen, products, toast, addScannedItemToCart]);


  const addToCart = (product: Product) => {
    if (saleQuantity > product.stock) {
      toast({ title: 'Error', description: 'Not enough stock available.', variant: 'destructive' });
      return;
    }
    
    const existingCartItemIndex = cart.findIndex(item => item.product.id === product.id);

    if (existingCartItemIndex > -1) {
      const updatedCart = [...cart];
      updatedCart[existingCartItemIndex].quantity += saleQuantity;
      setCart(updatedCart);
    } else {
      setCart([...cart, { product, quantity: saleQuantity, salePrice: salePrice || product.mrp }]);
    }
    
    setSearchQuery('');
    setSaleQuantity(1);
    setSalePrice(0);
    
    toast({ title: 'Success', description: `${product.name} added to cart.` });
  };
  
  const removeFromCart = (productId: string) => {
    setCart(cart.filter(item => item.product.id !== productId));
  };
  
  const cartTotal = useMemo(() => {
    return cart.reduce((total, item) => total + item.salePrice * item.quantity, 0);
  }, [cart]);

  const completeSale = () => {
    if (cart.length === 0) {
        toast({ title: 'Cart is empty', description: 'Add products to the cart to complete a sale.', variant: 'destructive'});
        return;
    }
    cart.forEach(item => {
      const updatedProduct = { ...item.product, stock: item.product.stock - item.quantity };
      updateProduct(updatedProduct);
    });
    toast({ title: 'Sale Complete!', description: `Total: ₹${cartTotal.toFixed(2)}. Stock updated.` });
    setCart([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline text-2xl">Create a Sale</CardTitle>
            <CardDescription>Search for a product to add to the cart or scan its barcode.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 items-center">
                <Popover open={searchQuery.length > 0 && filteredProducts.length > 0}>
                  <PopoverTrigger asChild>
                    <div className="relative flex-grow">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by product name or barcode..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                    <ul className="space-y-1">
                      {filteredProducts.map(p => (
                        <li key={p.id} className="p-2 hover:bg-accent rounded-md">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium">{p.name}</p>
                              <p className="text-sm text-muted-foreground">Stock: {p.stock} | MRP: ₹{p.mrp}</p>
                            </div>
                            <Popover>
                              <PopoverTrigger asChild>
                                 <Button size="icon" variant="ghost"><PlusCircle className="h-5 w-5"/></Button>
                              </PopoverTrigger>
                              <PopoverContent>
                                <div className="space-y-2">
                                   <p className="font-medium text-sm">{p.name}</p>
                                   <Input type="number" value={saleQuantity} onChange={e => setSaleQuantity(Number(e.target.value))} placeholder="Quantity" min="1" max={p.stock} />
                                   <div className="relative">
                                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground">₹</span>
                                      <Input type="number" value={salePrice || ''} onChange={e => setSalePrice(Number(e.target.value))} placeholder={`Sale Price (MRP: ${p.mrp})`} className="pl-7"/>
                                   </div>
                                   <Button className="w-full" onClick={() => addToCart(p)}>Add to Cart</Button>
                                </div>
                              </PopoverContent>
                            </Popover>
                          </div>
                        </li>
                      ))}
                    </ul>
                  </PopoverContent>
                </Popover>

                <Dialog open={isScannerOpen} onOpenChange={setIsScannerOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="icon">
                      <ScanLine className="h-4 w-4" />
                      <span className="sr-only">Scan Barcode</span>
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Scan Barcode</DialogTitle>
                      <DialogDescription>
                        Point your camera at a product's barcode to add it to the cart.
                      </DialogDescription>
                    </DialogHeader>
                    <div>
                      <video ref={videoRef} className="w-full aspect-video rounded-md bg-muted" autoPlay muted playsInline />
                      <canvas ref={canvasRef} className="hidden" />
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
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="lg:col-span-1">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline flex items-center gap-2"><ShoppingCart className="h-6 w-6"/> Cart</CardTitle>
            <CardDescription>Items to be sold.</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Item</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {cart.length > 0 ? (
                  cart.map(item => (
                    <TableRow key={item.product.id}>
                      <TableCell>
                        <p className="font-medium">{item.product.name}</p>
                        <p className="text-sm text-muted-foreground">{item.quantity} x ₹{item.salePrice.toFixed(2)}</p>
                      </TableCell>
                      <TableCell className="text-right font-medium">₹{(item.quantity * item.salePrice).toFixed(2)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(item.product.id)}>
                            <Trash2 className="h-4 w-4"/>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="h-24 text-center">Your cart is empty.</TableCell>
                  </TableRow>
                )}
              </TableBody>
              {cart.length > 0 && (
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={1} className="font-bold">Total</TableCell>
                    <TableCell className="text-right font-bold">₹{cartTotal.toFixed(2)}</TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              )}
            </Table>
             <Button className="w-full mt-4" onClick={completeSale} disabled={cart.length === 0}>Complete Sale</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
