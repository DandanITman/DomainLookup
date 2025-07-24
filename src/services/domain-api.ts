import fetch from 'node-fetch';

const DOMAINR_API_URL = 'https://domainr.p.rapidapi.com/v2/status';

/**
 * Checks a list of domains for availability using the Domainr API.
 *
 * To use this, you need a Domainr API key from RapidAPI.
 * You can get one from https://rapidapi.com/domainr/api/domainr
 *
 * Once you have your key, add it to your .env file:
 * DOMAINR_API_KEY=your_domainr_api_key_here
 *
 * @param domains An array of domain names to check (e.g., ["example.com", "test.com"]).
 * @returns A promise that resolves to an array of available domain names.
 */
export async function checkDomainAvailability(domains: string[]): Promise<string[]> {
    const apiKey = process.env.DOMAINR_API_KEY;

    if (!apiKey || apiKey === 'your_domainr_api_key_here') {
        throw new Error("Domainr API key is not configured. Please set DOMAINR_API_KEY in your .env file.");
    }
    
    if (domains.length === 0) {
        return [];
    }

    try {
        const domainString = domains.join(',');
        const url = `${DOMAINR_API_URL}?domain=${domainString}`;
        
        console.log("Sending request to Domainr API for domains:", domains);

        const response = await fetch(url, {
            method: 'GET',
            headers: {
                'X-RapidAPI-Key': apiKey,
                'X-RapidAPI-Host': 'domainr.p.rapidapi.com'
            }
        });

        const responseBody = await response.json() as any;
        
        console.log('Domainr API Raw Response Body:', JSON.stringify(responseBody, null, 2));

        if (!response.ok) {
            console.error(`Domainr API error: ${response.status} ${response.statusText}`, responseBody);
            // If the API call fails for any reason, return an empty array.
            return [];
        }
        
        // Filter for domains that are marked as inactive (which means available)
        return responseBody.status
            .filter((d: { domain: string, status: string }) => d.status === 'inactive')
            .map((d: { domain: string, status: string }) => d.domain);

    } catch (error) {
        console.error(`Failed to check domains with Domainr:`, error);
        // If the API call fails for any reason, assume no domains are available.
        return [];
    }
}
