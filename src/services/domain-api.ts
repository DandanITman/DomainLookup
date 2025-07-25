
'use server';

import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';

const NAMECHEAP_API_URL = 'https://api.namecheap.com/xml.response';

/**
 * Checks a single domain for availability using the Namecheap API.
 *
 * @param domain The domain name to check (e.g., "example"). Do not include the TLD.
 * @returns A promise that resolves to a boolean indicating availability.
 */
export async function checkDomainAvailability(domain: string): Promise<boolean> {
    const apiKey = process.env.NAMECHEAP_API_KEY;
    const apiUser = process.env.NAMECHEAP_API_USER;
    const clientIp = process.env.NAMECHEAP_CLIENT_IP;
    const userName = apiUser;

    if (!apiKey || !apiUser || !clientIp) {
        throw new Error("Namecheap API credentials are not configured. Please set NAMECHEAP_API_USER, NAMECHEAP_API_KEY, and NAMECHEAP_CLIENT_IP in your .env file.");
    }

    try {
        const url = `${NAMECHEAP_API_URL}?ApiUser=${apiUser}&ApiKey=${apiKey}&UserName=${userName}&Command=namecheap.domains.check&ClientIp=${clientIp}&DomainList=${domain}.com`;
        
        const response = await fetch(url);
        const xmlText = await response.text();

        if (!response.ok) {
            console.error(`Namecheap API HTTP error for domain ${domain}: ${response.status} ${response.statusText}`, xmlText);
            throw new Error(`Error from Namecheap API: HTTP ${response.status}`);
        }
        
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix : "@_" });
        const jsonObj = parser.parse(xmlText);

        const apiResponse = jsonObj?.ApiResponse;
        if (apiResponse?.['@_Status'] === 'ERROR') {
            const error = apiResponse?.Errors?.Error;
            const errorMessage = Array.isArray(error) ? error.map(e => e['#text']).join(', ') : error['#text'];
            console.error(`Namecheap API returned an error for domain ${domain}:`, errorMessage);
            throw new Error(`Error from Namecheap API: ${errorMessage}`);
        }
        
        const result = apiResponse?.CommandResponse?.DomainCheckResult;
        if (!result) {
             console.error(`Could not parse Namecheap response for domain ${domain}`, jsonObj);
             throw new Error(`Could not parse Namecheap response for domain ${domain}`);
        }

        return result['@_Available'] === 'true';

    } catch (error) {
        console.error(`Failed to check domain ${domain} with Namecheap:`, error);
        // Re-throw the error to be handled by the caller
        if (error instanceof Error) {
            throw error;
        }
        throw new Error(`An unknown error occurred during check for ${domain}.`);
    }
}
