
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
        const { domainNames } = await generateDomainNames({ applicationDescription: description });

        if (!domainNames || domainNames.length === 0) {
            return { success: true, results: [] };
        }

        const uniqueSuggestions = [...new Set(domainNames.map(d => d.toLowerCase().replace(/[^a-z0-9-]/g, '')))];
        
        const availabilityResults = await checkDomainAvailability(uniqueSuggestions);
        
        const results = uniqueSuggestions.map(domain => ({
            domain,
            available: availabilityResults[domain] || false
        }));
        
        return { 
            success: true, 
            results
        };

    } catch (error) {
        console.error("Error finding available domains:", error);
        if (error instanceof Error) {
            if (error.message.includes('NAMECHEAP_API_KEY') || error.message.includes('Namecheap API credentials')) {
                 return { success: false, error: 'The Namecheap API Key, User, or Client IP is missing. Please set them in your .env file.', results: [] };
            }
            if (error.message.includes('GEMINI_API_KEY') || error.message.includes('GOOGLE_API_KEY')) {
                 return { success: false, error: 'Gemini API Key is missing. Please set it in your .env file to generate domain ideas.', results: [] };
            }
             if (error.message.includes('Error from Namecheap API')) {
                return { success: false, error: error.message, results: [] };
            }
        }
        return { success: false, error: 'An unexpected error occurred while generating domains.', results: [] };
    }
}
