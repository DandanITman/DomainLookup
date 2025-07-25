
'use server';

import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';

const NAMECHEAP_API_URL = 'https://api.namecheap.com/xml.response';

/**
 * Checks a list of domains for availability using the Namecheap API.
 *
 * @param domains An array of domain names to check (e.g., ["example", "test"]). Do not include the TLD.
 * @returns A promise that resolves to an object mapping each domain to its availability status (boolean).
 */
export async function checkDomainAvailability(domains: string[]): Promise<Record<string, boolean>> {
    const apiKey = process.env.NAMECHEAP_API_KEY;
    const apiUser = process.env.NAMECHEAP_API_USER;
    const clientIp = process.env.NAMECHEAP_CLIENT_IP;
    const userName = apiUser;

    if (!apiKey || !apiUser || !clientIp) {
        throw new Error("Namecheap API credentials are not configured. Please set NAMECHEAP_API_USER, NAMECHEAP_API_KEY, and NAMECHEAP_CLIENT_IP in your .env file.");
    }
    
    if (!domains || domains.length === 0) {
        return {};
    }

    try {
        const domainList = domains.map(d => `${d}.com`).join(',');
        const url = `${NAMECHEAP_API_URL}?ApiUser=${apiUser}&ApiKey=${apiKey}&UserName=${userName}&Command=namecheap.domains.check&ClientIp=${clientIp}&DomainList=${domainList}`;
        
        const response = await fetch(url);
        const xmlText = await response.text();

        if (!response.ok) {
            console.error(`Namecheap API HTTP error: ${response.status} ${response.statusText}`, xmlText);
            throw new Error(`Error from Namecheap API: HTTP ${response.status}`);
        }
        
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix : "@_" });
        const jsonObj = parser.parse(xmlText);

        const apiResponse = jsonObj?.ApiResponse;
        if (apiResponse?.['@_Status'] === 'ERROR') {
            const error = apiResponse?.Errors?.Error;
            const errorMessage = Array.isArray(error) ? error.map(e => e['#text']).join(', ') : error['#text'];
            console.error(`Namecheap API returned an error:`, errorMessage);
            throw new Error(`Error from Namecheap API: ${errorMessage}`);
        }
        
        const results = apiResponse?.CommandResponse?.DomainCheckResult;

        if (!results) {
             console.error(`Could not parse Namecheap response`, jsonObj);
             return {};
        }

        const availability: Record<string, boolean> = {};
        const resultsArray = Array.isArray(results) ? results : [results];

        for (const result of resultsArray) {
            const domainName = result['@_Domain'].replace('.com', '');
            availability[domainName] = result['@_Available'] === 'true';
        }
        
        return availability;

    } catch (error) {
        console.error(`Failed to check domains with Namecheap:`, error);
        if (error instanceof Error) {
            throw error;
        }
        throw new Error('An unknown error occurred during domain check.');
    }
}
