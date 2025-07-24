
import fetch from 'node-fetch';

const GODADDY_API_URL = 'https://api.godaddy.com/v1/domains/available';

/**
 * Checks a single domain's availability using the GoDaddy API.
 * 
 * To use this, you need a GoDaddy developer API key and secret. 
 * You can get one from https://developer.godaddy.com/keys.
 * 
 * Once you have your key and secret, add them to your .env file:
 * GODADDY_API_KEY=your_api_key
 * GODADDY_API_SECRET=your_api_secret
 * 
 * @param domain A single domain name to check (e.g., "example.com").
 * @returns A promise that resolves to true if available, false otherwise.
 */
export async function checkDomainAvailability(domain: string): Promise<boolean> {
    const apiKey = process.env.GODADDY_API_KEY;
    const apiSecret = process.env.GODADDY_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new Error("GoDaddy API key and secret are not configured. Please set GODADDY_API_KEY and GODADDY_API_SECRET in your .env file.");
    }

    try {
        const response = await fetch(`${GODADDY_API_URL}?domain=${domain}`, {
            method: 'GET',
            headers: {
                'Authorization': `sso-key ${apiKey}:${apiSecret}`,
                'Accept': 'application/json'
            }
        });

        if (!response.ok) {
            console.error(`GoDaddy API error for domain ${domain}: ${response.status} ${response.statusText}`);
            const errorBody = await response.text();
            console.error('Error Body:', errorBody);
            if (response.status === 401) {
                throw new Error("GoDaddy authentication failed. Please check your GODADDY_API_KEY and GODADDY_API_SECRET.");
            }
            // If the API call fails for a reason other than 404 (not found), assume unavailable.
            return false;
        }

        const data: any = await response.json();
        return data.available === true;

    } catch (error) {
        if (error instanceof Error && error.message.includes("GoDaddy authentication failed")) {
            throw error;
        }
        console.error(`Failed to check domain ${domain}:`, error);
        // If the API call fails for any reason, assume it's unavailable.
        return false;
    }
}
