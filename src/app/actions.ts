
'use server';

import { generateDomainNames } from '@/ai/flows/generate-domain-names';
import { checkDomainAvailability } from '@/services/domain-api';


interface FindDomainsResult {
    success: boolean;
    results: { domain: string, available: boolean }[];
    error?: string;
}

export async function findAvailableDomains(description: string): Promise<FindDomainsResult> {
    console.log("Starting findAvailableDomains function for debugging...");

    try {
        // HARDCODED FOR DEBUGGING
        const suggestions = ['scooperific'];
        const domainsToCkeck = suggestions.map(d => `${d}.com`);
        console.log("Checking hardcoded domain:", domainsToCkeck);


        const availableDomains = await checkDomainAvailability(domainsToCkeck);
        
        console.log("Available domains returned from checkDomainAvailability:", availableDomains);

        const results = suggestions.map(suggestion => ({
            domain: suggestion,
            available: availableDomains.includes(`${suggestion}.com`),
        }));
        
        console.log("Final results being sent to client:", results);

        return { 
            success: true, 
            results
        };

    } catch (error) {
        console.error("Error finding available domains:", error);
        if (error instanceof Error) {
            if (error.message.includes('GODADDY_API_KEY')) {
                 return { success: false, error: 'GoDaddy API Key is missing. Please set it in your .env file.', results: [] };
            }
            if (error.message.includes('GEMINI_API_KEY') || error.message.includes('GOOGLE_API_KEY')) {
                 return { success: false, error: 'Gemini API Key is missing. Please set it in your .env file to generate domain ideas.', results: [] };
            }
        }
        return { success: false, error: 'An unexpected error occurred while generating domains.', results: [] };
    }
}
