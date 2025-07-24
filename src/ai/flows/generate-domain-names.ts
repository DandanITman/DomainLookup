'use server';

/**
 * @fileOverview Domain name generation flow.
 *
 * This file defines a Genkit flow that suggests domain names based on a user-provided application description.
 * It includes the input and output schemas, the main function to trigger the flow, and the flow definition.
 *
 * @exports generateDomainNames - A function that generates domain name suggestions.
 * @exports GenerateDomainNamesInput - The input type for the generateDomainNames function.
 * @exports GenerateDomainNamesOutput - The output type for the generateDomainNames function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateDomainNamesInputSchema = z.object({
  applicationDescription: z
    .string()
    .describe('A description of the application for which domain names are to be generated.'),
});
export type GenerateDomainNamesInput = z.infer<typeof GenerateDomainNamesInputSchema>;

const GenerateDomainNamesOutputSchema = z.object({
  domainNames: z.array(z.string()).describe('An array of suggested domain names.'),
});
export type GenerateDomainNamesOutput = z.infer<typeof GenerateDomainNamesOutputSchema>;

export async function generateDomainNames(input: GenerateDomainNamesInput): Promise<GenerateDomainNamesOutput> {
  return generateDomainNamesFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateDomainNamesPrompt',
  input: {schema: GenerateDomainNamesInputSchema},
  output: {schema: GenerateDomainNamesOutputSchema},
  prompt: `You are a domain name expert specializing in generating creative and relevant domain names based on application descriptions.

  Generate five domain names for the application described below:

  Application Description: {{{applicationDescription}}}

  Return the domain names as an array of strings.
  `,
});

const generateDomainNamesFlow = ai.defineFlow(
  {
    name: 'generateDomainNamesFlow',
    inputSchema: GenerateDomainNamesInputSchema,
    outputSchema: GenerateDomainNamesOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
