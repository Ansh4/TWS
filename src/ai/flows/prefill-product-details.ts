'use server';
/**
 * @fileOverview Retrieves product details from Open Food Facts based on a barcode.
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
    description:
      'Retrieves product information from the Open Food Facts public database based on the barcode.',
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
      `https://world.openfoodfacts.org/api/v0/product/${input.barcode}.json`
    );
    if (!response.ok) {
      throw new Error(
        `Failed to fetch product info for barcode ${input.barcode}`
      );
    }

    const data = await response.json();

    if (data.status === 0 || !data.product) {
      return {productName: '', description: ''};
    }

    const productName = data.product.product_name || '';
    const description =
      data.product.generic_name_en || data.product.categories || '';

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