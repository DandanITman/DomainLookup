'use server';

import { TLD } from '@/lib/constants';

// Mock domain availability check for development/testing
export async function checkDomainAvailabilityMock(domains: string[], tld: TLD = 'com'): Promise<string[]> {
    console.log('🧪 Using MOCK domain availability check');
    console.log('Domains to check:', domains);
    console.log('TLD:', tld);

    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Mock logic: randomly make some domains available
    const availableDomains = domains.filter((domain, index) => {
        // Make roughly 30% of domains "available" for demo purposes
        const isAvailable = Math.random() < 0.3;
        console.log(`${domain}.${tld}: ${isAvailable ? '✅ AVAILABLE' : '❌ NOT AVAILABLE'}`);
        return isAvailable;
    });

    console.log('Mock available domains:', availableDomains);
    return availableDomains;
}
