
'use server';

import { generateDomainNames } from '@/ai/flows/generate-domain-names';
import { checkDomainAvailability } from '@/services/domain-api';


interface FindDomainsResult {
    success: boolean;
    available: string[];
    unavailable: string[];
    error?: string;
}

// Function to shuffle an array
function shuffle<T>(array: T[]): T[] {
    let currentIndex = array.length,  randomIndex;
  
    // While there remain elements to shuffle.
    while (currentIndex > 0) {
      // Pick a remaining element.
      randomIndex = Math.floor(Math.random() * currentIndex);
      currentIndex--;
  
      // And swap it with the current element.
      [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }
  
    return array;
}


export async function findAvailableDomains(description: string): Promise<FindDomainsResult> {
    if (!description) {
        return { success: false, error: 'Please provide a description for your application.', available: [], unavailable: [] };
    }

    try {
        const available: string[] = [];
        const unavailable: string[] = [];
        const processed = new Set<string>();

        const result = await generateDomainNames({ applicationDescription: description });
        
        const suggestions = result.domainNames
            .map(name => name.toLowerCase().split('.')[0].replace(/[^a-z0-9-]/g, '').replace(/^-+|-+$/g, ''))
            .filter(d => d && d.length > 2 && !processed.has(d));

        const uniqueSuggestions = Array.from(new Set(suggestions));
        const shuffledSuggestions = shuffle(uniqueSuggestions);
        
        const checks = shuffledSuggestions.slice(0, 10);

        for (const name of checks) {
            if (processed.has(name)) continue;
            processed.add(name);

            try {
                const isAvailable = await checkDomainAvailability(name + '.com');
                if (isAvailable) {
                    available.push(name);
                } else {
                    unavailable.push(name);
                }
            } catch (e) {
                 unavailable.push(name);
            }
        }
        
        return { 
            success: true, 
            available,
            unavailable,
        };

    } catch (error) {
        console.error("Error finding available domains:", error);
        if (error instanceof Error) {
            if (error.message.includes('GODADDY_API_KEY')) {
                 return { success: false, error: 'GoDaddy API Key is missing. Please set it in your .env file.', available: [], unavailable: [] };
            }
            if (error.message.includes('GEMINI_API_KEY') || error.message.includes('GOOGLE_API_KEY')) {
                 return { success: false, error: 'Gemini API Key is missing. Please set it in your .env file to generate domain ideas.', available: [], unavailable: [] };
            }
        }
        return { success: false, error: 'An unexpected error occurred while generating domains.', available: [], unavailable: [] };
    }
}
