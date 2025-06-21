'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import { ref, onValue, set, update } from 'firebase/database';
import { database } from '@/lib/firebase';
import type { Product } from '@/lib/types';
import { dummyProducts } from '@/lib/dummy-data';

interface ProductContextType {
  products: Product[];
  addProduct: (product: Product) => void;
  updateProduct: (updatedProduct: Product) => void;
  getProductByBarcode: (barcode: string) => Product | undefined;
  isLoading: boolean;
}

const ProductContext = createContext<ProductContextType | undefined>(undefined);

const productsRef = ref(database, 'products');

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onValue(
      productsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const productList = Object.keys(data).map((key) => ({
            ...data[key],
            id: key, // The key from Firebase is the product ID
          }));
          setProducts(productList);
        } else {
          // If the database is empty, seed it with dummy data.
          console.log('No data found, seeding database...');
          const initialProducts: { [key: string]: Omit<Product, 'id'> } = {};
          dummyProducts.forEach((p) => {
            const { id, ...rest } = p;
            initialProducts[id] = rest;
          });
          set(productsRef, initialProducts);
          // Set local state as well to avoid a flicker
          setProducts(dummyProducts);
        }
        setIsLoading(false);
      },
      (error) => {
        console.error('Firebase read failed: ', error);
        // Fallback to dummy data on error
        setProducts(dummyProducts);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addProduct = async (product: Product) => {
    try {
      const { id, ...productData } = product;
      const newProductRef = ref(database, `products/${id}`);
      await set(newProductRef, productData);
    } catch (error) {
      console.error('Error adding product to Firebase: ', error);
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    try {
      // Create a map of updates for all products that need changing.
      // This is more efficient for batch updates.
      const updates: { [key: string]: any } = {};
      const { id, ...productData } = updatedProduct;
      updates[`/products/${id}`] = productData;
      await update(ref(database), updates);
    } catch (error) {
      console.error('Error updating product in Firebase: ', error);
    }
  };

  const getProductByBarcode = (barcode: string) => {
    return products.find((p) => p.barcode === barcode);
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        addProduct,
        updateProduct,
        getProductByBarcode,
        isLoading,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
