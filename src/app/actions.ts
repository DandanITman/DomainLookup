
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

        while (available.length < 5 && attempts < 5) { // Safety break after 5 GenAI calls
            const result = await generateDomainNames({ applicationDescription: description });
            
            const suggestions = result.domainNames.map(name => name.toLowerCase().split('.')[0].replace(/[^a-z0-9-]/g, '')).filter(d => d && !processed.has(d));

            const availabilityChecks = suggestions.map(async (name) => {
                if (processed.has(name)) return;
                processed.add(name);

                try {
                    const isAvailable = await checkDomainAvailability(name + '.com');
                    if (isAvailable) {
                        if(available.length < 5) available.push(name);
                    } else {
                        if (unavailable.length < 10) unavailable.push(name);
                    }
                } catch (e) {
                     if (unavailable.length < 10) unavailable.push(name);
                }
            });

            await Promise.all(availabilityChecks);

            attempts++;
        }

        if (available.length === 0 && attempts >= 5) {
             return { success: false, error: "We couldn't find any available domains after several attempts. Please try a more detailed description or try again later." };
        }

        return { success: true, available, unavailable: unavailable.slice(0, 10 - available.length) };

    } catch (error) {
        console.error("Error finding available domains:", error);
        if (error instanceof Error && error.message.includes('API key')) {
            return { success: false, error: error.message };
        }
        return { success: false, error: 'An unexpected error occurred while generating domains.' };
    }
}
