
/**
 * Server Actions for Domain Lookup Application
 * 
 * This file contains Next.js server actions that handle the core business logic
 * for finding available domain names. It integrates multiple services:
 * - Google Gemini AI for domain name generation
 * - Namecheap API for primary domain availability checking
 * - DNS/HTTP alternative checker as fallback
 * - Mock service for development/testing
 * 
 * @author DandanITman
 * @version 2.0.0 - Migrated from GoDaddy to Namecheap API
 */

'use server';

import { generateDomainNames } from "@/ai/flows/generate-domain-names";
import { checkDomainAvailabilityMock } from "@/services/domain-api-mock";
import { alternativeDomainAPI } from "@/services/domain-api-alternative";
import { namecheapDomainAPI } from "@/services/domain-api-namecheap";
import { TLD } from "@/lib/constants";

/**
 * Result interface for domain search operations
 */
interface FindDomainsResult {
    success: boolean;
    error?: string;
    results: Array<{
        domain: string;
        available: boolean;
    }>;
}

/**
 * Validates Namecheap API credentials
 * Checks for required environment variables and their format
 * 
 * @returns {boolean} True if all required Namecheap credentials are present and valid
 */
function hasValidNamecheapKeys(): boolean {
    const isValid = namecheapDomainAPI.hasValidCredentials();
    console.log(`🔍 Checking Namecheap credentials: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
    return isValid;
}

/**
 * Validates Google Gemini API key
 * Ensures the API key is present, non-default, and has the correct format
 * 
 * @returns {boolean} True if Gemini API key is valid
 */
function hasValidGeminiKey(): boolean {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    return !!(apiKey && apiKey !== 'your_gemini_api_key_here' && apiKey.startsWith('AIza'));
}

/**
 * Main server action to find available domain names
 * 
 * This function orchestrates the entire domain discovery process:
 * 1. Generates domain name suggestions using Google Gemini AI
 * 2. Cleans and deduplicates the suggestions
 * 3. Checks availability using Namecheap API (primary) with fallbacks
 * 4. Returns structured results with availability status
 * 
 * Fallback Strategy:
 * - AI Generation: Gemini AI → Mock data if API fails
 * - Domain Checking: Namecheap API → DNS/HTTP checker → Mock data
 * 
 * @param {string} description - User's application/project description
 * @param {TLD} tld - Top-level domain to check (default: 'com')
 * @returns {Promise<FindDomainsResult>} Results with success status and domain list
 * 
 * @example
 * const result = await findAvailableDomains("food delivery app", "com");
 * if (result.success) {
 *   console.log("Available domains:", result.results.filter(r => r.available));
 * }
 */
export async function findAvailableDomains(description: string, tld: TLD = 'com'): Promise<FindDomainsResult> {
    try {
        // 1. Generate domain name ideas
        let domainSuggestions;
        try {
            if (!hasValidGeminiKey()) {
                // Use mock data for demonstration when no valid Gemini key
                console.log('🧪 Using MOCK domain generation (no valid Gemini API key)');
                domainSuggestions = [
                    'creativedomain', 'smartsite', 'innovatehub', 'digitalcraft', 'techsolution',
                    'webvision', 'dataflow', 'cloudnext', 'appbuilder', 'codeforge'
                ];
            } else {
                const genkitResponse = await generateDomainNames({ applicationDescription: description });
                domainSuggestions = genkitResponse.domainNames;
                if (!domainSuggestions || domainSuggestions.length === 0) {
                    return { success: false, error: 'The AI did not suggest any domain names. Please try a different description.', results: [] };
                }
            }
        } catch (error) {
            console.error("Error generating domain names:", error);
            if (error instanceof Error && (error.message.includes('GEMINI_API_KEY') || error.message.includes('GOOGLE_API_KEY'))) {
                return { success: false, error: 'Gemini API Key is missing. Please set it in your .env.local file to generate domain ideas.', results: [] };
            }
            // Fallback to mock data
            console.log('🧪 Falling back to MOCK domain generation due to error');
            domainSuggestions = [
                'backupdomain', 'fallbacksite', 'errorrecovery', 'safechoice', 'reliableapp',
                'steadytech', 'stableweb', 'securesite', 'trusteddomain', 'solidchoice'
            ];
        }
        
        // 2. Clean up and deduplicate domain names
        const uniqueSuggestions = [...new Set(domainSuggestions.map(d => d.toLowerCase().replace(/[^a-z0-9-]/g, '')))];

        // 3. Check availability for the batch of domains
        let availableDomains;
        try {
            if (!hasValidNamecheapKeys()) {
                // Use mock service when no valid API keys
                console.log('🧪 Using MOCK domain availability check (no valid Namecheap API keys)');
                availableDomains = await checkDomainAvailabilityMock(uniqueSuggestions, tld);
            } else {
                try {
                    console.log('� Using Namecheap domain availability checker (Primary)');
                    availableDomains = await namecheapDomainAPI.checkDomainAvailability(uniqueSuggestions, tld);
                } catch (namecheapError) {
                    console.error("Namecheap API failed, trying alternative domain checker:", namecheapError);
                    
                    // Fallback to DNS/HTTP method
                    console.log('🔄 Using alternative domain availability checker (DNS + HTTP)');
                    const alternativeResults = await alternativeDomainAPI.checkMultipleDomains(uniqueSuggestions, tld);
                    availableDomains = alternativeResults
                        .filter(result => result.available)
                        .map(result => result.domain.replace(`.${tld}`, ''));
                }
            }
        } catch (error) {
            console.error("Domain availability check error:", error);
            if (error instanceof Error) {
                if (error.message.includes('NAMECHEAP_API_KEY') || error.message.includes('Namecheap')) {
                    return { 
                        success: false, 
                        error: 'The Namecheap API credentials are not properly configured. Please check your .env.local file.', 
                        results: [] 
                    };
                }
                // Fallback to mock service on API error
                console.log('🧪 Falling back to MOCK domain availability check due to API error');
                availableDomains = await checkDomainAvailabilityMock(uniqueSuggestions, tld);
            } else {
                return { 
                    success: false, 
                    error: 'Could not check domain availability. Using mock data for demonstration.', 
                    results: [] 
                };
            }
        }
        
        // 4. Map all suggestions to results, marking them as available or not
        const results = uniqueSuggestions.map(domain => ({
            domain,
            available: availableDomains.includes(domain)
        }));

        return { 
            success: true, 
            results: results
        };

    } catch (error) {
        console.error("A critical error occurred in findAvailableDomains:", error);
        return { success: false, error: 'An unexpected server error occurred. Please check the server logs.', results: [] };
    }
}
