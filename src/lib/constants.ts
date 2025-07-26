export const POPULAR_TLDS = [
    { value: 'com', label: '.com', description: 'Most common and widely recognized' },
    { value: 'ai', label: '.ai', description: 'Perfect for AI and tech companies' },
    { value: 'net', label: '.net', description: 'Great for network/tech companies' },
    { value: 'org', label: '.org', description: 'Ideal for organizations' },
    { value: 'io', label: '.io', description: 'Popular in tech/startup space' },
    { value: 'app', label: '.app', description: 'Perfect for applications' },
    { value: 'dev', label: '.dev', description: 'For developers and tech' },
    { value: 'tech', label: '.tech', description: 'Technology focused' },
    { value: 'co', label: '.co', description: 'Short alternative to .com' },
    { value: 'me', label: '.me', description: 'Personal websites' },
    { value: 'site', label: '.site', description: 'General purpose websites' },
    { value: 'xyz', label: '.xyz', description: 'Modern and flexible' },
] as const;

export type TLD = typeof POPULAR_TLDS[number]['value']; 