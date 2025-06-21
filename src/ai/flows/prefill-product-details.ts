'use server';
/**
 * @fileOverview Retrieves product details from go-upc.com based on a barcode.
 *
 * - prefillProductDetails - A function that fetches product details based on the provided barcode.
 * - PrefillProductDetailsInput - The input type for the prefillProductDetails function.
 * - PrefillProductDetailsOutput - The return type for the prefillProductDetails function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PrefillProductDetailsInputSchema = z.object({
  barcode: z
    .string()
    .describe('The barcode of the product to fetch details for.'),
});
export type PrefillProductDetailsInput = z.infer<
  typeof PrefillProductDetailsInputSchema
>;

const PrefillProductDetailsOutputSchema = z.object({
  productName: z.string().describe('The name of the product.'),
  description: z.string().describe('A description of the product.'),
});
export type PrefillProductDetailsOutput = z.infer<
  typeof PrefillProductDetailsOutputSchema
>;

export async function prefillProductDetails(
  input: PrefillProductDetailsInput
): Promise<PrefillProductDetailsOutput> {
  return prefillProductDetailsFlow(input);
}

const getProductInfo = ai.defineTool(
  {
    name: 'getProductInfo',
    description: 'Retrieves product information from go-upc.com based on the barcode.',
    inputSchema: z.object({
      barcode: z
        .string()
        .describe('The barcode of the product to fetch details for.'),
    }),
    outputSchema: z.object({
      productName: z.string().describe('The name of the product.'),
      description: z.string().describe('A description of the product.'),
    }),
  },
  async input => {
    const response = await fetch(
      `https://go-upc.com/search?q=${input.barcode}`
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch product info for barcode ${input.barcode}`
      );
    }

    const html = await response.text();

    // Basic parsing of the HTML content to extract product name and description.
    // This is a rudimentary example and might need adjustments based on the
    // actual structure of the go-upc.com response.
    const productNameMatch = html.match(/<h1 class=".*?">(.+?)<\/h1>/);
    const descriptionMatch = html.match(
      /<div class="description">\s*<p>(.*?)<\/p>\s*<\/div>/
    );

    const productName = productNameMatch ? productNameMatch[1] : '';
    const description = descriptionMatch ? descriptionMatch[1] : '';

    return {productName, description};
  }
);

const prefillProductDetailsPrompt = ai.definePrompt({
  name: 'prefillProductDetailsPrompt',
  tools: [getProductInfo],
  prompt: `Use the getProductInfo tool to retrieve product details for the given barcode. Return the product name and description.

Barcode: {{{barcode}}}`,
  input: {schema: PrefillProductDetailsInputSchema},
  output: {schema: PrefillProductDetailsOutputSchema},
});

const prefillProductDetailsFlow = ai.defineFlow(
  {
    name: 'prefillProductDetailsFlow',
    inputSchema: PrefillProductDetailsInputSchema,
    outputSchema: PrefillProductDetailsOutputSchema,
  },
  async input => {
    const {output} = await prefillProductDetailsPrompt(input);
    return output!;
  }
);
