"""
Python script to scrape boycott data from Ethical Consumer
Run with: python scrape-ethical-consumer-boycotts-python.py

Install dependencies: pip install requests beautifulsoup4
"""

import requests
from bs4 import BeautifulSoup
import json
from datetime import datetime

BOYCOTTS_URL = 'https://www.ethicalconsumer.org/ethicalcampaigns/boycotts'

def scrape_boycotts():
    """Scrape boycott data from Ethical Consumer website"""
    
    print('Fetching boycott page...')
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    
    try:
        response = requests.get(BOYCOTTS_URL, headers=headers)
        response.raise_for_status()
        
        soup = BeautifulSoup(response.content, 'html.parser')
        
        # Convert to plain text with line breaks
        page_text = soup.get_text(separator='\n')
        lines = [line.strip() for line in page_text.split('\n')]
        
        boycotts = []
        
        # Skip patterns for navigation/section headings
        skip_patterns = [
            'energy', 'fashion', 'clothing', 'food &', 'health &', 'home &', 'money',
            'retailers', 'technology', 'travel', 'boycotts list', 'also in', 'navigation',
            'main navigation', 'about us', 'campaigns', 'contact', 'connect', 'sign in',
            'shopping guides', 'explore ethical', 'skip to', 'sign up', 'subscribe'
        ]
        
        print(f'Processing {len(lines)} lines of text...')
        
        # Find all "Category:" markers
        category_indices = [i for i, line in enumerate(lines) if line == 'Category:']
        print(f'Found {len(category_indices)} "Category:" markers')
        
        for cat_idx in category_indices:
            boycott = {
                'company': '',
                'category': '',
                'calledBy': '',
                'dateStarted': '',
                'companyProfile': '',
                'reason': '',
                'relatedGuides': []
            }
            
            # Get category value (next non-empty line, may be 2-3 lines away)
            for j in range(cat_idx + 1, min(cat_idx + 10, len(lines))):
                if lines[j]:
                    boycott['category'] = lines[j]
                    break
            
            # Look backwards for company name (within 15 lines)
            company_found = False
            for j in range(cat_idx - 1, max(cat_idx - 16, -1), -1):
                candidate = lines[j]
                if not candidate:
                    continue
                
                # Check if it's a valid company name
                if (2 < len(candidate) < 100 and
                    not any(skip in candidate.lower() for skip in skip_patterns) and
                    not candidate.startswith(('Category:', 'Called by:', 'Date boycott', 'Company profile', 'Related', 'Share', 'View'))):
                    boycott['company'] = candidate
                    company_found = True
                    break
            
            if not company_found:
                continue
            
            # Extract other fields going forward from Category:
            i = cat_idx + 1
            while i < len(lines) and i < cat_idx + 80:
                line = lines[i]
                
                if line == 'Called by:':
                    # Get value from next non-empty line (may be 2-3 lines away)
                    for j in range(i + 1, min(i + 10, len(lines))):
                        if lines[j]:
                            boycott['calledBy'] = lines[j]
                            i = j  # Continue from here
                            break
                    else:
                        i += 1
                elif line == 'Date boycott started:':
                    for j in range(i + 1, min(i + 10, len(lines))):
                        if lines[j]:
                            boycott['dateStarted'] = lines[j]
                            i = j  # Continue from here
                            break
                    else:
                        i += 1
                elif line == 'Company profile:':
                    for j in range(i + 1, min(i + 10, len(lines))):
                        if lines[j]:
                            boycott['companyProfile'] = lines[j]
                            i = j  # Continue from here
                            break
                    else:
                        i += 1
                elif line == 'Related Shopping Guides:':
                    guides = []
                    j = i + 1
                    while j < len(lines) and j < i + 15:
                        if lines[j] and not lines[j].startswith(('Category:', 'Called by:', 'Date boycott', 'Company profile')):
                            guides.append(lines[j])
                        elif lines[j].startswith(('Category:', 'Called by:')):
                            break
                        j += 1
                    boycott['relatedGuides'] = guides
                    i = j
                elif line == 'Category:':
                    # Hit next boycott entry
                    break
                elif len(line) > 50 and not line.startswith(('Category:', 'Called by:', 'Date boycott', 'Company profile', 'Related', 'Share', 'View')):
                    # Likely part of reason/description
                    boycott['reason'] += ' ' + line
                    i += 1
                elif line and 2 < len(line) < 100 and not any(skip in line.lower() for skip in skip_patterns) and line != boycott['company'] and line != boycott['category']:
                    # Might be another company name - end this entry
                    # But only if we've already collected some data and this isn't a field value we've already seen
                    if (boycott['category'] or boycott['calledBy']) and line not in [boycott['calledBy'], boycott['dateStarted'], boycott['companyProfile']]:
                        break
                    i += 1
                else:
                    i += 1
            
            boycott['reason'] = boycott['reason'].strip()
            
            # Only add if we have meaningful data
            if boycott['category'] or boycott['calledBy'] or boycott['dateStarted'] or len(boycott['reason']) > 50:
                # Check for duplicates
                if not any(b['company'].lower() == boycott['company'].lower() for b in boycotts):
                    boycotts.append(boycott)
        
        print(f'Found {len(boycotts)} boycott entries')
        
        # Save full data
        output = {
            'source': 'Ethical Consumer',
            'url': BOYCOTTS_URL,
            'scrapedAt': datetime.now().isoformat(),
            'boycotts': boycotts
        }
        
        with open('ethical-consumer-boycotts.json', 'w', encoding='utf-8') as f:
            json.dump(output, f, indent=2, ensure_ascii=False)
        print('Saved to ethical-consumer-boycotts.json')
        
        # Convert to our evil-companies format
        evil_companies = {}
        for boycott in boycotts:
            if not boycott['company']:
                continue
            
            normalized_name = boycott['company'].lower().strip()
            category = boycott['category'].lower()
            
            # Map categories to supports array
            supports = []
            if 'human rights' in category or 'bds' in boycott.get('calledBy', '').lower():
                supports.append('Israel')
            if 'workers' in category or 'labor' in category or 'workers\' rights' in category or "workers' rights" in category:
                supports.append('Labor')
            if 'environment' in category or 'climate' in category:
                supports.append('Environment')
            if 'animal' in category:
                supports.append('Animal-Testing')
            if 'tax' in category:
                supports.append('Tax Avoidance')
            
            # Default to Labor if no category match
            if not supports:
                supports = ['Labor']
            
            evil_companies[normalized_name] = {
                'evil': True,
                'reason': boycott['reason'] or f"{boycott['category']} - Called by {boycott['calledBy']}",
                'alternatives': [],
                'supports': supports
            }
        
        with open('ethical-consumer-evil-companies.json', 'w', encoding='utf-8') as f:
            json.dump(evil_companies, f, indent=2, ensure_ascii=False)
        print('Saved to ethical-consumer-evil-companies.json (formatted for our app)')
        
        # Print sample
        if boycotts:
            print('\nSample entries:')
            for b in boycotts[:5]:
                print(f"  - {b['company']}: {b['category']} (Called by: {b['calledBy']})")
        
        return boycotts
        
    except requests.RequestException as e:
        print(f'Error fetching page: {e}')
        raise
    except Exception as e:
        print(f'Error scraping: {e}')
        import traceback
        traceback.print_exc()
        raise

if __name__ == '__main__':
    try:
        scrape_boycotts()
        print('Scraping complete!')
    except Exception as e:
        print(f'Scraping failed: {e}')
        exit(1)
