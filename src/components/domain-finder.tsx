
"use client";

import React, { useState, useTransition, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { findAvailableDomains } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2, Search, Sparkles, XCircle } from 'lucide-react';

interface DomainResult {
    domain: string;
    status: 'checking' | 'available' | 'unavailable';
}

function DomainListItem({ domain, status }: { domain: string; status: 'checking' | 'available' | 'unavailable' }) {
    return (
        <li className="flex items-center justify-between p-3 rounded-lg transition-all duration-300 animate-in fade-in">
            <div className="flex items-center gap-3">
                {status === 'checking' && <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />}
                {status === 'available' && <CheckCircle className="h-5 w-5 text-green-500" />}
                {status === 'unavailable' && <XCircle className="h-5 w-5 text-destructive" />}
                <span className={`font-mono ${status === 'unavailable' ? 'line-through text-muted-foreground' : ''}`}>
                    {domain}.com
                </span>
            </div>
        </li>
    );
}

function AvailableDomainCard({ domain, onSelect }: { domain: string, onSelect: (domain: string) => void }) {
    const animationDelay = Math.random() * 0.3;
    return (
        <div 
            className="p-4 border rounded-lg bg-card hover:border-primary transition-all duration-300 cursor-pointer animate-in fade-in slide-in-from-bottom-5"
            onClick={() => onSelect(domain)}
            style={{ animationDelay: `${animationDelay}s` }}
        >
            <div className="flex justify-between items-center">
                <span className="font-mono text-lg font-medium text-primary-foreground">{domain}.com</span>
                <CheckCircle className="h-6 w-6 text-green-500" />
            </div>
            <p className="text-sm text-muted-foreground mt-1">Click to copy</p>
        </div>
    );
}

const MAX_DOMAINS_TO_CHECK = 150;
const REQUIRED_AVAILABLE = 5;

export default function DomainFinder() {
    const [description, setDescription] = useState('');
    const [results, setResults] = useState<DomainResult[]>([]);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const stopSearching = useRef(false);
    const processedDomains = useRef(new Set<string>());
    const domainsChecked = useRef(0);
    const availableCount = useRef(0);


    const resetState = () => {
        setResults([]);
        processedDomains.current.clear();
        domainsChecked.current = 0;
        availableCount.current = 0;
        stopSearching.current = false;
    };

    const fetchAndCheckDomains = useCallback(async () => {
        if (stopSearching.current) return;

        if (domainsChecked.current >= MAX_DOMAINS_TO_CHECK) {
            if (availableCount.current === 0) {
                 toast({
                    variant: 'destructive',
                    title: 'Search complete',
                    description: "We couldn't find any available domains in the first 150 results. Try a more specific description or run the search again.",
                });
            }
            stopSearching.current = true;
            return;
        }
        
        const res = await findAvailableDomains(description);

        if (stopSearching.current) return;

        if (!res.success) {
            toast({
                variant: 'destructive',
                title: 'Oh no!',
                description: res.error,
            });
            stopSearching.current = true;
            return;
        }
        
        // Add new domains to the list with a 'checking' status, avoiding duplicates
        const newDomainsToCheck: DomainResult[] = [];
        res.results.forEach(result => {
            if (!processedDomains.current.has(result.domain)) {
                newDomainsToCheck.push({ domain: result.domain, status: 'checking' });
                processedDomains.current.add(result.domain);
            }
        });
        
        // Add new unique domains to the results list
        if (newDomainsToCheck.length > 0) {
            setResults(prev => [...prev, ...newDomainsToCheck]);
        }

        // Update status of each domain as it's checked
        for (const result of res.results) {
             if (stopSearching.current) break;

            await new Promise(resolve => setTimeout(resolve, 50)); // Small delay for UX
            
            const newStatus = result.available ? 'available' : 'unavailable';
            
            if (result.available) {
                availableCount.current++;
            }

            setResults(prev => prev.map(r => r.domain === result.domain ? { ...r, status: newStatus } : r));
            domainsChecked.current++;
        }

        if (availableCount.current < REQUIRED_AVAILABLE && !stopSearching.current) {
            // Give a moment before fetching more
            await new Promise(resolve => setTimeout(resolve, 300));
            fetchAndCheckDomains();
        } else {
            stopSearching.current = true;
        }

    }, [description, toast]);


    const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
        e?.preventDefault();
        if (!description) {
            toast({
                variant: 'destructive',
                title: 'Heads up!',
                description: 'Please describe your application first.',
            });
            return;
        }
        resetState();

        startTransition(() => {
            fetchAndCheckDomains();
        });
    };
    
    useEffect(() => {
        return () => {
            stopSearching.current = true;
        }
    }, []);

    const handleCopyToClipboard = (domain: string) => {
        navigator.clipboard.writeText(`${domain}.com`);
        toast({
            title: 'Copied!',
            description: `${domain}.com is now in your clipboard.`,
        });
    };

    const availableResults = results.filter(r => r.status === 'available');
    const otherResults = results.filter(r => r.status !== 'available');

    const showStopButton = isPending && !stopSearching.current && availableCount.current >= REQUIRED_AVAILABLE;

    return (
        <Card className="w-full shadow-2xl shadow-primary/10">
            <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-8 w-8 text-primary" />
                    <CardTitle className="font-headline text-4xl">DomainDarling</CardTitle>
                </div>
                <CardDescription className="font-body text-base">
                    Describe your brilliant app, and we'll find the perfect, available .com domain for it.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit}>
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., A mobile app for tracking personal fitness goals with social sharing features..."
                        className="min-h-[100px] text-base font-body"
                        disabled={isPending}
                    />
                    <Button type="submit" className="w-full mt-4" size="lg" disabled={isPending}>
                        {isPending ? <Loader2 className="animate-spin" /> : <Search />}
                        Find My Domain
                    </Button>
                </form>

                {isPending && results.length === 0 && (
                    <div className="text-center p-8 flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="font-body text-muted-foreground">Let's find your domain...</p>
                    </div>
                )}
                
                {results.length > 0 && (
                     <div className="mt-6 space-y-4">
                        {availableResults.length > 0 && (
                           <div>
                                <h3 className="text-2xl font-headline text-center mb-4">Here are your available domains!</h3>
                                <div className="space-y-3">
                                    {availableResults.map(res => (
                                        <AvailableDomainCard key={res.domain} domain={res.domain} onSelect={handleCopyToClipboard} />
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {otherResults.length > 0 && (
                            <div>
                                <h3 className="text-lg font-headline text-center my-4">Search progress... ({domainsChecked.current}/{MAX_DOMAINS_TO_CHECK})</h3>
                                <ul className="space-y-2 rounded-lg border p-2 max-h-60 overflow-y-auto">
                                    {otherResults.map((res) => (
                                        <DomainListItem key={res.domain} domain={res.domain} status={res.status} />
                                    ))}
                                 </ul>
                             </div>
                        )}
                    </div>
                )}
            </CardContent>
            {(results.length > 0 || isPending) && (
                <CardFooter className="flex-col gap-2">
                     {showStopButton && (
                        <Button variant="ghost" className="w-full" onClick={() => (stopSearching.current = true)}>
                            Stop Searching
                        </Button>
                     )}
                    <Button variant="outline" className="w-full" onClick={handleSubmit} disabled={isPending}>
                        {isPending && !stopSearching.current ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        {isPending && !stopSearching.current ? 'Searching...' : 'I want different ones!'}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
