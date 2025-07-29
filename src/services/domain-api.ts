'use server';

import fetch from 'node-fetch';
import { TLD } from '@/lib/constants';

// Base URL from GoDaddy documentation
const GODADDY_API_URL = 'https://api.ote-godaddy.com/v1/domains';

interface GoDaddyAvailabilityResponse {
    available: boolean;
    domain: string;
    price?: number;
    currency?: string;
    period?: number;
}

export async function checkDomainAvailability(domains: string[], tld: TLD = 'com'): Promise<string[]> {
    console.log('\n=== Starting Domain Availability Check ===');
    console.log('Domains to check:', domains);
    console.log('TLD:', tld);

    const apiKey = process.env.GODADDY_API_KEY?.trim();
    const apiSecret = process.env.GODADDY_API_SECRET?.trim();

    console.log('\n=== API Credentials ===');
    console.log({
        apiKeyPresent: !!apiKey,
        apiKeyLength: apiKey?.length,
        apiSecretPresent: !!apiSecret,
        apiSecretLength: apiSecret?.length,
        apiKeyFirstChars: apiKey ? `${apiKey.substring(0, 5)}...` : 'missing'
    });

    if (!apiKey || !apiSecret) {
        throw new Error("GoDaddy API credentials are not configured properly.");
    }

    try {
        const availableDomains: string[] = [];

        // Check domains in parallel for better performance
        const checkPromises = domains.map(async (domain) => {
            try {
                const fullDomain = `${domain}.${tld}`;
                // Using the direct availability check endpoint
                const checkUrl = `${GODADDY_API_URL}/available?domain=${encodeURIComponent(fullDomain)}`;
                
                console.log('\n=== Making API Request ===');
                console.log('URL:', checkUrl);
                console.log('Domain:', fullDomain);
                console.log('Auth:', `sso-key ${apiKey.substring(0, 5)}...`);

                const response = await fetch(checkUrl, {
                    method: 'GET',
                    headers: {
                        'Authorization': `sso-key ${apiKey}:${apiSecret}`,
                        'Accept': 'application/json'
                    }
                });

                console.log('\n=== API Response ===');
                console.log('Status:', response.status);
                console.log('Status Text:', response.statusText);
                console.log('Headers:', Object.fromEntries(response.headers.entries()));
                
                const responseText = await response.text();
                console.log('Raw Response:', responseText);

                if (!response.ok) {
                    console.error('\n=== API Error ===');
                    console.error({
                        status: response.status,
                        statusText: response.statusText,
                        body: responseText,
                        headers: Object.fromEntries(response.headers.entries())
                    });
                    return null;
                }

                try {
                    const result = JSON.parse(responseText) as GoDaddyAvailabilityResponse;
                    console.log('\n=== Parsed Result ===');
                    console.log('Result:', result);

                    if (result.available === true) {
                        console.log('✅ Domain is AVAILABLE:', fullDomain);
                        return domain;
                    } else {
                        console.log('❌ Domain is NOT available:', fullDomain);
                        return null;
                    }

                } catch (parseError) {
                    console.error('\n=== Parse Error ===');
                    console.error('Failed to parse response:', {
                        error: parseError instanceof Error ? parseError.message : 'Unknown error',
                        responseText
                    });
                    return null;
                }
            } catch (error) {
                console.error('\n=== Request Error ===');
                console.error(`Error checking domain ${domain}:`, {
                    error: error instanceof Error ? error.message : 'Unknown error'
                });
                return null;
            }
        });

        // Wait for all checks to complete
        const results = await Promise.all(checkPromises);
        
        // Filter out null results and collect available domains
        const validResults = results.filter((domain): domain is string => domain !== null);

        console.log('\n=== Final Results ===');
        console.log('Available domains:', validResults);
        console.log('Total available:', validResults.length);
        
        return validResults;

    } catch (error) {
        console.error('\n=== Critical Error ===');
        console.error('Failed to check domain availability:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : 'No stack trace'
        });
        throw error;
    }
}
