'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface APIStatus {
  name: string;
  status: 'unknown' | 'working' | 'error' | 'no-credentials';
  message?: string;
  lastChecked?: Date;
}

export function APIDebugPanel() {
  const [apiStatuses, setApiStatuses] = useState<APIStatus[]>([
    { name: 'Google Gemini AI', status: 'unknown' },
    { name: 'GoDaddy Domains', status: 'unknown' },
    { name: 'Alternative DNS/HTTP', status: 'unknown' },
    { name: 'Namecheap Domains', status: 'unknown' },
  ]);
  const [testing, setTesting] = useState(false);

  const testAPIs = async () => {
    setTesting(true);
    const updated: APIStatus[] = [];

    try {
      // Test each API
      for (const api of apiStatuses) {
        try {
          const response = await fetch('/api/debug/test-api', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ apiName: api.name })
          });

          const result = await response.json();
          
          updated.push({
            name: api.name,
            status: result.success ? 'working' : 'error',
            message: result.message,
            lastChecked: new Date()
          });
        } catch (error) {
          updated.push({
            name: api.name,
            status: 'error',
            message: `Test failed: ${error}`,
            lastChecked: new Date()
          });
        }
      }

      setApiStatuses(updated);
    } catch (error) {
      console.error('API testing error:', error);
    } finally {
      setTesting(false);
    }
  };

  const getStatusColor = (status: APIStatus['status']) => {
    switch (status) {
      case 'working': return 'bg-green-100 text-green-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'no-credentials': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: APIStatus['status']) => {
    switch (status) {
      case 'working': return '✅ Working';
      case 'error': return '❌ Error';
      case 'no-credentials': return '⚠️ No Credentials';
      default: return '❓ Unknown';
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>API Status Dashboard</CardTitle>
        <CardDescription>
          Check the status of all configured APIs and services
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={testAPIs} 
          disabled={testing}
          className="w-full"
        >
          {testing ? 'Testing APIs...' : 'Test All APIs'}
        </Button>

        <div className="space-y-3">
          {apiStatuses.map((api, index) => (
            <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex-1">
                <h3 className="font-medium">{api.name}</h3>
                {api.message && (
                  <p className="text-sm text-gray-600 mt-1">{api.message}</p>
                )}
                {api.lastChecked && (
                  <p className="text-xs text-gray-400 mt-1">
                    Last checked: {api.lastChecked.toLocaleTimeString()}
                  </p>
                )}
              </div>
              <Badge className={getStatusColor(api.status)}>
                {getStatusText(api.status)}
              </Badge>
            </div>
          ))}
        </div>

        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium text-blue-900 mb-2">Current Issues Identified:</h4>
          <ul className="text-sm text-blue-700 space-y-1">
            <li>• GoDaddy API returning 403 "ACCESS_DENIED" - credentials may lack domain API permissions</li>
            <li>• Google Gemini AI is working correctly</li>
            <li>• Alternative DNS/HTTP checker implemented as fallback</li>
            <li>• Namecheap API available as secondary fallback (requires setup)</li>
          </ul>
        </div>

        <div className="mt-4 p-4 bg-green-50 rounded-lg">
          <h4 className="font-medium text-green-900 mb-2">Recommendations:</h4>
          <ul className="text-sm text-green-700 space-y-1">
            <li>• Verify GoDaddy API key has domains.read permissions</li>
            <li>• Consider setting up Namecheap API as reliable alternative</li>
            <li>• DNS/HTTP fallback is currently functional for basic checking</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
