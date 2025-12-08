import { LucideIcon, TreePalm, User, Users } from "lucide-react";

export type VactionOption = {
    tags: string[];
    image: LucideIcon;
    color: string;
    gradient: string;
    title: string;
    price: string;
    description: string;
    features: string[];
    hasExpert: boolean;
    hasSupport: boolean;
    hasAccountManager: boolean;
};

export const VACATION_OPTIONS: VactionOption[] = [
    {
        tags: ['BEST SELLING'],
        image: User,
        color: 'text-emerald-600',
        gradient: 'from-emerald-600/50 via-emerald-600/10',
        title: 'Flexible Individual Travel',
        price: '$1,500',
        description: "Perfect for families who want to travel with privacy, need full flexibility, and have specific requirements.",
        features: [
            'Private Trip',
            'Fully customised',
            'Private vehicle and driver',
            'Flexibility during travelling',
        ],
        hasExpert: true,
        hasSupport: true,
        hasAccountManager: true,
    },
    {
        tags: ['GROUP ADVENTURE', '20% OFF'],
        image: Users,
        color: 'text-blue-600',
        gradient: 'from-blue-600/50 via-blue-600/10',
        title: 'Small Group Tours',
        price: '$1,800',
        description: "Ideal for those who love travelling in small groups, and have less flexibility during their travels and dates.",
        features: [
            'Travelling with small groups of up to 16 people',
            'A fixed tour plan and fixed dates',
            'Shared transport',
            'No flexibility during travelling',
        ],
        hasExpert: true,
        hasSupport: true,
        hasAccountManager: false,
    },
    {
        tags: ['ULTIMATE RELAXING', '30% OFF'],
        image: TreePalm,
        color: 'text-amber-600',
        gradient: 'from-amber-400/50 via-amber-400/10',
        title: 'Holiday Getaways',
        price: '$1,100',
        description: "Ideal for those who have flexible travel schedules, seeking discounted getaways, offering reduced prices and shorter travel distances.",
        features: [
            'Private Trip',
            'Fixed travel period',
            'Private vehicle and driver',
            'Flexibility during travelling',
        ],
        hasExpert: false,
        hasSupport: true,
        hasAccountManager: false,
    },
];