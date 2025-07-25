
'use server';

import { generateDomainNames } from '@/ai/flows/generate-domain-names';
import { checkDomainAvailability } from '@/services/domain-api';

interface FindDomainsResult {
    success: boolean;
    results: { domain: string, available: boolean }[];
    error?: string;
}

export async function findAvailableDomains(description: string): Promise<FindDomainsResult> {
    try {
        // 1. Generate domain name ideas
        let domainSuggestions;
        try {
            const genkitResponse = await generateDomainNames({ applicationDescription: description });
            domainSuggestions = genkitResponse.domainNames;
            if (!domainSuggestions || domainSuggestions.length === 0) {
                return { success: false, error: 'The AI did not suggest any domain names. Please try a different description.', results: [] };
            }
        } catch (error) {
            console.error("Error generating domain names:", error);
            if (error instanceof Error && (error.message.includes('GEMINI_API_KEY') || error.message.includes('GOOGLE_API_KEY'))) {
                return { success: false, error: 'Gemini API Key is missing. Please set it in your .env file to generate domain ideas.', results: [] };
            }
            return { success: false, error: 'An unexpected error occurred while generating domain ideas.', results: [] };
        }
        
        // 2. Clean up and deduplicate domain names
        const uniqueSuggestions = [...new Set(domainSuggestions.map(d => d.toLowerCase().replace(/[^a-z0-9-]/g, '')))];

        // 3. Check availability for the batch of domains
        let availableDomains: string[] = [];
        try {
            availableDomains = await checkDomainAvailability(uniqueSuggestions);
        } catch (error) {
             if (error instanceof Error) {
                if (error.message.includes('GODADDY_API_KEY') || error.message.includes('GODADDY_API_SECRET')) {
                     return { success: false, error: 'The GoDaddy API Key or Secret is missing. Please set them in your .env file.', results: [] };
                }
                if (error.message.includes('Error from GoDaddy API')) {
                    return { success: false, error: error.message, results: [] };
                }
            }
            // Fallback for other errors during lookup
            return { success: false, error: 'Could not check domain availability. Please verify your GoDaddy API credentials.', results: [] };
        }
        
        // 4. Map all suggestions to results, marking them as available or not
        const results = uniqueSuggestions.map(domain => ({
            domain,
            available: availableDomains.includes(domain)
        }));

        return { 
            success: true, 
            results: results
        };

    } catch (error) {
        console.error("A critical error occurred in findAvailableDomains:", error);
        return { success: false, error: 'An unexpected server error occurred. Please check the server logs.', results: [] };
    }
}
