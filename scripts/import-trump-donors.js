/**
 * Import Trump Campaign Donor data into evil-companies.json
 * 
 * COMPREHENSIVE list based on:
 * - FEC filings and OpenSecrets data
 * - 2024 campaign mega-donors
 * - 2025 inauguration corporate donors ($1M each)
 * - Known CEO/founder personal donations attributed to their companies
 * 
 * Sources: FEC.gov, OpenSecrets.org, news reports
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const evilCompaniesPath = path.join(__dirname, '..', 'app', 'public', 'evil-companies.json');

// Comprehensive Trump campaign/PAC/inauguration donors
const trumpDonors = [
    // === ELON MUSK COMPANIES ($277M+ to America PAC) ===
    {
        name: "Tesla",
        reason: "CEO Elon Musk donated $277M+ to Trump's America PAC in 2024",
        amount: "$277M+",
        citations: [
            { url: "https://www.opensecrets.org/news/2024/10/elon-musk-pumps-nearly-120-million-into-pro-trump-america-pac/", source: "OpenSecrets", title: "Elon Musk America PAC Donations", date: "2024-10" },
            { url: "https://www.fec.gov/data/committee/C00825851/", source: "FEC.gov", title: "America PAC Filings", date: "2024" }
        ]
    },
    {
        name: "SpaceX",
        reason: "CEO Elon Musk donated $277M+ to Trump's America PAC",
        amount: "$277M+",
        citations: [{ url: "https://www.opensecrets.org/news/2024/10/elon-musk-pumps-nearly-120-million-into-pro-trump-america-pac/", source: "OpenSecrets", title: "Elon Musk America PAC", date: "2024-10" }]
    },
    {
        name: "X",
        reason: "Owner Elon Musk donated $277M+ to Trump's America PAC",
        amount: "$277M+",
        citations: [{ url: "https://www.opensecrets.org/news/2024/10/elon-musk-pumps-nearly-120-million-into-pro-trump-america-pac/", source: "OpenSecrets", title: "Elon Musk America PAC", date: "2024-10" }]
    },
    {
        name: "Twitter",
        reason: "Owner Elon Musk donated $277M+ to Trump's America PAC",
        amount: "$277M+",
        citations: [{ url: "https://www.opensecrets.org/news/2024/10/elon-musk-pumps-nearly-120-million-into-pro-trump-america-pac/", source: "OpenSecrets", title: "Elon Musk America PAC", date: "2024-10" }]
    },
    {
        name: "The Boring Company",
        reason: "CEO Elon Musk is a major Trump campaign donor ($277M+)",
        amount: "$277M+",
        citations: [{ url: "https://www.opensecrets.org/news/2024/10/elon-musk-pumps-nearly-120-million-into-pro-trump-america-pac/", source: "OpenSecrets", title: "Elon Musk America PAC", date: "2024-10" }]
    },
    {
        name: "Neuralink",
        reason: "CEO Elon Musk is a major Trump campaign donor ($277M+)",
        amount: "$277M+",
        citations: [{ url: "https://www.opensecrets.org/news/2024/10/elon-musk-pumps-nearly-120-million-into-pro-trump-america-pac/", source: "OpenSecrets", title: "Elon Musk America PAC", date: "2024-10" }]
    },

    // === 2025 INAUGURATION DONORS ($1M each) ===
    {
        name: "Amazon",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.cnbc.com/2025/01/09/amazon-to-donate-1-million-to-trumps-inaugural-fund.html", source: "CNBC", title: "Amazon to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Meta",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.cnbc.com/2025/01/09/meta-donates-1-million-to-trump-inaugural-fund.html", source: "CNBC", title: "Meta donates $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Facebook",
        reason: "Parent company Meta donated $1M to Trump 2025 inauguration",
        amount: "$1M",
        citations: [{ url: "https://www.cnbc.com/2025/01/09/meta-donates-1-million-to-trump-inaugural-fund.html", source: "CNBC", title: "Meta donates $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Instagram",
        reason: "Parent company Meta donated $1M to Trump 2025 inauguration",
        amount: "$1M",
        citations: [{ url: "https://www.cnbc.com/2025/01/09/meta-donates-1-million-to-trump-inaugural-fund.html", source: "CNBC", title: "Meta donates $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "WhatsApp",
        reason: "Parent company Meta donated $1M to Trump 2025 inauguration",
        amount: "$1M",
        citations: [{ url: "https://www.cnbc.com/2025/01/09/meta-donates-1-million-to-trump-inaugural-fund.html", source: "CNBC", title: "Meta donates $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Google",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.theverge.com/2025/1/9/24339988/google-million-dollar-donation-trump-inauguration", source: "The Verge", title: "Google donates $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Alphabet",
        reason: "Donated $1M to Trump 2025 inauguration fund (parent of Google)",
        amount: "$1M",
        citations: [{ url: "https://www.theverge.com/2025/1/9/24339988/google-million-dollar-donation-trump-inauguration", source: "The Verge", title: "Google/Alphabet donates $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "YouTube",
        reason: "Parent company Alphabet donated $1M to Trump 2025 inauguration",
        amount: "$1M",
        citations: [{ url: "https://www.theverge.com/2025/1/9/24339988/google-million-dollar-donation-trump-inauguration", source: "The Verge", title: "Google donates $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Microsoft",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.cnbc.com/2025/01/09/microsoft-plans-to-give-1-million-to-trumps-inaugural-fund.html", source: "CNBC", title: "Microsoft to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Apple",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.cnbc.com/2025/01/10/apple-to-donate-1-million-to-trump-inauguration.html", source: "CNBC", title: "Apple to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "OpenAI",
        reason: "CEO Sam Altman donated $1M personally to Trump 2025 inauguration",
        amount: "$1M",
        citations: [{ url: "https://www.cnbc.com/2025/01/09/openai-ceo-sam-altman-to-personally-donate-1-million-to-trump-inauguration.html", source: "CNBC", title: "Sam Altman donates $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "ChatGPT",
        reason: "OpenAI CEO Sam Altman donated $1M to Trump 2025 inauguration",
        amount: "$1M",
        citations: [{ url: "https://www.cnbc.com/2025/01/09/openai-ceo-sam-altman-to-personally-donate-1-million-to-trump-inauguration.html", source: "CNBC", title: "Sam Altman donates $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Uber",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.reuters.com/world/us/uber-donate-1-mln-trumps-inaugural-fund-2025-01-09/", source: "Reuters", title: "Uber to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Toyota",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.reuters.com/business/autos-transportation/toyota-donate-1-million-trumps-inauguration-2025-01-14/", source: "Reuters", title: "Toyota to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Ford",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.reuters.com/business/autos-transportation/ford-motor-donate-1-mln-trump-inauguration-2025-01-10/", source: "Reuters", title: "Ford to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "General Motors",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.reuters.com/business/autos-transportation/gm-donate-1-mln-trump-inaugural-fund-2025-01-14/", source: "Reuters", title: "GM to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "GM",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.reuters.com/business/autos-transportation/gm-donate-1-mln-trump-inaugural-fund-2025-01-14/", source: "Reuters", title: "GM to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Chevrolet",
        reason: "Parent company GM donated $1M to Trump 2025 inauguration",
        amount: "$1M",
        citations: [{ url: "https://www.reuters.com/business/autos-transportation/gm-donate-1-mln-trump-inaugural-fund-2025-01-14/", source: "Reuters", title: "GM to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Bank of America",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.cnbc.com/2025/01/08/bank-of-america-to-donate-to-trumps-inauguration.html", source: "CNBC", title: "Bank of America to donate to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Goldman Sachs",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.bloomberg.com/news/articles/2025-01-09/goldman-sachs-to-donate-1-million-to-trump-s-inauguration-fund", source: "Bloomberg", title: "Goldman Sachs to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "JPMorgan",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.cnbc.com/2025/01/09/jpmorgan-to-donate-1-million-to-trump-inauguration.html", source: "CNBC", title: "JPMorgan to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "JPMorgan Chase",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.cnbc.com/2025/01/09/jpmorgan-to-donate-1-million-to-trump-inauguration.html", source: "CNBC", title: "JPMorgan to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Citigroup",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.cnbc.com/2025/01/10/citigroup-to-donate-1-million-to-trump-inaugural-fund.html", source: "CNBC", title: "Citigroup to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Citi",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.cnbc.com/2025/01/10/citigroup-to-donate-1-million-to-trump-inaugural-fund.html", source: "CNBC", title: "Citigroup to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Boeing",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.reuters.com/business/aerospace-defense/boeing-give-1-million-trump-inauguration-2025-01-10/", source: "Reuters", title: "Boeing to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Lockheed Martin",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.reuters.com/business/aerospace-defense/lockheed-martin-donate-1-mln-trump-inauguration-fund-2025-01-14/", source: "Reuters", title: "Lockheed Martin to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Intuit",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.cnbc.com/2025/01/15/intuit-donates-1-million-to-trump-inauguration.html", source: "CNBC", title: "Intuit to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "TurboTax",
        reason: "Parent company Intuit donated $1M to Trump 2025 inauguration",
        amount: "$1M",
        citations: [{ url: "https://www.cnbc.com/2025/01/15/intuit-donates-1-million-to-trump-inauguration.html", source: "CNBC", title: "Intuit to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "QuickBooks",
        reason: "Parent company Intuit donated $1M to Trump 2025 inauguration",
        amount: "$1M",
        citations: [{ url: "https://www.cnbc.com/2025/01/15/intuit-donates-1-million-to-trump-inauguration.html", source: "CNBC", title: "Intuit to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Delta Airlines",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.reuters.com/business/aerospace-transportation/delta-air-lines-donate-1-million-trump-inauguration-2025-01-15/", source: "Reuters", title: "Delta to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Delta",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.reuters.com/business/aerospace-transportation/delta-air-lines-donate-1-million-trump-inauguration-2025-01-15/", source: "Reuters", title: "Delta to donate $1M to Trump inauguration", date: "2025-01" }]
    },

    // === MEGA-DONORS (>$10M to Trump PACs) ===
    {
        name: "Uline",
        reason: "Owners Dick and Liz Uihlein donated $100M+ to Trump-aligned PACs",
        amount: "$100M+",
        citations: [
            { url: "https://www.opensecrets.org/outsidespending/summ.php?cycle=2024&disp=D&type=V", source: "OpenSecrets", title: "Top Individual Contributors 2024", date: "2024" },
            { url: "https://www.fec.gov/data/receipts/individual-contributions/?contributor_name=uihlein", source: "FEC.gov", title: "Uihlein Contributions", date: "2024" }
        ]
    },
    {
        name: "Las Vegas Sands",
        reason: "Miriam Adelson donated $100M+ to Trump's 2024 campaign",
        amount: "$100M+",
        citations: [
            { url: "https://www.opensecrets.org/donor-lookup/results?name=miriam+adelson", source: "OpenSecrets", title: "Miriam Adelson Donations", date: "2024" }
        ]
    },
    {
        name: "Sands",
        reason: "Miriam Adelson donated $100M+ to Trump's 2024 campaign",
        amount: "$100M+",
        citations: [{ url: "https://www.opensecrets.org/donor-lookup/results?name=miriam+adelson", source: "OpenSecrets", title: "Miriam Adelson Donations", date: "2024" }]
    },
    {
        name: "Venetian",
        reason: "Owned by Las Vegas Sands (Adelson family, Trump mega-donors)",
        amount: "$100M+",
        citations: [{ url: "https://www.opensecrets.org/donor-lookup/results?name=miriam+adelson", source: "OpenSecrets", title: "Miriam Adelson Donations", date: "2024" }]
    },
    {
        name: "Blackstone",
        reason: "CEO Steve Schwarzman donated $20M+ to Trump PACs",
        amount: "$20M+",
        citations: [{ url: "https://www.opensecrets.org/donor-lookup/results?name=stephen+schwarzman", source: "OpenSecrets", title: "Stephen Schwarzman Donations", date: "2024" }]
    },
    {
        name: "Citadel",
        reason: "CEO Ken Griffin donated $100M+ to Republican PACs",
        amount: "$100M+",
        citations: [{ url: "https://www.opensecrets.org/donor-lookup/results?name=ken+griffin", source: "OpenSecrets", title: "Ken Griffin Donations", date: "2024" }]
    },

    // === PROMINENT TRUMP SUPPORTERS/ALLIES ===
    {
        name: "My Pillow",
        reason: "CEO Mike Lindell is a prominent Trump supporter and donor",
        amount: "Various",
        citations: [{ url: "https://www.opensecrets.org/donor-lookup/results?name=mike+lindell", source: "OpenSecrets", title: "Mike Lindell Donations", date: "2024" }]
    },
    {
        name: "MyPillow",
        reason: "CEO Mike Lindell is a prominent Trump supporter and donor",
        amount: "Various",
        citations: [{ url: "https://www.opensecrets.org/donor-lookup/results?name=mike+lindell", source: "OpenSecrets", title: "Mike Lindell Donations", date: "2024" }]
    },
    {
        name: "UFC",
        reason: "CEO Dana White is a close Trump ally and RNC speaker",
        amount: "Various",
        citations: [{ url: "https://www.opensecrets.org/donor-lookup/results?name=dana+white", source: "OpenSecrets", title: "Dana White Donations", date: "2024" }]
    },
    {
        name: "TKO Group",
        reason: "Formed from WWE-UFC merger, both led by Trump allies",
        amount: "Various",
        citations: [{ url: "https://www.opensecrets.org/donor-lookup/results?name=dana+white", source: "OpenSecrets", title: "Dana White Donations", date: "2024" }]
    },
    {
        name: "WWE",
        reason: "Linda McMahon is Trump's Education Secretary nominee and major donor",
        amount: "$10M+",
        citations: [
            { url: "https://www.opensecrets.org/donor-lookup/results?name=linda+mcmahon", source: "OpenSecrets", title: "Linda McMahon Donations", date: "2024" }
        ]
    },
    {
        name: "World Wrestling Entertainment",
        reason: "Linda McMahon is Trump cabinet member and major donor",
        amount: "$10M+",
        citations: [{ url: "https://www.opensecrets.org/donor-lookup/results?name=linda+mcmahon", source: "OpenSecrets", title: "Linda McMahon Donations", date: "2024" }]
    },
    {
        name: "Goya Foods",
        reason: "CEO Robert Unanue publicly praised Trump at White House event",
        amount: "Endorsement",
        citations: [{ url: "https://www.npr.org/2020/07/10/889858578/goya-foods-ceo-praises-trump-faces-boycott-calls", source: "NPR", title: "Goya Foods CEO Praises Trump", date: "2020-07" }]
    },
    {
        name: "Goya",
        reason: "CEO Robert Unanue publicly praised Trump at White House event",
        amount: "Endorsement",
        citations: [{ url: "https://www.npr.org/2020/07/10/889858578/goya-foods-ceo-praises-trump-faces-boycott-calls", source: "NPR", title: "Goya Foods CEO Praises Trump", date: "2020-07" }]
    },
    {
        name: "Cantor Fitzgerald",
        reason: "CEO Howard Lutnick is Trump's Commerce Secretary nominee and major donor",
        amount: "$10M+",
        citations: [{ url: "https://www.opensecrets.org/donor-lookup/results?name=howard+lutnick", source: "OpenSecrets", title: "Howard Lutnick Donations", date: "2024" }]
    },

    // === MEDIA SUPPORTERS ===
    {
        name: "News Corp",
        reason: "Owner Rupert Murdoch's media empire has supported Trump",
        amount: "Media Support",
        citations: [{ url: "https://www.opensecrets.org/orgs/news-corp/summary?id=D000000227", source: "OpenSecrets", title: "News Corp Political Contributions", date: "2024" }]
    },
    {
        name: "Fox News",
        reason: "Rupert Murdoch's network has been Trump's most prominent media ally",
        amount: "Media Support",
        citations: [{ url: "https://www.opensecrets.org/orgs/21st-century-fox/summary?id=D000021898", source: "OpenSecrets", title: "Fox Corporation Political Activity", date: "2024" }]
    },
    {
        name: "Fox Corporation",
        reason: "Rupert Murdoch's company, Trump's most prominent media supporter",
        amount: "Media Support",
        citations: [{ url: "https://www.opensecrets.org/orgs/21st-century-fox/summary?id=D000021898", source: "OpenSecrets", title: "Fox Corporation Political Activity", date: "2024" }]
    },

    // === ENERGY/OIL DONORS ===
    {
        name: "Continental Resources",
        reason: "Founder Harold Hamm is a longtime Trump donor and advisor",
        amount: "$10M+",
        citations: [{ url: "https://www.opensecrets.org/donor-lookup/results?name=harold+hamm", source: "OpenSecrets", title: "Harold Hamm Donations", date: "2024" }]
    },
    {
        name: "Chevron",
        reason: "Donated to Trump 2025 inauguration",
        amount: "$1M",
        citations: [{ url: "https://www.reuters.com/business/energy/chevron-donate-trump-inauguration-2025-01-14/", source: "Reuters", title: "Chevron to donate to Trump inauguration", date: "2025-01" }]
    },

    // === FINANCIAL/PRIVATE EQUITY ===
    {
        name: "Apollo Global Management",
        reason: "CEO Marc Rowan is a major Trump donor",
        amount: "$10M+",
        citations: [{ url: "https://www.opensecrets.org/donor-lookup/results?name=marc+rowan", source: "OpenSecrets", title: "Marc Rowan Donations", date: "2024" }]
    },
    {
        name: "Susquehanna International Group",
        reason: "Co-founder Jeff Yass is a major GOP/Trump donor ($50M+)",
        amount: "$50M+",
        citations: [{ url: "https://www.opensecrets.org/donor-lookup/results?name=jeff+yass", source: "OpenSecrets", title: "Jeff Yass Donations", date: "2024" }]
    },
    {
        name: "Beal Bank",
        reason: "Andy Beal donated $25M+ to Trump-aligned PACs",
        amount: "$25M+",
        citations: [{ url: "https://www.opensecrets.org/donor-lookup/results?name=andy+beal", source: "OpenSecrets", title: "Andy Beal Donations", date: "2024" }]
    },

    // === HOSPITALITY/ENTERTAINMENT ===
    {
        name: "Fertitta Entertainment",
        reason: "Tilman Fertitta is a major Trump donor ($10M+)",
        amount: "$10M+",
        citations: [{ url: "https://www.opensecrets.org/donor-lookup/results?name=tilman+fertitta", source: "OpenSecrets", title: "Tilman Fertitta Donations", date: "2024" }]
    },
    {
        name: "Landry's",
        reason: "Owner Tilman Fertitta is a major Trump donor",
        amount: "$10M+",
        citations: [{ url: "https://www.opensecrets.org/donor-lookup/results?name=tilman+fertitta", source: "OpenSecrets", title: "Tilman Fertitta Donations", date: "2024" }]
    },
    {
        name: "Golden Nugget",
        reason: "Owner Tilman Fertitta is a major Trump donor",
        amount: "$10M+",
        citations: [{ url: "https://www.opensecrets.org/donor-lookup/results?name=tilman+fertitta", source: "OpenSecrets", title: "Tilman Fertitta Donations", date: "2024" }]
    },

    // === TRUMP'S OWN COMPANIES ===
    {
        name: "Truth Social",
        reason: "Trump's own social media company",
        amount: "Owner",
        citations: [{ url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=trump+media", source: "SEC.gov", title: "Trump Media SEC Filings", date: "2024" }]
    },
    {
        name: "Trump Media",
        reason: "Donald Trump's media company",
        amount: "Owner",
        citations: [{ url: "https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&company=trump+media", source: "SEC.gov", title: "Trump Media SEC Filings", date: "2024" }]
    },
    {
        name: "Trump Organization",
        reason: "Donald Trump's real estate company",
        amount: "Owner",
        citations: [{ url: "https://en.wikipedia.org/wiki/The_Trump_Organization", source: "Wikipedia", title: "The Trump Organization", date: "2024" }]
    },

    // === ADDITIONAL INAUGURATION/MAJOR DONORS ===
    {
        name: "AT&T",
        reason: "Donated to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.reuters.com/business/media-telecom/att-donate-trump-inauguration-2025-01-14/", source: "Reuters", title: "AT&T to donate to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Comcast",
        reason: "Donated to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.cnbc.com/2025/01/14/comcast-donate-1-million-trump-inauguration.html", source: "CNBC", title: "Comcast to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "NBCUniversal",
        reason: "Parent company Comcast donated $1M to Trump 2025 inauguration",
        amount: "$1M",
        citations: [{ url: "https://www.cnbc.com/2025/01/14/comcast-donate-1-million-trump-inauguration.html", source: "CNBC", title: "Comcast to donate $1M to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Verizon",
        reason: "Donated to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.reuters.com/business/media-telecom/verizon-donate-trump-inauguration-2025-01-14/", source: "Reuters", title: "Verizon to donate to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Target",
        reason: "Donated to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.cnbc.com/2025/01/14/target-donate-1-million-trump-inauguration.html", source: "CNBC", title: "Target to donate to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Walmart",
        reason: "Donated $1M to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.reuters.com/business/retail-consumer/walmart-donate-trump-inauguration-2025-01-13/", source: "Reuters", title: "Walmart to donate to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Sam's Club",
        reason: "Parent company Walmart donated $1M to Trump 2025 inauguration",
        amount: "$1M",
        citations: [{ url: "https://www.reuters.com/business/retail-consumer/walmart-donate-trump-inauguration-2025-01-13/", source: "Reuters", title: "Walmart to donate to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Pfizer",
        reason: "Donated to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.reuters.com/business/healthcare-pharmaceuticals/pfizer-donate-trump-inauguration-2025-01-14/", source: "Reuters", title: "Pfizer to donate to Trump inauguration", date: "2025-01" }]
    },
    {
        name: "Merck",
        reason: "Donated to Trump 2025 inauguration fund",
        amount: "$1M",
        citations: [{ url: "https://www.reuters.com/business/healthcare-pharmaceuticals/merck-donate-trump-inauguration-2025-01-15/", source: "Reuters", title: "Merck to donate to Trump inauguration", date: "2025-01" }]
    },
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
        
        // Build reason string with amount
        let reason = donor.reason;
        if (donor.amount && donor.amount !== "Various" && donor.amount !== "Endorsement" && donor.amount !== "Media Support" && donor.amount !== "Owner") {
            reason += ` [${donor.amount}]`;
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
            
            // Append reason if doesn't already mention Trump
            if (reason && !existing.reason?.toLowerCase().includes('trump')) {
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
    console.log(`  Merged: ${merged} existing companies (Trump-Donor tag added)`);
    console.log(`  Citations added: ${citationsAdded}`);
    console.log(`  Total evil companies: ${Object.keys(existingData).length}`);
    
    console.log(`\n=== Trump Donor Companies (${trumpDonors.length} total) ===`);
    console.log(`\n2025 Inauguration Donors ($1M each):`);
    const inaugDonors = trumpDonors.filter(d => d.reason.includes('inauguration'));
    inaugDonors.forEach(d => console.log(`  - ${d.name}`));
    
    console.log(`\nMega-Donors (>$10M):`);
    const megaDonors = trumpDonors.filter(d => d.amount && (d.amount.includes('$100M') || d.amount.includes('$277M') || d.amount.includes('$50M') || d.amount.includes('$25M') || d.amount.includes('$20M') || d.amount.includes('$10M')));
    megaDonors.forEach(d => console.log(`  - ${d.name}: ${d.amount}`));
}

main();
