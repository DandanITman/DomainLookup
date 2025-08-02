import fetch from 'node-fetch';

export interface DomainAvailabilityResult {
  domain: string;
  available: boolean;
  error?: string;
}

// Alternative domain availability checker using multiple APIs
export class AlternativeDomainAPI {
  
  // Using DNS lookup to check if domain exists (simple but effective)
  async checkDomainViaDNS(domain: string): Promise<DomainAvailabilityResult> {
    try {
      const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
      const data = await response.json() as any;
      
      // If DNS resolution returns no answers, domain might be available
      const available = !data.Answer || data.Answer.length === 0;
      
      return {
        domain,
        available,
      };
    } catch (error) {
      return {
        domain,
        available: false,
        error: `DNS check failed: ${error}`,
      };
    }
  }

  // Using RapidAPI's domain availability service (if we want to integrate it later)
  async checkDomainViaRapidAPI(domain: string): Promise<DomainAvailabilityResult> {
    // This would require a RapidAPI key, for now return unavailable
    return {
      domain,
      available: false,
      error: 'RapidAPI integration not configured',
    };
  }

  // Using a simple HTTP check to see if domain has a website
  async checkDomainViaHTTP(domain: string): Promise<DomainAvailabilityResult> {
    try {
      // Use AbortController for timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      const response = await fetch(`https://${domain}`, {
        method: 'HEAD',
        signal: controller.signal,
        redirect: 'manual',
      });
      
      clearTimeout(timeoutId);
      
      // If we get any response, domain likely exists
      const available = response.status >= 400;
      
      return {
        domain,
        available,
      };
    } catch (error) {
      // If fetch fails completely, domain might be available
      return {
        domain,
        available: true,
      };
    }
  }

  // Combined approach using multiple checks
  async checkDomainAvailability(domain: string): Promise<DomainAvailabilityResult> {
    console.log(`🔍 Checking domain availability: ${domain}`);
    
    try {
      // First try DNS check (most reliable)
      const dnsResult = await this.checkDomainViaDNS(domain);
      console.log(`DNS check for ${domain}: ${dnsResult.available ? 'Available' : 'Taken'}`);
      
      // If DNS says available, double-check with HTTP
      if (dnsResult.available) {
        const httpResult = await this.checkDomainViaHTTP(domain);
        console.log(`HTTP check for ${domain}: ${httpResult.available ? 'Available' : 'Taken'}`);
        
        // Domain is likely available if both checks agree
        return {
          domain,
          available: dnsResult.available && httpResult.available,
        };
      }
      
      return dnsResult;
    } catch (error) {
      console.error(`Error checking domain ${domain}:`, error);
      return {
        domain,
        available: false,
        error: `Check failed: ${error}`,
      };
    }
  }

  async checkMultipleDomains(
    domains: string[],
    tld: string = 'com'
  ): Promise<DomainAvailabilityResult[]> {
    console.log(`🔍 Checking ${domains.length} domains with .${tld} extension`);
    
    const fullDomains = domains.map(domain => `${domain}.${tld}`);
    
    // Check domains in parallel but limit concurrency
    const results: DomainAvailabilityResult[] = [];
    const batchSize = 3; // Check 3 domains at a time to avoid overwhelming services
    
    for (let i = 0; i < fullDomains.length; i += batchSize) {
      const batch = fullDomains.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(domain => this.checkDomainAvailability(domain))
      );
      results.push(...batchResults);
      
      // Small delay between batches
      if (i + batchSize < fullDomains.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    const availableCount = results.filter(r => r.available).length;
    console.log(`✅ Found ${availableCount} available domains out of ${results.length} checked`);
    
    return results;
  }
}

export const alternativeDomainAPI = new AlternativeDomainAPI();
