/**
 * Namecheap Domain API Integration Service
 * 
 * This service provides domain availability checking using the Namecheap Domains API.
 * It follows the official Namecheap API documentation and handles production endpoints.
 * 
 * Features:
 * - Batch domain availability checking
 * - Production and sandbox environment support
 * - Comprehensive error handling and logging
 * - Credential validation
 * - XML response parsing
 * 
 * API Documentation: https://www.namecheap.com/support/api/
 * 
 * @author DandanITman
 * @version 2.0.0 - Production-ready Namecheap integration
 */

import fetch from 'node-fetch';

/**
 * Interface for individual domain check results
 */
export interface NamecheapDomainResult {
  domain: string;
  available: boolean;
  errorMessage?: string;
}

/**
 * Namecheap Domain API Service Class
 * 
 * Handles all interactions with the Namecheap Domains API including:
 * - Credential management and validation
 * - API request construction and execution
 * - XML response parsing
 * - Error handling and logging
 */
export class NamecheapDomainAPI {
  private apiUser: string;
  private apiKey: string;
  private username: string;
  private clientIp: string;
  private baseUrl: string;

  /**
   * Initialize Namecheap API client with environment variables
   * 
   * Required Environment Variables:
   * - NAMECHEAP_API_KEY: API key from Namecheap account
   * - NAMECHEAP_API_USER: Your Namecheap username
   * - NAMECHEAP_USERNAME: Your Namecheap username (same as API_USER)
   * - NAMECHEAP_CLIENT_IP: Your whitelisted IP address
   * - NAMECHEAP_SANDBOX: 'true' for sandbox, 'false' for production (optional)
   */
  constructor() {
    // Load credentials from environment variables as per Namecheap API documentation
    this.apiKey = process.env.NAMECHEAP_API_KEY || '';
    this.apiUser = process.env.NAMECHEAP_API_USER || '';
    this.username = process.env.NAMECHEAP_USERNAME || '';
    this.clientIp = process.env.NAMECHEAP_CLIENT_IP || '';
    
    // Use production API endpoint by default, sandbox if explicitly requested
    this.baseUrl = process.env.NAMECHEAP_SANDBOX === 'true' 
      ? 'https://api.sandbox.namecheap.com/xml.response'
      : 'https://api.namecheap.com/xml.response';
  }

  /**
   * Validates that all required Namecheap API credentials are present
   * 
   * @returns {boolean} True if all required credentials are valid
   */
  hasValidCredentials(): boolean {
    const hasKey = !!(this.apiKey && this.apiKey.length > 10);
    const hasUser = !!(this.apiUser && this.apiUser.length > 0);
    const hasUsername = !!(this.username && this.username.length > 0);
    const hasClientIp = !!(this.clientIp && this.clientIp.length > 0);
    
    console.log(`🔍 Namecheap credentials check:`);
    console.log(`   API Key: ${hasKey ? '✅' : '❌'} (${this.apiKey ? this.apiKey.substring(0, 8) + '...' : 'missing'})`);
    console.log(`   API User: ${hasUser ? '✅' : '❌'} (${this.apiUser})`);
    console.log(`   Username: ${hasUsername ? '✅' : '❌'} (${this.username})`);
    console.log(`   Client IP: ${hasClientIp ? '✅' : '❌'} (${this.clientIp})`);
    console.log(`   API URL: ${this.baseUrl}`);
    
    return hasKey && hasUser && hasUsername && hasClientIp;
  }

  async checkDomainAvailability(domains: string[], tld: string = 'com'): Promise<string[]> {
    if (!this.hasValidCredentials()) {
      throw new Error('Namecheap API credentials not configured properly');
    }

    console.log(`🔍 Checking ${domains.length} domains with Namecheap API (Production)`);

    try {
      // Format domains with TLD - Namecheap expects fully qualified domain names
      const fullDomains = domains.map(domain => `${domain}.${tld}`);
      const domainList = fullDomains.join(',');

      // Build API URL exactly as per Namecheap documentation
      const params = new URLSearchParams({
        ApiUser: this.apiUser,
        ApiKey: this.apiKey,
        UserName: this.username,
        ClientIp: this.clientIp,
        Command: 'namecheap.domains.check',
        DomainList: domainList
      });

      const url = `${this.baseUrl}?${params.toString()}`;
      
      console.log(`📡 Namecheap API Request URL: ${this.baseUrl}`);
      console.log(`📡 Namecheap Command: namecheap.domains.check`);
      console.log(`📡 Domains to check: ${domainList}`);

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'DomainLookup/1.0 (+https://github.com/DandanITman/DomainLookup)'
        }
      });

      if (!response.ok) {
        throw new Error(`Namecheap API returned ${response.status}: ${response.statusText}`);
      }

      const xmlText = await response.text();
      console.log('📥 Namecheap API Response XML:', xmlText);

      // Parse XML response according to Namecheap documentation
      const availableDomains = this.parseNamecheapResponse(xmlText);
      
      console.log(`✅ Namecheap found ${availableDomains.length} available domains:`, availableDomains);
      return availableDomains;

    } catch (error) {
      console.error('❌ Namecheap API Error:', error);
      throw error;
    }
  }

  private parseNamecheapResponse(xmlText: string): string[] {
    const availableDomains: string[] = [];

    try {
      console.log('🔍 Parsing Namecheap XML response...');
      
      // Check for API errors first
      if (xmlText.includes('Status="ERROR"')) {
        console.error('❌ Namecheap API returned ERROR status');
        const errorMatch = xmlText.match(/<Error Number="([^"]+)">([^<]+)</);
        if (errorMatch) {
          throw new Error(`Namecheap API Error ${errorMatch[1]}: ${errorMatch[2]}`);
        }
        throw new Error('Namecheap API returned an error but error details could not be parsed');
      }

      // Look for DomainCheckResult elements with Available="true"
      // Example: <DomainCheckResult Domain="testapi.xyz" Available="false" ErrorNo="0" Description="" IsPremiumName="false" .../>
      const domainResultPattern = /<DomainCheckResult\s+([^>]+)\/>/g;
      let match;
      
      while ((match = domainResultPattern.exec(xmlText)) !== null) {
        const attributes = match[1];
        console.log('🔍 Found DomainCheckResult:', attributes);
        
        // Extract domain and availability
        const domainMatch = attributes.match(/Domain="([^"]+)"/);
        const availableMatch = attributes.match(/Available="([^"]+)"/);
        
        if (domainMatch && availableMatch) {
          const domain = domainMatch[1];
          const available = availableMatch[1].toLowerCase() === 'true';
          
          console.log(`🔍 Domain: ${domain}, Available: ${available}`);
          
          if (available) {
            // Extract just the domain name without TLD for consistency with our API
            const domainName = domain.split('.')[0];
            availableDomains.push(domainName);
            console.log(`✅ Added available domain: ${domainName}`);
          }
        }
      }

      console.log(`🎯 Parsed ${availableDomains.length} available domains from Namecheap response`);
      return availableDomains;

    } catch (error) {
      console.error('❌ Error parsing Namecheap response:', error);
      console.error('Raw XML response:', xmlText);
      throw new Error(`Failed to parse Namecheap response: ${error}`);
    }
  }
}

export const namecheapDomainAPI = new NamecheapDomainAPI();
