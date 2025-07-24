
'use server';

import { generateDomainNames } from '@/ai/flows/generate-domain-names';

// Mocked domain availability check.
async function checkDomain(domain: string): Promise<boolean> {
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    // Simulate that shorter, more common names are less likely to be available.
    const lengthFactor = Math.min(domain.length / 15, 1); // Normalize length up to 15 chars
    const availabilityChance = 0.1 + lengthFactor * 0.4; // Base 10%, up to 50% for longer names
    return Math.random() < availabilityChance;
}

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
            
            const suggestions = result.domainNames.map(name => name.toLowerCase().replace(/[^a-z0-9]/g, '')).filter(d => d && !processed.has(d));

            for (const name of suggestions) {
                if (available.length >= 5) break;

                processed.add(name);
                const isAvailable = await checkDomain(name + '.com');

                if (isAvailable) {
                    available.push(name);
                } else {
                    if (unavailable.length < 10) { // Limit the number of "garbaged" names shown
                        unavailable.push(name);
                    }
                }
            }
            attempts++;
        }

        if (available.length < 5) {
             return { success: false, error: "We couldn't find 5 available domains. Try a more detailed description!" };
        }

        return { success: true, available, unavailable };

    } catch (error) {
        console.error("Error finding available domains:", error);
        return { success: false, error: 'An unexpected error occurred while generating domains.' };
    }
}
