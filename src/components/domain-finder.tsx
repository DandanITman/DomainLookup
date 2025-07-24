
"use client";

import React, { useState, useTransition, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { findAvailableDomains } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2, Search, Sparkles, XCircle } from 'lucide-react';

interface DomainResult {
    domain: string;
    available: boolean;
}

function DomainListItem({ domain, available }: { domain: string; available: boolean }) {
    return (
        <li className="flex items-center justify-between p-3 rounded-lg transition-all duration-300 animate-in fade-in">
            <div className="flex items-center gap-3">
                {available ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-destructive" />}
                <span className={`font-mono ${!available ? 'line-through text-muted-foreground' : ''}`}>
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

const MAX_DOMAINS_TO_SHOW = 50;

export default function DomainFinder() {
    const [description, setDescription] = useState('');
    const [results, setResults] = useState<DomainResult[]>([]);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    
    const resetState = () => {
        setResults([]);
    };

    const handleSubmit = useCallback((e?: React.FormEvent<HTMLFormElement>) => {
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

        startTransition(async () => {
            const res = await findAvailableDomains(description);

            if (!res.success) {
                toast({
                    variant: 'destructive',
                    title: 'Oh no!',
                    description: res.error,
                });
                return;
            }
            
            setResults(res.results);

            const availableCount = res.results.filter(r => r.available).length;
            if (res.results.length > 0 && availableCount === 0) {
                toast({
                   variant: 'destructive',
                   title: 'No luck this time',
                   description: "We couldn't find any available domains in that batch. Try a more specific description or generate new ideas.",
               });
           }
        });
    }, [description, toast]);


    const handleCopyToClipboard = (domain: string) => {
        navigator.clipboard.writeText(`${domain}.com`);
        toast({
            title: 'Copied!',
            description: `${domain}.com is now in your clipboard.`,
        });
    };

    const availableResults = results.filter(r => r.available);
    const unavailableResults = results.filter(r => !r.available);

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
                        {availableResults.length > 0 ? (
                           <div>
                                <h3 className="text-2xl font-headline text-center mb-4">Here are your available domains!</h3>
                                <div className="space-y-3">
                                    {availableResults.map(res => (
                                        <AvailableDomainCard key={res.domain} domain={res.domain} onSelect={handleCopyToClipboard} />
                                    ))}
                                </div>
                            </div>
                        ) : !isPending && (
                            <div className="text-center p-4">
                                <p className="font-body text-muted-foreground">No available domains found in this batch. Try a new search!</p>
                            </div>
                        )}
                        
                        {unavailableResults.length > 0 && (
                            <div>
                                <h3 className="text-lg font-headline text-center my-4">Unavailable Domains ({unavailableResults.length})</h3>
                                <ul className="space-y-2 rounded-lg border p-2 max-h-60 overflow-y-auto">
                                    {unavailableResults.map((res) => (
                                        <DomainListItem key={res.domain} domain={res.domain} available={res.available} />
                                    ))}
                                 </ul>
                             </div>
                        )}
                    </div>
                )}
            </CardContent>
            {(results.length > 0 || isPending) && (
                <CardFooter className="flex-col gap-2">
                    <Button variant="outline" className="w-full" onClick={() => handleSubmit()} disabled={isPending}>
                        {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        {isPending ? 'Searching...' : 'I want different ones!'}
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
