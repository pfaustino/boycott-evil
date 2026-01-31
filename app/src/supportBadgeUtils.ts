/**
 * Utility functions for displaying support category badges
 */

export type SupportCategory = 'ICE' | 'Israel' | 'Russia' | 'Labor' | 'Environment' | 'Animal-Testing' | 'Anti-DEI' | 'Trump-Donor' | 'Pro-DEI' | string;

export interface SupportBadgeStyle {
    bgColor: string;
    textColor: string;
    emoji: string;
    label: string;
    description: string;
}

/**
 * Get styling for a support category badge
 */
export function getSupportBadgeStyle(support: string): SupportBadgeStyle {
    const normalized = support.toLowerCase().trim();
    
    switch (normalized) {
        case 'ice':
            return {
                bgColor: 'bg-blue-100',
                textColor: 'text-blue-700',
                emoji: '🚫',
                label: 'ICE',
                description: 'Has contracts with U.S. Immigration and Customs Enforcement (ICE) or supports deportation operations'
            };
        case 'israel':
            return {
                bgColor: 'bg-blue-100',
                textColor: 'text-blue-700',
                emoji: '🚫',
                label: 'Israel',
                description: 'Israeli company or supports Israeli occupation/military operations'
            };
        case 'russia':
            return {
                bgColor: 'bg-red-100',
                textColor: 'text-red-700',
                emoji: '🚫',
                label: 'Russia',
                description: 'Continues operations in Russia despite invasion of Ukraine'
            };
        case 'labor':
            return {
                bgColor: 'bg-orange-100',
                textColor: 'text-orange-700',
                emoji: '👷',
                label: 'Labor',
                description: 'Known for labor rights violations, union busting, or poor worker conditions'
            };
        case 'environment':
            return {
                bgColor: 'bg-green-100',
                textColor: 'text-green-700',
                emoji: '🌍',
                label: 'Environment',
                description: 'Environmental destruction, pollution, or climate denial'
            };
        case 'animal-testing':
        case 'animal testing':
            return {
                bgColor: 'bg-pink-100',
                textColor: 'text-pink-700',
                emoji: '🐾',
                label: 'Animal-Testing',
                description: 'Tests products on animals or contributes to animal cruelty'
            };
        case 'anti-dei':
            return {
                bgColor: 'bg-purple-100',
                textColor: 'text-purple-700',
                emoji: '🏳️‍🌈',
                label: 'Anti-DEI',
                description: 'Rolled back or opposes Diversity, Equity, and Inclusion programs'
            };
        case 'trump-donor':
            return {
                bgColor: 'bg-red-100',
                textColor: 'text-red-700',
                emoji: '🍊',
                label: 'Trump Donor',
                description: 'Donated to Trump campaigns, PACs, or inauguration fund'
            };
        case 'pro-dei':
            return {
                bgColor: 'bg-emerald-100',
                textColor: 'text-emerald-700',
                emoji: '🌈',
                label: 'Pro-DEI',
                description: 'Maintains strong Diversity, Equity, and Inclusion policies'
            };
        case 'tax avoidance':
            return {
                bgColor: 'bg-yellow-100',
                textColor: 'text-yellow-700',
                emoji: '💰',
                label: 'Tax Avoidance',
                description: 'Aggressive tax avoidance schemes or offshore tax havens'
            };
        default:
            return {
                bgColor: 'bg-slate-100',
                textColor: 'text-slate-700',
                emoji: '🚫',
                label: support,
                description: `Boycott reason: ${support}`
            };
    }
}
