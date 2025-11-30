# Analytics & Tracking Setup Guide

Your Bad Scandi site comes with **Google Analytics 4**, **Meta Pixel** (Facebook/Instagram), and **Pinterest Tag** pre-installed! 🎉

All tracking is **optional** - if you don't add the IDs, the pixels simply won't load (no errors, no issues).

## 📊 What's Tracked Automatically

Once you add your tracking IDs, these events fire automatically:

### Google Analytics 4
- ✅ Page views (every page)
- ✅ Product views (product detail pages)
- ✅ Checkout started (when user clicks "Purchase Now")
- ✅ Purchase completed (after successful Stripe payment)

### Meta Pixel (Facebook/Instagram)
- ✅ PageView (every page)
- ✅ ViewContent (product views)
- ✅ InitiateCheckout (checkout started)
- ✅ Purchase (order completed)

### Pinterest Tag
- ✅ Page visit (every page)
- ✅ Product view tracking
- ✅ Checkout events
- ✅ Purchase conversion

## 🎯 Why This Matters

**These pixels let you:**
1. **Track ROI** - See which ads actually drive sales
2. **Retarget visitors** - Show ads to people who viewed products but didn't buy
3. **Build lookalike audiences** - Find people similar to your customers
4. **Optimize ads** - Platforms auto-optimize for conversions

## 📋 Setup Instructions

### 1. Google Analytics 4 (Free)

