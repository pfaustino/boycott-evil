/**
 * Import Trump Campaign Donor data into evil-companies.json
 * 
 * Based on publicly documented FEC filings and news reports of major
 * Trump campaign/PAC donors (2016-2024). These are executives/owners
 * who made significant documented donations.
 * 
 * Sources: FEC.gov, OpenSecrets.org, various news outlets
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const evilCompaniesPath = path.join(__dirname, '..', 'app', 'public', 'evil-companies.json');

// Well-documented Trump campaign/PAC major donors
// Only including those with clear public record of significant donations
const trumpDonors = [
    {
        name: "Tesla",
        reason: "CEO Elon Musk donated $277M+ to Trump's America PAC in 2024",
        notes: "Musk became Trump's most prominent business ally"
    },
    {
        name: "SpaceX",
        reason: "CEO Elon Musk is a major Trump donor and ally",
        notes: "Government contractor with close Trump ties"
    },
    {
        name: "X",
        reason: "Owner Elon Musk donated $277M+ to Trump's America PAC",
        notes: "Formerly Twitter"
    },
    {
        name: "Twitter",
        reason: "Owner Elon Musk donated $277M+ to Trump's America PAC",
        notes: "Now named X"
    },
    {
        name: "The Boring Company",
        reason: "CEO Elon Musk is a major Trump campaign donor",
        notes: ""
    },
    {
        name: "Uline",
        reason: "Owners Dick and Liz Uihlein donated $100M+ to Trump-aligned PACs",
        notes: "Major GOP mega-donors, shipping supplies company"
    },
    {
        name: "My Pillow",
        reason: "CEO Mike Lindell is a prominent Trump supporter and donor",
        notes: "Lindell was involved in election denial efforts"
    },
    {
        name: "MyPillow",
        reason: "CEO Mike Lindell is a prominent Trump supporter and donor",
        notes: "Alternate spelling"
    },
    {
        name: "Las Vegas Sands",
        reason: "Miriam Adelson donated $100M+ to Trump's 2024 campaign",
        notes: "Adelson family are longtime GOP mega-donors"
    },
    {
        name: "Sands",
        reason: "Miriam Adelson donated $100M+ to Trump's 2024 campaign",
        notes: "Las Vegas Sands"
    },
    {
        name: "Venetian",
        reason: "Owned by Las Vegas Sands (Adelson family, Trump mega-donors)",
        notes: ""
    },
    {
        name: "UFC",
        reason: "CEO Dana White is a close Trump ally and RNC speaker",
        notes: "White has been a vocal Trump supporter since 2016"
    },
    {
        name: "Blackstone",
        reason: "CEO Steve Schwarzman is a major Trump donor",
        notes: "Private equity firm"
    },
    {
        name: "Goya Foods",
        reason: "CEO Robert Unanue publicly praised Trump at White House event",
        notes: "Led to boycott calls in 2020"
    },
    {
        name: "Goya",
        reason: "CEO Robert Unanue publicly praised Trump at White House event",
        notes: ""
    },
    {
        name: "Continental Resources",
        reason: "Founder Harold Hamm is a longtime Trump donor and advisor",
        notes: "Oil and gas company"
    },
    {
        name: "News Corp",
        reason: "Owner Rupert Murdoch's media empire has supported Trump",
        notes: "Parent company of Fox News, Wall Street Journal"
    },
    {
        name: "Fox News",
        reason: "Rupert Murdoch's network has been Trump's most prominent media ally",
        notes: "Part of Fox Corporation"
    },
    {
        name: "Fox Corporation",
        reason: "Rupert Murdoch's company, Trump's most prominent media supporter",
        notes: ""
    },
    {
        name: "Cantor Fitzgerald",
        reason: "CEO Howard Lutnick is Trump's Commerce Secretary nominee and major donor",
        notes: "Lutnick was Trump transition co-chair"
    },
    {
        name: "Apollo Global Management",
        reason: "CEO Marc Rowan is a major Trump donor",
        notes: "Private equity firm"
    },
    {
        name: "Susquehanna International Group",
        reason: "Co-founder Jeff Yass is a major GOP/Trump donor",
        notes: "Trading firm, TikTok investor"
    },
    {
        name: "WWE",
        reason: "Linda McMahon is Trump cabinet member, major donor, and transition chair",
        notes: "McMahon is Trump's Education Secretary nominee"
    },
    {
        name: "World Wrestling Entertainment",
        reason: "Linda McMahon is Trump cabinet member and major donor",
        notes: ""
    },
    {
        name: "TKO Group",
        reason: "Formed from WWE-UFC merger, both led by Trump allies",
        notes: ""
    },
    {
        name: "Truth Social",
        reason: "Trump's own social media company",
        notes: "Part of Trump Media & Technology Group"
    },
    {
        name: "Trump Media",
        reason: "Donald Trump's media company",
        notes: "Parent of Truth Social"
    },
    {
        name: "Beal Bank",
        reason: "Andy Beal is a major Trump donor ($20M+ to PACs)",
        notes: ""
    },
    {
        name: "Fertitta Entertainment",
        reason: "Tilman Fertitta is a major Trump donor",
        notes: "Owns Landry's, Golden Nugget casinos"
    },
    {
        name: "Landry's",
        reason: "Owner Tilman Fertitta is a major Trump donor",
        notes: "Restaurant/hospitality company"
    },
    {
        name: "Golden Nugget",
        reason: "Owner Tilman Fertitta is a major Trump donor",
        notes: "Casino chain"
    }
];

function main() {
    // Read existing evil companies
    console.log(`Reading: ${evilCompaniesPath}`);
    const existingData = JSON.parse(fs.readFileSync(evilCompaniesPath, 'utf8'));
    console.log(`Existing evil companies: ${Object.keys(existingData).length}`);
    
    let added = 0;
    let merged = 0;
    
    for (const donor of trumpDonors) {
        const normalizedName = donor.name.toLowerCase().trim();
        
        // Build reason string
        let reason = donor.reason;
        if (donor.notes) {
            reason += ` (${donor.notes})`;
        }
        
        if (existingData[normalizedName]) {
            // Merge with existing entry
            const existing = existingData[normalizedName];
            
            // Add Trump-Donor to supports if not already present
            if (!existing.supports) {
                existing.supports = [];
            }
            if (!existing.supports.includes('Trump-Donor')) {
                existing.supports.push('Trump-Donor');
            }
            
            // Append reason if different
            if (reason && !existing.reason?.includes('Trump')) {
                existing.reason = existing.reason 
                    ? `${existing.reason} | ${reason}`
                    : reason;
            }
            
            merged++;
        } else {
            // Add new entry
            existingData[normalizedName] = {
                evil: true,
                reason: reason,
                supports: ['Trump-Donor']
            };
            added++;
        }
    }
    
    // Write updated file
    fs.writeFileSync(evilCompaniesPath, JSON.stringify(existingData, null, 2), 'utf8');
    
    console.log(`\nImport complete!`);
    console.log(`  Added: ${added} new companies`);
    console.log(`  Merged: ${merged} existing companies`);
    console.log(`  Total evil companies: ${Object.keys(existingData).length}`);
    
    console.log(`\nCompanies added/updated:`);
    for (const donor of trumpDonors) {
        console.log(`  - ${donor.name}`);
    }
}

main();
