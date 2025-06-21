import Link from 'next/link';
import { Package } from 'lucide-react';
import { Button } from './ui/button';

export default function AppHeader() {
  return (
    <header className="bg-card border-b sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold font-headline">StockFlow</span>
          </Link>
          <nav className="hidden md:flex items-center gap-2">
            <Button variant="ghost" asChild>
              <Link href="/add-product">Add Product</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/products">View Products</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/sell">Sell</Link>
            </Button>
          </nav>
        </div>
      </div>
    </header>
  );
}
