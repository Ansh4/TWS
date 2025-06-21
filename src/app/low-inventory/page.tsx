'use client';

import { useMemo } from 'react';
import { useProducts } from '@/context/ProductContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';

export default function LowInventoryPage() {
  const { products, isLoading } = useProducts();

  const lowInventoryProducts = useMemo(() => {
    return products.filter((p) => p.stock <= p.lowInventoryFactor);
  }, [products]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline text-2xl">Low Inventory</CardTitle>
        <CardDescription>
          Products that are at or below their reorder threshold.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead className="text-right">In Stock</TableHead>
              <TableHead className="text-right">Threshold</TableHead>
              <TableHead className="text-right">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={i}>
                  <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                  <TableCell className="text-right"><Skeleton className="h-5 w-20 ml-auto" /></TableCell>
                </TableRow>
              ))
            ) : lowInventoryProducts.length > 0 ? (
              lowInventoryProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell className="font-medium">{product.name}</TableCell>
                  <TableCell className="text-right">{product.stock}</TableCell>
                  <TableCell className="text-right">{product.lowInventoryFactor}</TableCell>
                  <TableCell className="text-right">
                    <Badge variant={product.stock === 0 ? "destructive" : "secondary"}>
                      {product.stock === 0 ? "Out of Stock" : "Low Stock"}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={4} className="h-24 text-center">
                  No products with low inventory.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
