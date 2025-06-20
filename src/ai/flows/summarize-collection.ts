'use server';

/**
 * @fileOverview Summarizes a Firestore collection using AI to identify trends and insights.
 *
 * - summarizeCollection - A function that generates a summary of a Firestore collection.
 * - SummarizeCollectionInput - The input type for the summarizeCollection function.
 * - SummarizeCollectionOutput - The return type for the summarizeCollection function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeCollectionInputSchema = z.object({
  collectionName: z.string().describe('The name of the Firestore collection to summarize.'),
  documentContent: z.string().describe('The content of the documents in the collection, serialized into a single string.'),
});
export type SummarizeCollectionInput = z.infer<typeof SummarizeCollectionInputSchema>;

const SummarizeCollectionOutputSchema = z.object({
  summary: z.string().describe('A summary of the trends and insights found within the Firestore collection.'),
});
export type SummarizeCollectionOutput = z.infer<typeof SummarizeCollectionOutputSchema>;

export async function summarizeCollection(input: SummarizeCollectionInput): Promise<SummarizeCollectionOutput> {
  return summarizeCollectionFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeCollectionPrompt',
  input: {schema: SummarizeCollectionInputSchema},
  output: {schema: SummarizeCollectionOutputSchema},
  prompt: `You are an AI assistant tasked with summarizing data from a Firestore collection.

  Analyze the following document content and provide a concise summary of the key trends and insights.

  Collection Name: {{{collectionName}}}
  Document Content: {{{documentContent}}}

  Summary:`,
});

const summarizeCollectionFlow = ai.defineFlow(
  {
    name: 'summarizeCollectionFlow',
    inputSchema: SummarizeCollectionInputSchema,
    outputSchema: SummarizeCollectionOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
