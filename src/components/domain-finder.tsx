
"use client";

import React, { useState, useTransition, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { findAvailableDomains } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2, Search, Sparkles, Trash2, XCircle } from 'lucide-react';

interface DomainResults {
    available: string[];
    unavailable: string[];
}

function DomainListItem({ domain, status, onAnimationEnd }: { domain: string, status: 'unavailable' | 'available', onAnimationEnd?: () => void }) {
    const animationDelay = Math.random() * 0.5;
    return (
        <li
            onAnimationEnd={onAnimationEnd}
            className={`flex items-center justify-between p-3 rounded-lg transition-all duration-500 ease-out ${status === 'unavailable' ? 'animate-garbage-out' : 'animate-in fade-in'}`}
            style={{ animationDelay: `${animationDelay}s` }}
        >
            <div className="flex items-center gap-3">
                {status === 'available' ? <CheckCircle className="h-5 w-5 text-green-500" /> : <XCircle className="h-5 w-5 text-destructive" />}
                <span className={`font-mono ${status === 'unavailable' ? 'line-through text-muted-foreground' : ''}`}>{domain}.com</span>
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


export default function DomainFinder() {
    const [description, setDescription] = useState('');
    const [results, setResults] = useState<DomainResults | null>(null);
    const [isPending, startTransition] = useTransition();
    const [showAvailable, setShowAvailable] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        if (results) {
            const unavailableCount = results.unavailable.length;
            if (unavailableCount === 0) {
                setShowAvailable(true);
                return;
            }

            const totalAnimationTime = 500 + unavailableCount * 100;
            const timer = setTimeout(() => {
                setShowAvailable(true);
            }, totalAnimationTime);

            return () => clearTimeout(timer);
        } else {
            setShowAvailable(false);
        }
    }, [results]);

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
        setResults(null);
        setShowAvailable(false);

        startTransition(async () => {
            const res = await findAvailableDomains(description);
            if (res.success) {
                setResults({ available: res.available!, unavailable: res.unavailable! });
            } else {
                setResults(null);
                toast({
                    variant: 'destructive',
                    title: 'Oh no!',
                    description: res.error,
                });
            }
        });
    };

    const handleCopyToClipboard = (domain: string) => {
        navigator.clipboard.writeText(`${domain}.com`);
        toast({
            title: 'Copied!',
            description: `${domain}.com is now in your clipboard.`,
        });
    }

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

                {isPending && (
                    <div className="text-center p-8 flex flex-col items-center gap-4">
                        <Loader2 className="h-12 w-12 animate-spin text-primary" />
                        <p className="font-body text-muted-foreground">Searching the cosmos for your perfect domain...</p>
                    </div>
                )}
                
                {results && (
                    <div className="mt-6">
                        <div className="space-y-2">
                            {!showAvailable && results.unavailable.map((domain, index) => (
                                <DomainListItem key={domain} domain={domain} status="unavailable" />
                            ))}
                        </div>
                        
                        {showAvailable && (
                            <div className="space-y-4">
                               <h3 className="text-2xl font-headline text-center mb-4">Here are your available domains!</h3>
                                {results.available.map(domain => (
                                    <AvailableDomainCard key={domain} domain={domain} onSelect={handleCopyToClipboard} />
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
            {results && showAvailable && (
                <CardFooter>
                    <Button variant="outline" className="w-full" onClick={() => handleSubmit()} disabled={isPending}>
                        {isPending ? <Loader2 className="animate-spin" /> : <Sparkles />}
                        I don't like these, find more!
                    </Button>
                </CardFooter>
            )}
        </Card>
    );
}
