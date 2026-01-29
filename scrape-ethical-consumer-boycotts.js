/**
 * Script to scrape boycott data from Ethical Consumer
 * Run with: node scrape-ethical-consumer-boycotts.js
 * 
 * Note: This uses Node.js with cheerio for HTML parsing
 * Install dependencies: npm install cheerio axios
 */

const axios = require('axios');
const cheerio = require('cheerio');
const fs = require('fs');

const BOYCOTTS_URL = 'https://www.ethicalconsumer.org/ethicalcampaigns/boycotts';

async function scrapeBoycotts() {
    try {
        console.log('Fetching boycott page...');
        const response = await axios.get(BOYCOTTS_URL, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const boycotts = [];

        // Find all boycott entries - they appear to be in sections with company names as headings
        $('article, .boycott-entry, h2, h3').each((index, element) => {
            const $el = $(element);
            const text = $el.text().trim();
            
            // Look for company names (usually in headings)
            // Pattern: Company name followed by details
            if ($el.is('h2, h3') || text.includes('Category:') || text.includes('Called by:')) {
                const boycott = {
                    company: '',
                    category: '',
                    calledBy: '',
                    dateStarted: '',
                    companyProfile: '',
                    reason: '',
                    relatedGuides: []
                };

                // Extract company name (usually in the heading)
                if ($el.is('h2, h3')) {
                    boycott.company = text.split('\n')[0].trim();
                }

                // Look for details in following siblings
                let $next = $el.next();
                let detailText = '';
                let depth = 0;
                
                while ($next.length && depth < 10) {
                    const nextText = $next.text().trim();
                    
                    if (nextText.includes('Category:')) {
                        boycott.category = nextText.replace('Category:', '').trim();
                    }
                    if (nextText.includes('Called by:')) {
                        boycott.calledBy = nextText.replace('Called by:', '').trim();
                    }
                    if (nextText.includes('Date boycott started:')) {
                        boycott.dateStarted = nextText.replace('Date boycott started:', '').trim();
                    }
                    if (nextText.includes('Company profile:')) {
                        boycott.companyProfile = nextText.replace('Company profile:', '').trim();
                    }
                    if (nextText.includes('Related Shopping Guides:')) {
                        const guides = nextText.replace('Related Shopping Guides:', '').trim();
                        boycott.relatedGuides = guides.split(',').map(g => g.trim());
                    }
                    
                    // Collect paragraph text as reason/description
                    if ($next.is('p') && nextText.length > 50) {
                        detailText += nextText + ' ';
                    }
                    
                    $next = $next.next();
                    depth++;
                }
                
                boycott.reason = detailText.trim();

                if (boycott.company) {
                    boycotts.push(boycott);
                }
            }
        });

        // Alternative approach: Look for specific patterns in the HTML
        // The page structure might have specific classes or IDs
        $('h2, h3').each((index, element) => {
            const $heading = $(element);
            const companyName = $heading.text().trim();
            
            // Skip if it's a section heading, not a company
            if (companyName.includes('Boycotts') || 
                companyName.includes('Also in') || 
                companyName.length < 2) {
                return;
            }

            const boycott = {
                company: companyName,
                category: '',
                calledBy: '',
                dateStarted: '',
                companyProfile: '',
                reason: '',
                relatedGuides: []
            };

            // Get the next element which should contain details
            let $current = $heading.next();
            let paragraphs = [];
            
            while ($current.length && !$current.is('h2, h3')) {
                const text = $current.text().trim();
                
                // Extract structured data
                if (text.startsWith('Category:')) {
                    boycott.category = text.replace('Category:', '').trim();
                } else if (text.startsWith('Called by:')) {
                    boycott.calledBy = text.replace('Called by:', '').trim();
                } else if (text.startsWith('Date boycott started:')) {
                    boycott.dateStarted = text.replace('Date boycott started:', '').trim();
                } else if (text.startsWith('Company profile:')) {
                    boycott.companyProfile = text.replace('Company profile:', '').trim();
                } else if (text.startsWith('Related Shopping Guides:')) {
                    const guides = text.replace('Related Shopping Guides:', '').trim();
                    boycott.relatedGuides = guides.split(',').map(g => g.trim());
                } else if ($current.is('p') && text.length > 20) {
                    paragraphs.push(text);
                }
                
                $current = $current.next();
            }
            
            boycott.reason = paragraphs.join(' ');

            // Only add if we have meaningful data
            if (boycott.company && boycott.company.length > 1) {
                // Check if we already have this company
                const existing = boycotts.find(b => b.company.toLowerCase() === boycott.company.toLowerCase());
                if (!existing) {
                    boycotts.push(boycott);
                }
            }
        });

        console.log(`Found ${boycotts.length} boycott entries`);

        // Save to JSON
        const output = {
            source: 'Ethical Consumer',
            url: BOYCOTTS_URL,
            scrapedAt: new Date().toISOString(),
            boycotts: boycotts
        };

        fs.writeFileSync('ethical-consumer-boycotts.json', JSON.stringify(output, null, 2));
        console.log('Saved to ethical-consumer-boycotts.json');

        // Also create a simplified version for our evil-companies format
        const evilCompanies = {};
        boycotts.forEach(boycott => {
            if (!boycott.company) return;
            
            const normalizedName = boycott.company.toLowerCase().trim();
            const category = boycott.category.toLowerCase();
            
            // Map categories to our supports array
            const supports = [];
            if (category.includes('human rights') || boycott.calledBy?.includes('BDS')) {
                supports.push('Israel'); // Many are BDS-related
            }
            if (category.includes('workers') || category.includes('labor')) {
                supports.push('Labor');
            }
            if (category.includes('environment') || category.includes('climate')) {
                supports.push('Environment');
            }
            if (category.includes('animal')) {
                supports.push('Animal-Testing');
            }
            
            evilCompanies[normalizedName] = {
                evil: true,
                reason: boycott.reason || `${boycott.category} - Called by ${boycott.calledBy}`,
                alternatives: [],
                supports: supports.length > 0 ? supports : ['Labor'] // Default if no category match
            };
        });

        fs.writeFileSync('ethical-consumer-evil-companies.json', JSON.stringify(evilCompanies, null, 2));
        console.log('Saved to ethical-consumer-evil-companies.json (formatted for our app)');

        return boycotts;
    } catch (error) {
        console.error('Error scraping:', error.message);
        if (error.response) {
            console.error('Status:', error.response.status);
        }
        throw error;
    }
}

// Run if called directly
if (require.main === module) {
    scrapeBoycotts()
        .then(() => {
            console.log('Scraping complete!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Scraping failed:', error);
            process.exit(1);
        });
}

module.exports = { scrapeBoycotts };
