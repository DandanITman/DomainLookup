
import fetch from 'node-fetch';

const GODADDY_API_URL = 'https://api.godaddy.com/v1/domains/available';

/**
 * Checks domain availability using the GoDaddy API.
 * 
 * To use this, you need a GoDaddy developer API key and secret. 
 * You can get one from https://developer.godaddy.com/keys.
 * 
 * Once you have your key and secret, add them to your .env file:
 * GODADDY_API_KEY=your_api_key
 * GODADDY_API_SECRET=your_api_secret
 * 
 * @param domain The domain name to check (e.g., "example.com").
 * @returns A promise that resolves to true if the domain is available, false otherwise.
 */
export async function checkDomainAvailability(domain: string): Promise<boolean> {
    const apiKey = process.env.GODADDY_API_KEY;
    const apiSecret = process.env.GODADDY_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new Error("GoDaddy API key and secret are not configured. Please set GODADDY_API_KEY and GODADDY_API_SECRET in your .env file.");
    }

    try {
        const response = await fetch(`${GODADDY_API_URL}?checkType=FAST`, {
            method: 'POST',
            headers: {
                'Authorization': `sso-key ${apiKey}:${apiSecret}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify([domain])
        });

        if (!response.ok) {
            // GoDaddy API returns 422 for invalid domains, 429 for rate limits, etc.
            // We'll treat all non-200 responses as "unavailable" for simplicity.
            console.error(`GoDaddy API error for ${domain}: ${response.status} ${response.statusText}`);
            return false;
        }

        const data: any = await response.json();
        
        // The API returns an array of domain objects. We only sent one.
        if (data.domains && data.domains.length > 0) {
            return data.domains[0].available;
        }

        return false;

    } catch (error) {
        console.error(`Failed to check domain ${domain}:`, error);
        // If the API call fails for any reason, assume the domain is not available.
        return false;
    }
}
