'use server';

import fetch from 'node-fetch';

const GODADDY_API_URL = 'https://api.godaddy.com/v1/domains/available';

/**
 * Checks a list of domains for availability using the GoDaddy API.
 *
 * @param domains An array of domain names to check (e.g., ["example", "another"]). Do not include the TLD.
 * @returns A promise that resolves to an array of available domain names.
 */
export async function checkDomainAvailability(domains: string[]): Promise<string[]> {
    const apiKey = process.env.GODADDY_API_KEY;
    const apiSecret = process.env.GODADDY_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new Error("GoDaddy API credentials are not configured. Please set GODADDY_API_KEY and GODADDY_API_SECRET in your .env file.");
    }
    
    // GoDaddy API expects the TLD, so we add .com to each domain
    const domainsWithTld = domains.map(d => `${d}.com`);

    try {
        const response = await fetch(GODADDY_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `sso-key ${apiKey}:${apiSecret}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify(domainsWithTld),
        });

        const json = await response.json();
        
        if (!response.ok) {
             console.error(`GoDaddy API HTTP error: ${response.status}`, json);
             const errorMessage = json.message || `HTTP ${response.status}`;
             throw new Error(`Error from GoDaddy API: ${errorMessage}`);
        }
        
        if (!json.domains || !Array.isArray(json.domains)) {
            console.error('GoDaddy API returned an unexpected response format:', json);
            throw new Error('Could not parse GoDaddy response.');
        }

        // Filter for domains that are available and return just their names without the .com
        const availableDomains = json.domains
            .filter((d: any) => d.available === true)
            .map((d: any) => d.domain.replace('.com', ''));
            
        return availableDomains;

    } catch (error) {
        console.error('Failed to check domains with GoDaddy:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unknown error occurred during the domain check with GoDaddy.');
    }
}
