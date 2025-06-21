'use client';

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from 'react';
import {
  collection,
  onSnapshot,
  doc,
  setDoc,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
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

export const ProductProvider = ({ children }: { children: ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // If db is not initialized, fallback to dummy data and skip firestore logic.
    if (!db) {
      console.warn('Firestore is not initialized. Using dummy data.');
      setProducts(dummyProducts);
      setIsLoading(false);
      return;
    }

    const productsCollectionRef = collection(db, 'products');

    const unsubscribe = onSnapshot(
      productsCollectionRef,
      async (querySnapshot) => {
        if (querySnapshot.empty) {
          // If the database is empty, we'll seed it. Don't set loading to false yet.
          console.log('No data found, seeding Firestore with dummy data...');
          const batch = writeBatch(db);
          dummyProducts.forEach((product) => {
            const { id, ...productData } = product;
            const docRef = doc(db, 'products', id);
            batch.set(docRef, productData);
          });
          await batch.commit();
          // The onSnapshot listener will be triggered again by this write,
          // this time with data, and `isLoading` will be set to false in the `else` block.
        } else {
          const productList = querySnapshot.docs.map((doc) => ({
            id: doc.id,
            ...(doc.data() as Omit<Product, 'id'>),
          }));
          setProducts(productList);
          setIsLoading(false);
        }
      },
      (error) => {
        console.error('Firestore read failed, falling back to dummy data:', error);
        setProducts(dummyProducts);
        setIsLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  const addProduct = async (product: Product) => {
    if (!db) return;
    try {
      const { id, ...productData } = product;
      const productDocRef = doc(db, 'products', id);
      await setDoc(productDocRef, productData);
    } catch (error) {
      console.error('Error adding product to Firestore: ', error);
    }
  };

  const updateProduct = async (updatedProduct: Product) => {
    if (!db) return;
    try {
      const { id, ...productData } = updatedProduct;
      const productDocRef = doc(db, 'products', id);
      await updateDoc(productDocRef, productData);
    } catch (error) {
      console.error('Error updating product in Firestore: ', error);
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
