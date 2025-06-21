export type Product = {
  id: string;
  barcode: string;
  ean: string;
  name: string;
  description: string;
  mrp: number;
  costPriceCode: string;
  stock: number;
  lowInventoryFactor: number;
};

export type CartItem = {
  product: Product;
  quantity: number;
  salePrice: number;
};
