'use server';

import fetch from 'node-fetch';

const GODADDY_API_URL = 'https://api.ote-godaddy.com/v1/domains/available';

interface GoDaddyAvailabilityResponse {
    available?: boolean;
    domain?: string;
    price?: number;
    currency?: string;
    code?: string;
    message?: string;
}

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
        // Check domains one by one since the bulk endpoint is having issues
        const availableDomains: string[] = [];
        
        for (const domain of domainsWithTld) {
            try {
                // Remove any whitespace from API key and secret
                const cleanApiKey = apiKey.trim();
                const cleanApiSecret = apiSecret.trim();
                
                const response = await fetch(`${GODADDY_API_URL}?domain=${encodeURIComponent(domain)}&checkType=FAST&forTransfer=false`, {
                    method: 'GET',
                    headers: {
                        'Authorization': `sso-key ${cleanApiKey}:${cleanApiSecret}`,
                        'Accept': 'application/json'
                    },
                });

                const json = await response.json() as GoDaddyAvailabilityResponse;
                
                if (!response.ok) {
                    console.error(`GoDaddy API HTTP error for ${domain}:`, json);
                    if (json.code === 'UNABLE_TO_AUTHENTICATE') {
                        throw new Error('GoDaddy API authentication failed. Please verify your API key and secret.');
                    }
                    continue; // Skip this domain and try the next one
                }
                
                if (json.available === true) {
                    availableDomains.push(domain.replace('.com', ''));
                }
            } catch (error) {
                console.error(`Error checking domain ${domain}:`, error);
                if (error instanceof Error && error.message.includes('authentication failed')) {
                    throw error; // Re-throw authentication errors
                }
                continue; // Skip this domain and try the next one
            }
        }
            
        return availableDomains;

    } catch (error) {
        console.error('Failed to check domains with GoDaddy:', error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unknown error occurred during the domain check with GoDaddy.');
    }
}
