// Test Namecheap API directly
import { namecheapDomainAPI } from './src/services/domain-api-namecheap.js';

async function testNamecheapAPI() {
    console.log('🧪 Testing Namecheap API...');
    
    // Check credentials
    console.log('Credentials valid:', namecheapDomainAPI.hasValidCredentials());
    
    try {
        // Test with a few sample domains
        const testDomains = ['testdomain123', 'sampledomain456', 'exampledomain789'];
        const results = await namecheapDomainAPI.checkDomainAvailability(testDomains, 'com');
        console.log('✅ Namecheap API test successful!');
        console.log('Available domains:', results);
    } catch (error) {
        console.error('❌ Namecheap API test failed:', error);
    }
}

testNamecheapAPI();
