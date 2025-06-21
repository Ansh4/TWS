# **App Name**: StockFlow

## Core Features:

- Dashboard: Main dashboard with buttons for 'Add Product', 'Low Inventory', 'View Products', and 'Sell Products'.
- Add Product: Add Product page with fields for barcode (manual entry or camera scan), product name (pre-filled via go-upc.com), MRP, cost price/discount code, in-stock quantity, and low inventory threshold.
- Barcode Fetch: Uses go-upc.com as a tool to automatically fetch product information based on barcode.
- Low Inventory Display: Display of products with in-stock quantity at or below the low inventory threshold.
- View Products: Display of all products in a list format.
- Sell Product: Sell Product interface with barcode/name search (with name suggestions), fields for discounted price/percentage and quantity. Creates a list for selling multiple products in one go.
- Stock Reduction: Automatic reduction of in-stock quantity upon a sale.

## Style Guidelines:

- Primary color: Soft Blue (#A0D2EB) to convey trust and efficiency.
- Background color: Light Gray (#F0F4F8), providing a clean and neutral backdrop.
- Accent color: Teal (#70A1B4) for interactive elements and call-to-action buttons.
- Headline font: 'Space Grotesk' sans-serif for a techy and modern feel.
- Body font: 'Inter' sans-serif to make it more suitable for reading long blocks of information like in descriptions and product listing.
- Simple, clean line icons for primary actions and navigation.
- Responsive layout optimized for both mobile and desktop browsers.