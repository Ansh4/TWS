import type { Product } from './types';

export const dummyProducts: Product[] = [
  {
    id: '8901030974328',
    barcode: '8901030974328',
    name: 'Parle-G Gold Biscuits',
    description: 'A larger pack of the classic Parle-G biscuits, known for their glucose content.',
    mrp: 100,
    costPriceCode: 'PGG-10',
    stock: 50,
    lowInventoryFactor: 10,
  },
  {
    id: '8901233020977',
    barcode: '8901233020977',
    name: 'Cadbury Dairy Milk Silk',
    description: 'A smooth and creamy milk chocolate bar from Cadbury.',
    mrp: 150,
    costPriceCode: 'CDS-15',
    stock: 8,
    lowInventoryFactor: 15,
  },
  {
    id: '8901725164016',
    barcode: '8901725164016',
    name: 'Tata Tea Gold',
    description: 'A blend of Assam CTC and long-leaf teas.',
    mrp: 500,
    costPriceCode: 'TTG-50',
    stock: 25,
    lowInventoryFactor: 5,
  },
  {
    id: '8901030724831',
    barcode: '8901030724831',
    name: 'Maggi 2-Minute Noodles',
    description: 'Instant noodles that are quick and easy to prepare.',
    mrp: 12,
    costPriceCode: 'MG-1',
    stock: 120,
    lowInventoryFactor: 24,
  },
];
