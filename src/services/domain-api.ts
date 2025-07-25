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
    const userName = process.env.NAMECHEAP_API_USER;

    if (!apiKey || !apiUser || !clientIp || !userName) {
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
            console.error(`Namecheap API error for ${domainToCheck}: ${response.status} ${response.statusText}`, xmlText);
            return false;
        }
        
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix : "@_" });
        const jsonObj = parser.parse(xmlText);
        
        const result = jsonObj?.ApiResponse?.CommandResponse?.DomainCheckResult;

        if (!result) {
             console.error(`Could not parse Namecheap response for ${domainToCheck}`, jsonObj);
             return false;
        }
        
        return result['@_Available'] === 'true';

    } catch (error) {
        console.error(`Failed to check domain ${domain}.com with Namecheap:`, error);
        return false;
    }
}
