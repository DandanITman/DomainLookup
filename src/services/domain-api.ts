
'use server';

import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';

const NAMECHEAP_API_URL = 'https://api.namecheap.com/xml.response';

/**
 * Checks a single domain for availability using the Namecheap API.
 *
 * @param domain The domain name to check (e.g., "example"). Do not include the TLD.
 * @returns A promise that resolves to true if the domain is available, false otherwise.
 */
export async function checkDomainAvailability(domain: string): Promise<boolean> {
    const apiKey = process.env.NAMECHEAP_API_KEY;
    const apiUser = process.env.NAMECHEAP_API_USER;
    const clientIp = process.env.NAMECHEAP_CLIENT_IP;
    const userName = apiUser; // Namecheap uses the same value for ApiUser and UserName

    if (!apiKey || !apiUser || !clientIp) {
        throw new Error("Namecheap API credentials are not configured. Please set NAMECHEAP_API_USER, NAMECHEAP_API_KEY, and NAMECHEAP_CLIENT_IP in your .env file.");
    }
    
    if (!domain) {
        return false;
    }

    try {
        const domainToCheck = `${domain}.com`;
        const url = `${NAMECHEAP_API_URL}?ApiUser=${apiUser}&ApiKey=${apiKey}&UserName=${userName}&Command=namecheap.domains.check&ClientIp=${clientIp}&DomainList=${domainToCheck}`;
        
        const response = await fetch(url);
        const xmlText = await response.text();

        if (!response.ok) {
            console.error(`Namecheap API HTTP error for ${domainToCheck}: ${response.status} ${response.statusText}`, xmlText);
            throw new Error(`Error from Namecheap API: HTTP ${response.status}`);
        }
        
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix : "@_" });
        const jsonObj = parser.parse(xmlText);

        const apiResponse = jsonObj?.ApiResponse;
        if (apiResponse?.['@_Status'] === 'ERROR') {
            const error = apiResponse?.Errors?.Error;
            const errorMessage = Array.isArray(error) ? error[0]['#text'] : error['#text'];
            console.error(`Namecheap API returned an error for ${domainToCheck}:`, errorMessage);
            throw new Error(`Error from Namecheap API: ${errorMessage}`);
        }
        
        const result = apiResponse?.CommandResponse?.DomainCheckResult;

        if (!result) {
             console.error(`Could not parse Namecheap response for ${domainToCheck}`, jsonObj);
             return false;
        }
        
        return result['@_Available'] === 'true';

    } catch (error) {
        console.error(`Failed to check domain ${domain}.com with Namecheap:`, error);
        // Re-throw the error so it can be caught by the action
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unknown error occurred during domain check.');
    }
}
