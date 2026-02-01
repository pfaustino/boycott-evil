# Protest Sign Design - Boycott ICE & Trump

Two sign designs created for printing and use at protests.

## Files

1. **protest-sign.html** - Dramatic design with dark background, red text, high contrast
2. **protest-sign-simple.html** - Clean, simple design with black borders, easier to print

## How to Use

### Option 1: Print from Browser
1. Open the HTML file in Chrome/Firefox
2. Press `Ctrl+P` (or `Cmd+P` on Mac)
3. Select "Save as PDF" or print to paper
4. **Recommended paper size:** 11" x 17" (Tabloid) or 8.5" x 11" (Letter - will scale down)

### Option 2: Convert to Image
1. Open HTML file in browser
2. Use browser screenshot tool or extension
3. Save as PNG/JPG
4. Print from image file

### Option 3: Use as Digital Sign
- Display on tablet/phone at protests
- Share on social media
- Use in digital displays

## Generate QR Code

### Step 1: Get Your App URL
Your app URL: `https://your-app-url.vercel.app` (or wherever it's hosted)

### Step 2: Generate QR Code

**Free QR Code Generators:**
- https://www.qr-code-generator.com/
- https://www.qrcode-monkey.com/
- https://qr.io/

**Instructions:**
1. Go to QR code generator
2. Select "URL" type
3. Enter your app URL
4. Customize colors (optional - use high contrast for visibility)
5. Download as PNG/SVG
6. Minimum size: **2.5" x 2.5"** for good scanning

### Step 3: Add QR Code to Sign

**Method A: Edit HTML**
- Replace `[QR CODE PLACEHOLDER]` with:
```html
<img src="your-qr-code.png" alt="Scan QR Code" style="width: 100%; height: 100%; object-fit: contain;">
```

**Method B: Print Separately & Paste**
- Print QR code separately
- Cut out and paste onto printed sign
- Laminate for weather protection

## Design Tips

### For Maximum Visibility:
- ✅ Use **bold, sans-serif fonts** (Arial Black, Impact)
- ✅ **High contrast** (black on white, or white on dark)
- ✅ **Large text** - readable from 20+ feet away
- ✅ **Simple message** - 3-5 words max per section

### Printing Tips:
- Use **cardstock** or **poster board** for durability
- **Laminate** if using outdoors
- Print in **color** for maximum impact
- Consider **double-sided** signs

## Customization

### Change Colors:
Edit the CSS in the HTML file:
- `color: #ff0000;` = Red text
- `background: #000;` = Black background
- `border-color: #00ff00;` = Green border

### Change Text:
Edit the HTML content:
- Replace "BOYCOTT" with your message
- Update boycott reasons
- Change CTA text

### Change Size:
- Edit `@page { size: 11in 17in; }` for different paper sizes
- Adjust font sizes proportionally

## Social Media Versions

For Instagram/Twitter:
- Use **1080x1080px** square version
- Crop to focus on main message + QR code
- Add hashtags: #BoycottICE #BoycottTrump #EthicalShopping

## Legal Considerations

- ✅ Protected speech (First Amendment)
- ✅ No threats or incitement to violence
- ✅ Factual statements only
- ⚠️ Check local protest regulations
- ⚠️ Some venues may restrict sign sizes

## Example Messages to Add

**Back of sign ideas:**
- "356K+ products checked"
- "Know before you buy"
- "Scan barcode → See boycott status"
- "Free app, no signup"

**Hashtags:**
- #BoycottICE
- #BoycottTrump
- #EthicalShopping
- #VoteWithYourWallet
- #KnowBeforeYouBuy

---

**Questions?** Open an issue or edit the HTML files directly!
