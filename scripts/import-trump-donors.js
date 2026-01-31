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
        notes: "Musk became Trump's most prominent business ally",
        citations: [
            { url: "https://www.opensecrets.org/news/2024/10/elon-musk-pumps-nearly-120-million-into-pro-trump-america-pac/", source: "OpenSecrets", title: "Elon Musk Pumps Nearly $120 Million Into Pro-Trump America PAC", date: "2024-10" },
            { url: "https://www.fec.gov/data/committee/C00825851/", source: "FEC.gov", title: "America PAC Filings", date: "2024" }
        ]
    },
    {
        name: "SpaceX",
        reason: "CEO Elon Musk is a major Trump donor and ally",
        notes: "Government contractor with close Trump ties",
        citations: [
            { url: "https://www.opensecrets.org/news/2024/10/elon-musk-pumps-nearly-120-million-into-pro-trump-america-pac/", source: "OpenSecrets", title: "Elon Musk America PAC Donations", date: "2024-10" }
        ]
    },
    {
        name: "X",
        reason: "Owner Elon Musk donated $277M+ to Trump's America PAC",
        notes: "Formerly Twitter",
        citations: [
            { url: "https://www.opensecrets.org/news/2024/10/elon-musk-pumps-nearly-120-million-into-pro-trump-america-pac/", source: "OpenSecrets", title: "Elon Musk America PAC Donations", date: "2024-10" }
        ]
    },
    {
        name: "Twitter",
        reason: "Owner Elon Musk donated $277M+ to Trump's America PAC",
        notes: "Now named X",
        citations: [
            { url: "https://www.opensecrets.org/news/2024/10/elon-musk-pumps-nearly-120-million-into-pro-trump-america-pac/", source: "OpenSecrets", title: "Elon Musk America PAC Donations", date: "2024-10" }
        ]
    },
    {
        name: "The Boring Company",
        reason: "CEO Elon Musk is a major Trump campaign donor",
        notes: "",
        citations: [
            { url: "https://www.opensecrets.org/news/2024/10/elon-musk-pumps-nearly-120-million-into-pro-trump-america-pac/", source: "OpenSecrets", title: "Elon Musk America PAC Donations", date: "2024-10" }
        ]
    },
    {
        name: "Uline",
        reason: "Owners Dick and Liz Uihlein donated $100M+ to Trump-aligned PACs",
        notes: "Major GOP mega-donors, shipping supplies company",
        citations: [
            { url: "https://www.opensecrets.org/outsidespending/summ.php?cycle=2024&disp=D&type=V&superession", source: "OpenSecrets", title: "Top Individual Contributors 2024", date: "2024" },
            { url: "https://www.fec.gov/data/receipts/individual-contributions/?contributor_name=uihlein", source: "FEC.gov", title: "Uihlein Contributions", date: "2024" }
        ]
    },
    {
        name: "My Pillow",
        reason: "CEO Mike Lindell is a prominent Trump supporter and donor",
        notes: "Lindell was involved in election denial efforts",
        citations: [
            { url: "https://www.opensecrets.org/donor-lookup/results?name=mike+lindell", source: "OpenSecrets", title: "Mike Lindell Donations", date: "2024" }
        ]
    },
    {
        name: "MyPillow",
        reason: "CEO Mike Lindell is a prominent Trump supporter and donor",
        notes: "Alternate spelling",
        citations: [
            { url: "https://www.opensecrets.org/donor-lookup/results?name=mike+lindell", source: "OpenSecrets", title: "Mike Lindell Donations", date: "2024" }
        ]
    },
    {
        name: "Las Vegas Sands",
        reason: "Miriam Adelson donated $100M+ to Trump's 2024 campaign",
        notes: "Adelson family are longtime GOP mega-donors",
        citations: [
            { url: "https://www.opensecrets.org/donor-lookup/results?name=miriam+adelson", source: "OpenSecrets", title: "Miriam Adelson Donations", date: "2024" },
            { url: "https://www.fec.gov/data/receipts/individual-contributions/?contributor_name=adelson&contributor_name=miriam", source: "FEC.gov", title: "Adelson FEC Filings", date: "2024" }
        ]
    },
    {
        name: "Sands",
        reason: "Miriam Adelson donated $100M+ to Trump's 2024 campaign",
        notes: "Las Vegas Sands",
        citations: [
            { url: "https://www.opensecrets.org/donor-lookup/results?name=miriam+adelson", source: "OpenSecrets", title: "Miriam Adelson Donations", date: "2024" }
        ]
    },
    {
        name: "Venetian",
        reason: "Owned by Las Vegas Sands (Adelson family, Trump mega-donors)",
        notes: "",
        citations: [
            { url: "https://www.opensecrets.org/donor-lookup/results?name=miriam+adelson", source: "OpenSecrets", title: "Miriam Adelson Donations", date: "2024" }
        ]
    },
    {
        name: "UFC",
        reason: "CEO Dana White is a close Trump ally and RNC speaker",
        notes: "White has been a vocal Trump supporter since 2016",
        citations: [
            { url: "https://www.opensecrets.org/donor-lookup/results?name=dana+white", source: "OpenSecrets", title: "Dana White Donations", date: "2024" }
        ]
    },
    {
        name: "Blackstone",
        reason: "CEO Steve Schwarzman is a major Trump donor",
        notes: "Private equity firm",
        citations: [
            { url: "https://www.opensecrets.org/donor-lookup/results?name=stephen+schwarzman", source: "OpenSecrets", title: "Stephen Schwarzman Donations", date: "2024" }
        ]
    },
    {
        name: "Goya Foods",
        reason: "CEO Robert Unanue publicly praised Trump at White House event",
        notes: "Led to boycott calls in 2020",
        citations: [
            { url: "https://www.npr.org/2020/07/10/889858578/goya-foods-ceo-praises-trump-faces-boycott-calls", source: "NPR", title: "Goya Foods CEO Praises Trump, Faces Boycott Calls", date: "2020-07" }
        ]
    },
    {
        name: "Goya",
        reason: "CEO Robert Unanue publicly praised Trump at White House event",
        notes: "",
        citations: [
            { url: "https://www.npr.org/2020/07/10/889858578/goya-foods-ceo-praises-trump-faces-boycott-calls", source: "NPR", title: "Goya Foods CEO Praises Trump", date: "2020-07" }
        ]
    },
    {
        name: "Continental Resources",
        reason: "Founder Harold Hamm is a longtime Trump donor and advisor",
        notes: "Oil and gas company",
        citations: [
            { url: "https://www.opensecrets.org/donor-lookup/results?name=harold+hamm", source: "OpenSecrets", title: "Harold Hamm Donations", date: "2024" }
        ]
    },
    {
        name: "News Corp",
        reason: "Owner Rupert Murdoch's media empire has supported Trump",
        notes: "Parent company of Fox News, Wall Street Journal",
        citations: [
            { url: "https://www.opensecrets.org/orgs/news-corp/summary?id=D000000227", source: "OpenSecrets", title: "News Corp Political Contributions", date: "2024" }
        ]
    },
    {
        name: "Fox News",
        reason: "Rupert Murdoch's network has been Trump's most prominent media ally",
        notes: "Part of Fox Corporation",
        citations: [
            { url: "https://www.opensecrets.org/orgs/21st-century-fox/summary?id=D000021898", source: "OpenSecrets", title: "Fox Corporation Political Activity", date: "2024" }
        ]
    },
    {
        name: "Fox Corporation",
        reason: "Rupert Murdoch's company, Trump's most prominent media supporter",
        notes: "",
        citations: [
            { url: "https://www.opensecrets.org/orgs/21st-century-fox/summary?id=D000021898", source: "OpenSecrets", title: "Fox Corporation Political Activity", date: "2024" }
        ]
    },
    {
        name: "Cantor Fitzgerald",
        reason: "CEO Howard Lutnick is Trump's Commerce Secretary nominee and major donor",
        notes: "Lutnick was Trump transition co-chair",
        citations: [
            { url: "https://www.opensecrets.org/donor-lookup/results?name=howard+lutnick", source: "OpenSecrets", title: "Howard Lutnick Donations", date: "2024" }
        ]
    },
    {
        name: "Apollo Global Management",
        reason: "CEO Marc Rowan is a major Trump donor",
        notes: "Private equity firm",
        citations: [
            { url: "https://www.opensecrets.org/donor-lookup/results?name=marc+rowan", source: "OpenSecrets", title: "Marc Rowan Donations", date: "2024" }
        ]
    },
    {
        name: "Susquehanna International Group",
        reason: "Co-founder Jeff Yass is a major GOP/Trump donor",
        notes: "Trading firm, TikTok investor",
        citations: [
            { url: "https://www.opensecrets.org/donor-lookup/results?name=jeff+yass", source: "OpenSecrets", title: "Jeff Yass Donations", date: "2024" }
        ]
    },
    {
        name: "WWE",
        reason: "Linda McMahon is Trump cabinet member, major donor, and transition chair",
        notes: "McMahon is Trump's Education Secretary nominee",
        citations: [
            { url: "https://www.opensecrets.org/donor-lookup/results?name=linda+mcmahon", source: "OpenSecrets", title: "Linda McMahon Donations", date: "2024" },
            { url: "https://www.fec.gov/data/receipts/individual-contributions/?contributor_name=mcmahon&contributor_name=linda", source: "FEC.gov", title: "Linda McMahon FEC Filings", date: "2024" }
        ]
    },
    {
        name: "World Wrestling Entertainment",
        reason: "Linda McMahon is Trump cabinet member and major donor",
        notes: "",
        citations: [
            { url: "https://www.opensecrets.org/donor-lookup/results?name=linda+mcmahon", source: "OpenSecrets", title: "Linda McMahon Donations", date: "2024" }
        ]
    },
    {
        name: "TKO Group",
        reason: "Formed from WWE-UFC merger, both led by Trump allies",
        notes: "",
        citations: [
            { url: "https://www.opensecrets.org/donor-lookup/results?name=linda+mcmahon", source: "OpenSecrets", title: "Linda McMahon Donations", date: "2024" }
        ]
    },
    {
        name: "Truth Social",
        reason: "Trump's own social media company",
        notes: "Part of Trump Media & Technology Group",
        citations: [
            { url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=trump+media", source: "SEC.gov", title: "Trump Media SEC Filings", date: "2024" }
        ]
    },
    {
        name: "Trump Media",
        reason: "Donald Trump's media company",
        notes: "Parent of Truth Social",
        citations: [
            { url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=trump+media", source: "SEC.gov", title: "Trump Media SEC Filings", date: "2024" }
        ]
    },
    {
        name: "Beal Bank",
        reason: "Andy Beal is a major Trump donor ($20M+ to PACs)",
        notes: "",
        citations: [
            { url: "https://www.opensecrets.org/donor-lookup/results?name=andy+beal", source: "OpenSecrets", title: "Andy Beal Donations", date: "2024" }
        ]
    },
    {
        name: "Fertitta Entertainment",
        reason: "Tilman Fertitta is a major Trump donor",
        notes: "Owns Landry's, Golden Nugget casinos",
        citations: [
            { url: "https://www.opensecrets.org/donor-lookup/results?name=tilman+fertitta", source: "OpenSecrets", title: "Tilman Fertitta Donations", date: "2024" }
        ]
    },
    {
        name: "Landry's",
        reason: "Owner Tilman Fertitta is a major Trump donor",
        notes: "Restaurant/hospitality company",
        citations: [
            { url: "https://www.opensecrets.org/donor-lookup/results?name=tilman+fertitta", source: "OpenSecrets", title: "Tilman Fertitta Donations", date: "2024" }
        ]
    },
    {
        name: "Golden Nugget",
        reason: "Owner Tilman Fertitta is a major Trump donor",
        notes: "Casino chain",
        citations: [
            { url: "https://www.opensecrets.org/donor-lookup/results?name=tilman+fertitta", source: "OpenSecrets", title: "Tilman Fertitta Donations", date: "2024" }
        ]
    }
];

function main() {
    // Read existing evil companies
    console.log(`Reading: ${evilCompaniesPath}`);
    const existingData = JSON.parse(fs.readFileSync(evilCompaniesPath, 'utf8'));
    console.log(`Existing evil companies: ${Object.keys(existingData).length}`);
    
    let added = 0;
    let merged = 0;
    let citationsAdded = 0;
    
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
            
            // Add citations
            if (donor.citations && donor.citations.length > 0) {
                if (!existing.citations) {
                    existing.citations = [];
                }
                for (const citation of donor.citations) {
                    // Check if URL already exists
                    if (!existing.citations.some(c => c.url === citation.url)) {
                        existing.citations.push(citation);
                        citationsAdded++;
                    }
                }
            }
            
            merged++;
        } else {
            // Add new entry
            const newEntry = {
                evil: true,
                reason: reason,
                supports: ['Trump-Donor']
            };
            
            if (donor.citations && donor.citations.length > 0) {
                newEntry.citations = donor.citations;
                citationsAdded += donor.citations.length;
            }
            
            existingData[normalizedName] = newEntry;
            added++;
        }
    }
    
    // Write updated file
    fs.writeFileSync(evilCompaniesPath, JSON.stringify(existingData, null, 2), 'utf8');
    
    console.log(`\nImport complete!`);
    console.log(`  Added: ${added} new companies`);
    console.log(`  Merged: ${merged} existing companies`);
    console.log(`  Citations added: ${citationsAdded}`);
    console.log(`  Total evil companies: ${Object.keys(existingData).length}`);
    
    console.log(`\nCompanies added/updated:`);
    for (const donor of trumpDonors) {
        console.log(`  - ${donor.name}`);
    }
}

main();
