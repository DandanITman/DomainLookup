
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
        let domainNames;
        try {
            const genkitResponse = await generateDomainNames({ applicationDescription: description });
            domainNames = genkitResponse.domainNames;
            if (!domainNames || domainNames.length === 0) {
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
        const uniqueSuggestions = [...new Set(domainNames.map(d => d.toLowerCase().replace(/[^a-z0-9-]/g, '')))];

        // 3. Check availability for each domain individually
        const availabilityChecks = await Promise.all(
            uniqueSuggestions.map(async (domain) => {
                try {
                    const isAvailable = await checkDomainAvailability(domain);
                    return { domain, available: isAvailable };
                } catch (error) {
                    console.error(`Failed to check availability for ${domain}:`, error);
                    // Return a result indicating failure for this specific domain
                    return { domain, available: false, error: true };
                }
            })
        );
        
        // 4. Filter out any domains that had an error during lookup
        const successfulChecks = availabilityChecks.filter(res => !res.error);
        if (successfulChecks.length === 0 && uniqueSuggestions.length > 0) {
             return { success: false, error: 'Could not check domain availability. Please verify Namecheap API credentials and IP whitelisting.', results: [] };
        }

        return { 
            success: true, 
            results: successfulChecks.map(({domain, available}) => ({domain, available}))
        };

    } catch (error) {
        console.error("A critical error occurred in findAvailableDomains:", error);
        if (error instanceof Error) {
             if (error.message.includes('NAMECHEAP_API_KEY') || error.message.includes('Namecheap API credentials')) {
                 return { success: false, error: 'The Namecheap API Key, User, or Client IP is missing. Please set them in your .env file.', results: [] };
            }
             if (error.message.includes('Error from Namecheap API')) {
                return { success: false, error: error.message, results: [] };
            }
        }
        return { success: false, error: 'An unexpected error occurred. Please check the server logs.', results: [] };
    }
}
