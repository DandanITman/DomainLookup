
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
 * @param domains An array of domain names to check (e.g., ["example.com", "test.com"]).
 * @returns A promise that resolves to an object with 'available' and 'unavailable' domain arrays.
 */
export async function checkDomainAvailability(domains: string[]): Promise<{ available: string[], unavailable: string[] }> {
    const apiKey = process.env.GODADDY_API_KEY;
    const apiSecret = process.env.GODADDY_API_SECRET;

    if (!apiKey || !apiSecret) {
        throw new Error("GoDaddy API key and secret are not configured. Please set GODADDY_API_KEY and GODADDY_API_SECRET in your .env file.");
    }
    
    if (domains.length === 0) {
        return { available: [], unavailable: [] };
    }

    try {
        const response = await fetch(`${GODADDY_API_URL}?checkType=FAST`, {
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
            // If the API call fails, assume all domains are unavailable for safety.
            return { available: [], unavailable: domains };
        }

        const data: any = await response.json();
        
        const available: string[] = [];
        const unavailable: string[] = [];
        
        if (data.domains && Array.isArray(data.domains)) {
            for (const item of data.domains) {
                if (item.available) {
                    available.push(item.domain);
                } else {
                    unavailable.push(item.domain);
                }
            }
        }
        
        return { available, unavailable };

    } catch (error) {
        if (error instanceof Error && error.message.includes("GoDaddy authentication failed")) {
            throw error;
        }
        console.error(`Failed to check domains:`, error);
        // If the API call fails for any reason, assume all are unavailable.
        return { available: [], unavailable: domains };
    }
}
