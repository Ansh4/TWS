import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  PackagePlus,
  Warehouse,
  List,
  ShoppingCart,
} from 'lucide-react';
import Link from 'next/link';

const features = [
  {
    title: 'Add Product',
    href: '/add-product',
    icon: <PackagePlus className="w-10 h-10" />,
    description: 'Add new items to your inventory.',
  },
  {
    title: 'Low Inventory',
    href: '/low-inventory',
    icon: <Warehouse className="w-10 h-10" />,
    description: 'View products that are running low on stock.',
  },
  {
    title: 'View Products',
    href: '/products',
    icon: <List className="w-10 h-10" />,
    description: 'Browse all products in your inventory.',
  },
  {
    title: 'Sell Products',
    href: '/sell',
    icon: <ShoppingCart className="w-10 h-10" />,
    description: 'Create a new sale and update stock.',
  },
];

export default function Home() {
  return (
    <div className="flex flex-col items-center">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary mb-2">
          Welcome to StockFlow
        </h1>
        <p className="text-lg text-muted-foreground">
          Your simple solution for inventory management.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-6xl">
        {features.map((feature) => (
          <Link href={feature.href} key={feature.title} passHref>
            <Card className="h-full flex flex-col items-center justify-center text-center p-6 hover:shadow-lg hover:border-primary transition-all duration-300 cursor-pointer">
              <CardHeader className="p-0 mb-4">
                <div className="mx-auto text-primary">{feature.icon}</div>
              </CardHeader>
              <CardContent className="p-0">
                <CardTitle className="text-xl font-headline mb-2">{feature.title}</CardTitle>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
