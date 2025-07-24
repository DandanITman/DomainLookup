import fetch from 'node-fetch';
import { XMLParser } from 'fast-xml-parser';

const NAMECHEAP_API_URL = 'https://api.namecheap.com/xml.response';

/**
 * Checks a list of domains for availability using the Namecheap API.
 *
 * To use this, you need a Namecheap account and API credentials.
 * 1. Enable API access in your Namecheap profile: https://www.namecheap.com/support/api/intro/
 * 2. Whitelist the IP address of the machine running this code.
 *
 * Once you have your credentials, add them to your .env file:
 * NAMECHEAP_API_USER=your_namecheap_username
 * NAMECHEAP_API_KEY=your_namecheap_api_key
 * NAMECHEAP_CLIENT_IP=your_whitelisted_ip_address
 *
 * @param domains An array of domain names to check (e.g., ["example", "test"]). Do not include the TLD.
 * @returns A promise that resolves to an array of available domain names (just the name, without .com).
 */
export async function checkDomainAvailability(domains: string[]): Promise<string[]> {
    const apiKey = process.env.NAMECHEAP_API_KEY;
    const apiUser = process.env.NAMECHEAP_API_USER;
    const clientIp = process.env.NAMECHEAP_CLIENT_IP;
    const userName = process.env.NAMECHEAP_API_USER; // Namecheap uses `UserName` and `ApiUser` for the same value

    if (!apiKey || !apiUser || !clientIp || !userName) {
        throw new Error("Namecheap API credentials are not configured. Please set NAMECHEAP_API_USER, NAMECHEAP_API_KEY, and NAMECHEAP_CLIENT_IP in your .env file.");
    }

    if (domains.length === 0) {
        return [];
    }

    try {
        const domainList = domains.map(d => `${d}.com`).join(',');
        const url = `${NAMECHEAP_API_URL}?ApiUser=${apiUser}&ApiKey=${apiKey}&UserName=${userName}&Command=namecheap.domains.check&ClientIp=${clientIp}&DomainList=${domainList}`;
        
        console.log("Sending request to Namecheap API for domains:", domainList);

        const response = await fetch(url);
        const xmlText = await response.text();
        
        console.log('Namecheap API Raw Response Body:', xmlText);

        if (!response.ok) {
            console.error(`Namecheap API error: ${response.status} ${response.statusText}`, xmlText);
            return [];
        }
        
        const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix : "@_" });
        const jsonObj = parser.parse(xmlText);
        
        const results = jsonObj?.ApiResponse?.CommandResponse?.DomainCheckResult;

        if (!results) {
             console.error('Could not parse Namecheap response or find DomainCheckResult', jsonObj);
             return [];
        }
        
        const availableDomains: string[] = [];
        
        // Namecheap returns an array for multiple domains, but an object for a single domain.
        const resultArray = Array.isArray(results) ? results : [results];

        for (const result of resultArray) {
            if (result['@_Available'] === 'true') {
                // Return just the domain name, without the .com TLD
                availableDomains.push(result['@_Domain'].replace('.com', ''));
            }
        }
        
        return availableDomains;

    } catch (error) {
        console.error(`Failed to check domains with Namecheap:`, error);
        return [];
    }
}
