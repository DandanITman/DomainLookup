
'use server';

import { generateDomainNames } from '@/ai/flows/generate-domain-names';
import { checkDomainAvailability } from '@/services/domain-api';


interface FindDomainsResult {
    success: boolean;
    results: { domain: string, available: boolean }[];
    error?: string;
}

export async function findAvailableDomains(description: string): Promise<FindDomainsResult> {
    if (!description) {
        return { success: false, error: 'Please provide a description for your application.', results: [] };
    }

    try {
        const genResult = await generateDomainNames({ applicationDescription: description });
        
        let suggestions = genResult.domainNames
            .map(name => name.toLowerCase().split('.')[0].replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, ''))
            .filter(d => d && d.length > 2);

        // Add the test domain as requested
        suggestions.push('checkmatedomains');
        
        const uniqueSuggestions = Array.from(new Set(suggestions));
        
        if (uniqueSuggestions.length === 0) {
             return { success: true, results: [] };
        }

        const availableDomains = await checkDomainAvailability(uniqueSuggestions.map(d => `${d}.com`));

        const results = uniqueSuggestions.map(suggestion => ({
            domain: suggestion,
            available: availableDomains.includes(`${suggestion}.com`),
        }));
        
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
