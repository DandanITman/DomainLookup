
import fetch from 'node-fetch';

const GODADDY_API_URL = 'https://api.godaddy.com/v1/domains/available';

/**
 * Checks a list of domains for availability using the GoDaddy API's bulk endpoint.
 *
 * To use this, you need a GoDaddy developer API key and secret.
 * You can get one from https://developer.godaddy.com/keys.
 *
 * Once you have your key and secret, add them to your .env file:
 * GODADDY_API_KEY=your_api_key
 * GODADDY_API_SECRET=your_api_secret
 *
 * @param domains An array of domain names to check (e.g., ["example.com", "test.com"]).
 * @returns A promise that resolves to an array of available domain names.
 */
export async function checkDomainAvailability(domains: string[]): Promise<string[]> {
    const apiKey = process.env.GODADDY_API_KEY;
    const apiSecret = process.env.GODADDY_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new Error("GoDaddy API key and secret are not configured. Please set GODADDY_API_KEY and GODADDY_API_SECRET in your .env file.");
    }
    
    if (domains.length === 0) {
        return [];
    }

    try {
        const response = await fetch(GODADDY_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `sso-key ${apiKey}:${apiSecret}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(domains)
        });

        if (!response.ok) {
            console.error(`GoDaddy API error: ${response.status} ${response.statusText}`);
            const errorBody = await response.text();
            console.error('Error Body:', errorBody);
            if (response.status === 401) {
                throw new Error("GoDaddy authentication failed. Please check your GODADDY_API_KEY and GODADDY_API_SECRET.");
            }
            // If the API call fails for another reason, return an empty array.
            return [];
        }

        const data: { domains: { domain: string, available: boolean }[] } = await response.json() as any;
        
        // Filter for domains that are marked as available and return just their names.
        return data.domains
            .filter(d => d.available)
            .map(d => d.domain);

    } catch (error) {
        if (error instanceof Error && error.message.includes("GoDaddy authentication failed")) {
            throw error;
        }
        console.error(`Failed to check domains:`, error);
        // If the API call fails for any reason, assume no domains are available.
        return [];
    }
}
