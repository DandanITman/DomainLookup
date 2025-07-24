
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

const MAX_ATTEMPTS = 5; // Try 5 batches of 10 (50 domains total)
const REQUIRED_AVAILABLE = 5;

export default function DomainFinder() {
    const [description, setDescription] = useState('');
    const [results, setResults] = useState<DomainResult[]>([]);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const attempts = useRef(0);
    const availableCount = useRef(0);
    const stopSearching = useRef(false);

    const resetState = () => {
        setResults([]);
        attempts.current = 0;
        availableCount.current = 0;
        stopSearching.current = false;
    };

    const fetchAndCheckDomains = useCallback(async () => {
        if (stopSearching.current || attempts.current >= MAX_ATTEMPTS) {
            if (availableCount.current === 0) {
                 toast({
                    variant: 'destructive',
                    title: 'No domains found',
                    description: "We couldn't find any available domains. Try a different description.",
                });
            }
            return;
        }

        attempts.current += 1;
        
        const res = await findAvailableDomains(description);

        if (!res.success) {
            toast({
                variant: 'destructive',
                title: 'Oh no!',
                description: res.error,
            });
            stopSearching.current = true;
            return;
        }

        // Add new domains with 'checking' status
        const checkingDomains: DomainResult[] = res.available.concat(res.unavailable).map(d => ({ domain: d, status: 'checking' }));
        setResults(prev => [...prev, ...checkingDomains]);
        
        // Simulate checking by revealing status one by one
        for (const domain of res.unavailable) {
            await new Promise(resolve => setTimeout(resolve, 150)); // stagger updates
            setResults(prev => prev.map(r => r.domain === domain ? { ...r, status: 'unavailable' } : r));
        }
        for (const domain of res.available) {
            await new Promise(resolve => setTimeout(resolve, 150));
            setResults(prev => prev.map(r => r.domain === domain ? { ...r, status: 'available' } : r));
            availableCount.current++;
        }

        if (availableCount.current < REQUIRED_AVAILABLE) {
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

    const handleCopyToClipboard = (domain: string) => {
        navigator.clipboard.writeText(`${domain}.com`);
        toast({
            title: 'Copied!',
            description: `${domain}.com is now in your clipboard.`,
        });
    };

    const availableResults = results.filter(r => r.status === 'available');
    const otherResults = results.filter(r => r.status !== 'available');

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
                                <h3 className="text-lg font-headline text-center my-4">Search progress...</h3>
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
            {results.length > 0 && (
                <CardFooter>
                    <Button variant="outline" className="w-full" onClick={handleSubmit} disabled={isPending}>
                        {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        {isPending ? 'Searching...' : 'I want different ones!'}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
