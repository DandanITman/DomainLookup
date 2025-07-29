
"use client";

import React, { useState, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { findAvailableDomains } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, Loader2, Search, Sparkles, XCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { POPULAR_TLDS, TLD } from '@/lib/constants';
import { PurchaseDomainDialog } from '@/components/ui/purchase-domain-dialog';
import { ShoppingCart } from 'lucide-react';

interface DomainResult {
    domain: string;
    available: boolean;
}

export default function DomainFinder() {
    const [description, setDescription] = useState('');
    const [selectedTld, setSelectedTld] = useState<TLD>('com');
    const [results, setResults] = useState<DomainResult[]>([]);
    const [isPending, startTransition] = useTransition();
    const { toast } = useToast();
    const [selectedDomain, setSelectedDomain] = useState<string | null>(null);
    const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
    
    const handleSearch = () => {
        if (!description) {
            toast({
                variant: 'destructive',
                title: 'Heads up!',
                description: 'Please describe your application first.',
            });
            return;
        }

        setResults([]);

        startTransition(async () => {
            const res = await findAvailableDomains(description, selectedTld);

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
                    title: 'No domains available',
                    description: "We couldn't find any available domains in this batch. Try generating new ideas.",
                });
            }
        });
    };

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        handleSearch();
    };

    const handleCopyToClipboard = (domain: string) => {
        navigator.clipboard.writeText(`${domain}.${selectedTld}`);
        toast({
            title: 'Copied!',
            description: `${domain}.${selectedTld} is now in your clipboard.`,
        });
    };

    const availableResults = results.filter(r => r.available);
    const unavailableResults = results.filter(r => !r.available);

    return (
        <Card className="w-full shadow-2xl shadow-primary/10">
            <CardHeader>
                <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-8 w-8 text-primary" />
                    <CardTitle className="font-headline text-4xl">AI Domainly</CardTitle>
                </div>
                <CardDescription className="font-body text-base">
                    Describe your brilliant app, and we'll find the perfect, available domain for it.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="e.g., A mobile app for tracking personal fitness goals with social sharing features..."
                        className="min-h-[100px] text-base font-body"
                        disabled={isPending}
                    />
                    <div className="flex gap-4 items-center">
                        <Select
                            value={selectedTld}
                            onValueChange={(value) => setSelectedTld(value as TLD)}
                            disabled={isPending}
                        >
                            <SelectTrigger className="w-[180px] h-[40px] bg-background text-foreground border-input">
                                <SelectValue>
                                    {POPULAR_TLDS.map((tld) => (
                                        tld.value === selectedTld && (
                                            <div key={tld.value} className="font-medium text-white">
                                                {tld.label}
                                            </div>
                                        )
                                    ))}
                                </SelectValue>
                            </SelectTrigger>
                            <SelectContent 
                                className="max-h-[300px] overflow-y-auto bg-zinc-900 border border-zinc-800" 
                                position="popper"
                            >
                                {POPULAR_TLDS.map((tld) => (
                                    <SelectItem 
                                        key={tld.value} 
                                        value={tld.value}
                                        className="flex flex-col items-start py-2 hover:bg-zinc-800"
                                    >
                                        <div className="flex flex-col gap-0.5">
                                            <div className="font-medium text-white">{tld.label}</div>
                                            <div className="text-xs text-zinc-400">{tld.description}</div>
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        <Button type="submit" className="flex-1" size="lg" disabled={isPending}>
                            {isPending ? <Loader2 className="animate-spin" /> : <Search className="mr-2" />}
                            {results.length > 0 ? 'Generate New Ideas' : 'Find My Domain'}
                        </Button>
                    </div>
                </form>

                <div className="min-h-[200px] mt-8">
                    {isPending && (
                        <div className="text-center p-8 flex flex-col items-center gap-4">
                            <Loader2 className="h-12 w-12 animate-spin text-primary" />
                            <p className="font-body text-muted-foreground">Let's find your domain...</p>
                        </div>
                    )}

                    {availableResults.length > 0 && (
                        <div>
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <CheckCircle className="text-green-500" />
                                Available Domains ({availableResults.length})
                            </h3>
                            <div className="space-y-2">
                                {availableResults.map((result) => (
                                    <div
                                        key={result.domain}
                                        className="flex items-center justify-between p-3 rounded-lg bg-green-500/10 border border-green-500/20"
                                    >
                                        <span className="font-mono text-lg">{result.domain}.{selectedTld}</span>
                                        <div className="flex items-center gap-2">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleCopyToClipboard(result.domain)}
                                            >
                                                Copy
                                            </Button>
                                            <Button
                                                variant="default"
                                                size="sm"
                                                onClick={() => {
                                                    setSelectedDomain(`${result.domain}.${selectedTld}`);
                                                    setPurchaseDialogOpen(true);
                                                }}
                                            >
                                                <ShoppingCart className="h-4 w-4 mr-2" />
                                                Buy Domain
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <p className="text-sm text-muted-foreground mt-6 text-center">
                                Thank you for using the app! API calls cost money, so if you want to help keep this running, feel free to{' '}
                                <a 
                                    href="dummy.url" 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="underline hover:text-primary transition-colors"
                                >
                                    donate
                                </a>
                            </p>
                        </div>
                    )}

                    {unavailableResults.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                <XCircle className="text-destructive" />
                                Unavailable Domains ({unavailableResults.length})
                            </h3>
                            <div className="space-y-2">
                                {unavailableResults.map((result) => (
                                    <div
                                        key={result.domain}
                                        className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20"
                                    >
                                        <span className="font-mono text-lg line-through opacity-75">
                                            {result.domain}.{selectedTld}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </CardContent>
            <PurchaseDomainDialog
                open={purchaseDialogOpen}
                onOpenChange={setPurchaseDialogOpen}
                domainName={selectedDomain || ''}
            />
        </Card>
    );
}