**Step 1: Create GA4 Property**
1. Go to [analytics.google.com](https://analytics.google.com)
2. Click "Admin" (bottom left)
3. Click "Create Property"
4. Fill in:
   - Property name: "Bad Scandi"
   - Time zone: Your timezone
   - Currency: USD
5. Click "Next" → Choose business details → Create

**Step 2: Get Measurement ID**
1. In Admin → Property → Data Streams
2. Click "Add stream" → "Web"
3. Enter your website URL
4. Copy the **Measurement ID** (looks like `G-XXXXXXXXXX`)

**Step 3: Add to Environment Variables**
```env
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
```

**Done!** GA4 tracking is now active. ✅

---

### 2. Meta Pixel (Facebook/Instagram Ads)

**Step 1: Create Meta Pixel**
1. Go to [Meta Events Manager](https://business.facebook.com/events_manager2)
2. Click "Connect Data Sources" → "Web" → "Meta Pixel"
3. Name it: "Bad Scandi Pixel"
4. Enter your website URL
5. Choose "Install code manually"

**Step 2: Get Pixel ID**
1. In Events Manager → Data Sources
2. Click your pixel
3. Copy the **Pixel ID** (just the numbers, e.g., `123456789012345`)

**Step 3: Add to Environment Variables**
```env
NEXT_PUBLIC_META_PIXEL_ID="123456789012345"
```

**Done!** Meta Pixel tracking is now active. ✅

**Verify Installation:**
1. Install [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/) Chrome extension
2. Visit your site
3. Extension should show green checkmark with your Pixel ID

---

### 3. Pinterest Tag

**Step 1: Create Pinterest Tag**
1. Go to [Pinterest Ads Manager](https://ads.pinterest.com)
2. Click "Ads" → "Conversions"
3. Click "Create Pinterest Tag"
4. Choose "Install the tag yourself"

**Step 2: Get Tag ID**
1. Copy the **Tag ID** from the code snippet (looks like `1234567890123`)

**Step 3: Add to Environment Variables**
```env
NEXT_PUBLIC_PINTEREST_TAG_ID="1234567890123"
```

**Done!** Pinterest Tag tracking is now active. ✅

**Verify Installation:**
1. Install [Pinterest Tag Helper](https://chrome.google.com/webstore/detail/pinterest-tag-helper/) Chrome extension
2. Visit your site
3. Extension should show your Tag ID

---

## 🔧 Adding Environment Variables

### Local Development (.env file)

Edit your `.env` file:
```env
# Analytics
NEXT_PUBLIC_GA_ID="G-XXXXXXXXXX"
NEXT_PUBLIC_META_PIXEL_ID="123456789012345"
NEXT_PUBLIC_PINTEREST_TAG_ID="1234567890123"
```

Restart your dev server:
```bash
npm run dev
```

### Production (Vercel)

1. Go to your Vercel project
2. Click "Settings" → "Environment Variables"
3. Add each variable:
   - `NEXT_PUBLIC_GA_ID`
   - `NEXT_PUBLIC_META_PIXEL_ID`
   - `NEXT_PUBLIC_PINTEREST_TAG_ID`
4. Click "Save"
5. Redeploy your site

---

## 🧪 Testing Your Tracking

### 1. Test GA4
1. Visit your site in browser
2. Go to [GA4 Realtime Report](https://analytics.google.com) → Reports → Realtime
3. You should see yourself as an active user
4. Click around, view products → Events should appear

### 2. Test Meta Pixel
1. Install [Meta Pixel Helper](https://chrome.google.com/webstore/detail/meta-pixel-helper/)
2. Visit your site
3. Extension icon should be green with event count
4. View a product → Should fire "ViewContent" event
5. Click "Purchase Now" → Should fire "InitiateCheckout" event

### 3. Test Pinterest Tag
1. Install [Pinterest Tag Helper](https://chrome.google.com/webstore/detail/pinterest-tag-helper/)
2. Visit your site
3. Extension should show "pagevisit" event
4. Navigate around → Events should fire

---

## 📈 What Events Track What

| User Action | Google Analytics | Meta Pixel | Pinterest Tag |
|------------|------------------|------------|---------------|
| Visits any page | `page_view` | `PageView` | `pagevisit` |
| Views product | `view_item` | `ViewContent` | `pagevisit` |
| Clicks "Purchase Now" | `begin_checkout` | `InitiateCheckout` | `checkout` |
| Completes purchase | `purchase` | `Purchase` | `checkout` |

---

## 🎯 Using Your Data for Ads

### Meta Ads (Facebook/Instagram)

**1. Create Custom Audience (Retargeting)**
1. Go to Meta Ads Manager → Audiences
2. Create Custom Audience → Website
3. Choose: "People who visited specific pages"
4. Target: URL contains `/product/`
5. Save as "Product Viewers - Last 30 Days"

**2. Create Lookalike Audience**
1. After you get ~100 purchases
2. Create Custom Audience → Website → "Purchase Event"
3. Create Lookalike Audience from that
4. Target the lookalike for acquisition campaigns

**3. Run Retargeting Campaign**
1. Create new campaign → "Sales"
2. Target: "Product Viewers - Last 30 Days"
3. Exclude: People who purchased
4. Show them the products they viewed!

### Pinterest Ads

**1. Create Audience**
1. Ads Manager → Audiences
2. "Create audience" → "Engagement"
3. Select: "Visited website"
4. Set timeframe: 30 days

**2. Run Shopping Campaign**
1. Create campaign → "Conversions"
2. Upload product catalog
3. Run Shopping Ads to show your products

### Google Ads

Use GA4 audiences in Google Ads:
1. Link GA4 to Google Ads
2. Create audiences in GA4
3. Use them in Google Ads campaigns

---

## 🔒 Privacy Compliance

**Your site is privacy-friendly by default:**
- ✅ Pixels only load if IDs are configured
- ✅ No tracking if user blocks scripts
- ✅ Client-side tracking only (respectful)

**Consider adding:**
1. **Cookie consent banner** (required in EU/UK)
   - Use [CookieYes](https://www.cookieyes.com) (free tier)
   - Or [Cookiebot](https://www.cookiebot.com)

2. **Privacy Policy** page
   - Mention use of GA4, Meta Pixel, Pinterest Tag
   - Link in footer

---

## 💡 Quick Start Recommendation

**If you're just starting:**

1. **Week 1**: Add Google Analytics only
   - Free, just for your own insights
   - See where traffic comes from

2. **Week 2-3**: Build organic following
   - Post products on Instagram/Pinterest
   - Don't spend money yet

3. **Week 4**: Add Meta Pixel & Pinterest Tag
   - Still not spending, just building audiences
   - Let pixels collect data for 1-2 weeks

4. **Week 6**: Start small ad campaigns
   - Meta ads: $10-20/day
   - Pinterest ads: $10/day
   - Now you have retargeting audiences ready!

---

## 🆘 Troubleshooting

### "Pixels not showing in browser extensions"
- Check environment variables are set
- Restart dev server / redeploy
- Make sure variable names start with `NEXT_PUBLIC_`

### "Events not firing"
- Open browser console (F12)
- Check for JavaScript errors
- Verify pixel IDs are correct

### "GA4 shows no data"
- Wait 24-48 hours for first data
- Check Realtime report for immediate validation

### "Meta Pixel showing errors"
- Pixel ID should be just numbers
- No quotes or extra characters
- Clear browser cache

---

## 📊 Free Tools to Track Performance

1. **Google Analytics** - Free forever
2. **Meta Ads Manager** - Free to view insights
3. **Pinterest Analytics** - Free for business accounts
4. **Vercel Analytics** - Already included (shows basic traffic)

---

## 🎯 Summary

**Setup takes 15 minutes total:**
- Google Analytics: 5 minutes
- Meta Pixel: 5 minutes
- Pinterest Tag: 5 minutes

**Cost:** $0 (all tracking is free)

**What you get:**
- Full visitor tracking
- Conversion measurement
- Retargeting audiences
- ROI tracking for ads

**Questions?** See main README.md or open a GitHub issue!

---

Built with privacy-friendly analytics tracking! 🔒📊
