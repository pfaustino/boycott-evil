/**
 * Utility functions for displaying support category badges
 */

export type SupportCategory = 'ICE' | 'Israel' | 'Russia' | 'Labor' | 'Environment' | 'Animal-Testing' | 'Anti-DEI' | 'Trump-Donor' | string;

export interface SupportBadgeStyle {
    bgColor: string;
    textColor: string;
    emoji: string;
    label: string;
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
                label: 'ICE'
            };
        case 'israel':
            return {
                bgColor: 'bg-blue-100',
                textColor: 'text-blue-700',
                emoji: '🚫',
                label: 'Israel'
            };
        case 'russia':
            return {
                bgColor: 'bg-red-100',
                textColor: 'text-red-700',
                emoji: '🚫',
                label: 'Russia'
            };
        case 'labor':
            return {
                bgColor: 'bg-orange-100',
                textColor: 'text-orange-700',
                emoji: '👷',
                label: 'Labor'
            };
        case 'environment':
            return {
                bgColor: 'bg-green-100',
                textColor: 'text-green-700',
                emoji: '🌍',
                label: 'Environment'
            };
        case 'animal-testing':
        case 'animal testing':
            return {
                bgColor: 'bg-pink-100',
                textColor: 'text-pink-700',
                emoji: '🐾',
                label: 'Animal-Testing'
            };
        case 'anti-dei':
            return {
                bgColor: 'bg-purple-100',
                textColor: 'text-purple-700',
                emoji: '🏳️‍🌈',
                label: 'Anti-DEI'
            };
        case 'trump-donor':
            return {
                bgColor: 'bg-red-100',
                textColor: 'text-red-700',
                emoji: '🍊',
                label: 'Trump Donor'
            };
        default:
            return {
                bgColor: 'bg-slate-100',
                textColor: 'text-slate-700',
                emoji: '🚫',
                label: support
            };
    }
}
