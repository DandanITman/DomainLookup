"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { DOMAIN_REGISTRARS } from "@/lib/constants";

interface PurchaseDomainDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    domainName: string;
}

export function PurchaseDomainDialog({
    open,
    onOpenChange,
    domainName,
}: PurchaseDomainDialogProps) {
    const handleRegistrarClick = (registrar: string) => {
        const registrarData = DOMAIN_REGISTRARS[registrar];
        const url = registrarData.referralUrl.replace('DOMAIN_NAME', domainName);
        window.open(url, '_blank');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Purchase Domain</DialogTitle>
                    <DialogDescription>
                        Choose your preferred domain registrar to purchase {domainName}
                    </DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                    {Object.entries(DOMAIN_REGISTRARS).map(([key, registrar]) => (
                        <Button
                            key={key}
                            variant="outline"
                            className="h-20 flex flex-col items-center justify-center gap-2"
                            onClick={() => handleRegistrarClick(key)}
                        >
                            {/* Using a regular img tag for better SVG support */}
                            <img
                                src={registrar.logo}
                                alt={registrar.name}
                                width="100"
                                height="30"
                                className="h-6 w-auto object-contain"
                            />
                            <span className="text-sm">{registrar.name}</span>
                        </Button>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
} 