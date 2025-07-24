
'use server';

import { generateDomainNames } from '@/ai/flows/generate-domain-names';
import { checkDomainAvailability } from '@/services/domain-api';


interface FindDomainsResult {
    success: boolean;
    available?: string[];
    unavailable?: string[];
    error?: string;
}

export async function findAvailableDomains(description: string): Promise<FindDomainsResult> {
    if (!description) {
        return { success: false, error: 'Please provide a description for your application.' };
    }

    try {
        const available: string[] = [];
        const unavailable: string[] = [];
        const processed = new Set<string>();
        let attempts = 0;
        const maxAttempts = 5; // Safety break after 5 GenAI calls (250 domains)

        while (available.length < 5 && attempts < maxAttempts) {
            const result = await generateDomainNames({ applicationDescription: description });
            
            const suggestions = result.domainNames
                .map(name => name.toLowerCase().split('.')[0].replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, ''))
                .filter(d => d && d.length > 2 && !processed.has(d));

            const uniqueSuggestions = Array.from(new Set(suggestions));

            for (const name of uniqueSuggestions) {
                if (processed.has(name)) continue;
                processed.add(name);

                // Stop checking if we already have enough available domains
                if (available.length >= 5) break;

                try {
                    const isAvailable = await checkDomainAvailability(name + '.com');
                    if (isAvailable) {
                        available.push(name);
                    } else {
                        if (unavailable.length < 10) {
                            unavailable.push(name);
                        }
                    }
                } catch (e) {
                     // Even on error, add to unavailable to avoid re-checking
                     if (unavailable.length < 10) {
                        unavailable.push(name);
                    }
                }
            }
            
            attempts++;
        }

        if (available.length === 0) {
             return { success: false, error: "We couldn't find any available domains after several attempts. Please try a more detailed description or try again later." };
        }

        return { success: true, available, unavailable: unavailable.slice(0, 10 - available.length) };

    } catch (error) {
        console.error("Error finding available domains:", error);
        if (error instanceof Error) {
            if (error.message.includes('GODADDY_API_KEY')) {
                 return { success: false, error: 'GoDaddy API Key is missing. Please set it in your .env file.' };
            }
            if (error.message.includes('GEMINI_API_KEY') || error.message.includes('GOOGLE_API_KEY')) {
                 return { success: false, error: 'Gemini API Key is missing. Please set it in your .env file to generate domain ideas.' };
            }
        }
        return { success: false, error: 'An unexpected error occurred while generating domains.' };
    }
}
