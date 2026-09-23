import { useState, useRef, useEffect } from 'react';
import { PHONE_DISPLAY, SUPPORT_EMAIL } from '../utils/contact';
import { activitiesAPI } from '../utils/api';

// ── Knowledge Base ─────────────────────────────────────────────────────────────
// Each entry: { id, patterns (array of RegExp), score fn, response fn }
const KB = [
  // ── GREETINGS ──
  {
    id: 'greeting',
    patterns: [/\b(hi|hello|hey|bonjour|salut|marhba|salam|ahlan|ciao|hola|guten\s*tag|yo\b|sup\b|howdy)\b/],
    response: () => ({
      text: "Marhba bik! 👋 I'm **Quads AI**, your personal adventure guide for Tunisia!\n\nI'm here to help you discover activities, plan the perfect day, compare options, or answer any question about our experiences. What can I do for you?",
      suggestions: ['What activities do you offer?', 'Show me prices', 'I want thrills!'],
    }),
  },

  // ── ALL ACTIVITIES LIST ──
  {
    id: 'activities_list',
    patterns: [/\b(activit|what.*offer|what.*do|what.*have|show.*all|all.*activit|option|list|menu|catalogue)\b/],
    anti: [/\b(price|cost|book|safe|age)\b/],
    response: () => ({
      text: "🎉 **7 Epic Adventures in Tunisia!**\n\n🏄 **Jet Ski** — 60 km/h rush · from **25 TND**\n🪂 **Parasailing** — 50m above the Med · from **25 TND**\n⛵ **Catamaran** — Luxury sailing · from **150 TND**\n🏍️ **Quad Biking** — Desert dunes · from **25 TND**\n🚗 **Buggy Rides** — Off-road thrills · from **50 TND**\n🚤 **Boat Trips** — Coastal cruise · from **20 TND**\n🤿 **Snorkelling** — Discover sea life · from **30 TND**\n\n🎁 First booking gets **10% off**!",
      suggestions: ['Best for beginners?', 'Compare jet ski vs parasailing', 'Group discounts?'],
    }),
  },

  // ── JET SKI ──
  {
    id: 'jetski',
    patterns: [/jet.?ski|jetski/],
    response: () => ({
      text: "🏄 **Jet Ski** — Our #1 most popular activity!\n\n**Sessions available:**\n• 15 minutes — **25 TND**\n• 30 minutes — **40 TND**\n• 1 hour — **70 TND**\n\n📍 Sousse, Monastir & Mahdia\n👤 Solo or tandem (2 people)\n🎂 Age 16+ (under 18 with parent)\n✅ Full safety gear & briefing included\n🌡️ Best from **May to October**\n\n💡 *Tip: The 30-min session is the most popular — enough time to really enjoy it!*",
      suggestions: ['Book jet ski', 'Jet ski vs parasailing?', "What's included?"],
    }),
  },

  // ── PARASAILING ──
  {
    id: 'parasailing',
    patterns: [/parasail|parasailing|fly\b|soar|parachute.*sea|sea.*parachute/],
    response: () => ({
      text: "🪂 **Parasailing** — Fly above the Mediterranean!\n\n• Solo — **25 TND**\n• Tandem (2 together) — **45 TND**\n\n⏱️ 15–20 minutes airborne\n📍 Sousse & Monastir\n🎂 Age 12+ (with parent)\n⚖️ Max combined weight: 200 kg\n✅ No experience needed — the boat does the work!\n🌊 Breathtaking aerial views of the Tunisian coastline\n\n💕 *Tandem is incredibly popular for couples — you literally fly together!*",
      suggestions: ['Book parasailing', 'Suitable for kids?', 'Jet ski combo deal?'],
    }),
  },

  // ── CATAMARAN ──
  {
    id: 'catamaran',
    patterns: [/catamaran|sailing|sail\b|luxury.*boat|boat.*luxury|sunset.*cruise|cruise.*sunset/],
    response: () => ({
      text: "⛵ **Catamaran** — Pure Mediterranean luxury!\n\n• Half day (4h) — **150 TND/person**\n• Full day (8h) — **250 TND/person**\n• Private charter — ask for quote\n\n📍 Monastir & Sousse\n🍽️ Lunch & snorkelling included on full day\n🌅 **Sunset cruises** available at 6 PM\n👨‍👩‍👧 Perfect for families, groups & couples\n🥂 Drinks package optional\n\n💡 *Book the sunset cruise for the most romantic experience on the Mediterranean!*",
      suggestions: ['Sunset cruise details', 'Group price?', "What's included?"],
    }),
  },

  // ── QUAD / BUGGY ──
  {
    id: 'quad_buggy',
    patterns: [/quad|buggy|desert|dune|off.road|atv|4x4.*tour/],
    response: () => ({
      text: "🏍️ **Quad & Buggy Adventures!**\n\n**Quad Biking:**\n• 1 hour — **25 TND**\n• 2 hours — **45 TND**\n\n**Buggy Rides (2-seater):**\n• 1 hour — **50 TND**\n• 2 hours — **90 TND**\n\n📍 Desert routes near Sousse & inland Tunisia\n🎂 Minimum age: 14 (Quad), 16 (Buggy)\n🪖 Helmets & gloves provided\n🎯 All levels welcome — guided tours\n\n💡 *Combine with a Jet Ski for the ultimate land & sea day!*",
      suggestions: ['Book quad biking', 'Buggy for 2?', 'Land + sea combo?'],
    }),
  },

  // ── BOAT TRIP ──
  {
    id: 'boat_trip',
    patterns: [/boat.?trip|boat\b|fishing|coastal|coast.*tour|island|kuriat/],
    response: () => ({
      text: "🚤 **Boat Trips** — Explore Tunisia's coast!\n\n• 1 hour coastal tour — **20 TND**\n• 2 hour island trip — **35 TND**\n• Kuriat Islands (Monastir) — **45 TND** (includes snorkelling)\n• Fishing trip (3h, early AM) — **40 TND**\n\n📍 All 3 locations\n👶 All ages welcome\n🤿 Snorkelling gear included on island trips\n🐬 Dolphin sightings possible!\n\n💡 *The Kuriat Islands trip is a hidden gem — pristine waters & sea turtles!*",
      suggestions: ['Kuriat Islands trip', 'Dolphin watching?', 'Fishing trip details'],
    }),
  },

  // ── SNORKELLING ──
  {
    id: 'snorkelling',
    patterns: [/snorkel|snorkeling|snorkelling|dive\b|diving|underwater|reef|fish.*watch/],
    response: () => ({
      text: "🤿 **Snorkelling & Diving** — Discover Tunisia's underwater world!\n\n**Snorkelling:**\n• From boat — **30 TND** (gear included)\n• Guided reef tour — **45 TND**\n\n**Scuba Diving:**\n• Intro dive (no experience) — **60 TND**\n• Certified dive — **50 TND**\n• PADI beginner course — **180 TND**\n\n🐠 Marine life: sea bass, octopus, sea turtles\n📍 Monastir (best visibility)\n🌡️ Water temp: 22–27°C (May–Oct)\n\n💡 *Tunisia's waters have incredible clarity — visibility up to 20m on calm days!*",
      suggestions: ['Book snorkelling', 'No experience needed?', 'Best visibility months?'],
    }),
  },

  // ── PRICES ──
  {
    id: 'prices',
    patterns: [/\b(price|cost|how.?much|tarif|combien|cher|expensive|cheap|afford|fee|rate|amount)\b/],
    response: () => ({
      text: "💰 **Full Price List** — Unbeatable value!\n\n🚤 Boat Trip — from **20 TND**\n🏄 Jet Ski (15 min) — **25 TND**\n🪂 Parasailing — **25 TND**\n🏍️ Quad Biking — **25 TND**\n🤿 Snorkelling — **30 TND**\n🚗 Buggy Rides — **50 TND**\n⛵ Catamaran — from **150 TND**\n\n🎁 **10% off** first booking!\n👨‍👩‍👧 **Groups (5+):** 15% off\n💑 **Couples combo:** Save 20%\n\n*All prices in Tunisian Dinar (TND). ~€30 = 100 TND*",
      suggestions: ['Book now', 'Group discounts?', 'Combo deals?'],
    }),
  },

  // ── DISCOUNTS / DEALS ──
  {
    id: 'discounts',
    patterns: [/\b(discount|offer|deal|promo|off|special|coupon|voucher|gift|save|reduc)\b/],
    response: () => ({
      text: "🎁 **Special Offers — Save More!**\n\n🌟 **First booking:** 10% off (auto-applied)\n👨‍👩‍👧 **Groups (5–9 people):** 15% off\n🏆 **Groups (10+ people):** 20% off\n💑 **Couples combo (2 activities):** Save 20%\n🎂 **Birthday:** Free upgrade or 15% off!\n🌅 **Early bird (before 9 AM):** 10% off\n📦 **Land + Sea combo:** 25% off total\n🔄 **Return visitor:** 10% loyalty discount\n\n💡 *Discounts can't be combined, but we'll always apply the best one for you!*",
      suggestions: ['Apply discount', 'Couples package?', 'Group booking'],
    }),
  },

  // ── LOCATIONS ──
  {
    id: 'locations',
    patterns: [/\b(where|location|sousse|monastir|mahdia|hammamet|city|beach|find|address|base|operate|area)\b/],
    response: () => ({
      text: "📍 **Our 4 Stunning Locations:**\n\n🏖️ **Sousse** — Main hub, Port El Kantaoui\n→ Most activities, vibrant marina, easy access\n\n🕌 **Monastir** — Historic & pristine\n→ Best for catamaran, Kuriat Islands nearby\n→ Crystal-clear waters, fewer crowds\n\n🌊 **Mahdia** — Hidden gem of the South\n→ Quietest & most authentic\n→ Exclusive dolphin watching experiences!\n\n🌴 **Hammamet** — The Garden of Tunisia\n→ VIP catamaran & fishing trips, quad rides, horseback adventures\n\n🕐 Open daily **8:00 AM – 7:00 PM**\n🅿️ Free parking at all locations\n\nWhich city are you visiting?",
      suggestions: ['Activities in Sousse', 'Monastir highlights', 'How to get there?'],
    }),
  },

  // ── HOW TO GET THERE / TRANSPORT ──
  {
    id: 'transport',
    patterns: [/\b(get.?there|transport|how.?to.?reach|taxi|bus|car|drive|from.*hotel|pickup|transfer|distance)\b/],
    response: () => ({
      text: "🚗 **Getting to Us is Easy!**\n\n🏨 **Free hotel pickup** available (book in advance)\n🚖 **Taxi:** ~5–10 TND from Sousse city center\n🚌 **Louage** (shared taxi): ~3 TND from most coastal cities\n🚶 **Walk:** Most hotels in Port El Kantaoui are 5 min walk\n\n📍 From Tunis:\n• Sousse: 1.5 hours by car / train\n• Monastir: 2 hours by car\n\n✅ **GPS coordinates** available on our contact page\n💡 *Just WhatsApp us your hotel name and we'll arrange pickup!*",
      suggestions: ['Free pickup?', 'Contact us', 'Book now'],
    }),
  },

  // ── SAFETY ──
  {
    id: 'safety',
    patterns: [/\b(safe|safety|danger|risk|accident|insur|certif|instructor|trained|equipment|gear|lifejacket|life.jacket)\b/],
    response: () => ({
      text: "🛡️ **Your Safety is Our #1 Priority!**\n\n✅ **100% safety record** — 15 years, 50,000+ guests\n✅ Certified international instructors\n✅ Full safety briefing before every activity\n✅ Life jackets & protective gear provided\n✅ Equipment inspected daily\n✅ Emergency first aid on-site\n✅ Licensed & insured operations\n\n🚑 **Medical note:** Inform us of any health conditions — most activities are fine for most people!\n\n🌊 *We've never had a serious incident. Safety is not just a policy — it's our culture.*",
      suggestions: ['Age requirements?', 'Health conditions?', 'Book with confidence'],
    }),
  },

  // ── AGE REQUIREMENTS ──
  {
    id: 'age',
    patterns: [/\b(age|kid|child|children|young|minor|teen|year.*old|old.*year|baby|toddler|senior)\b/],
    response: () => ({
      text: "👶 **Age Guide for Every Activity:**\n\n🚤 **Boat Trip** — All ages ✅ (babies welcome!)\n⛵ **Catamaran** — All ages ✅\n🤿 **Snorkelling** — 8+ ✅\n🪂 **Parasailing** — 12+ (with parent under 16)\n🏍️ **Quad Biking** — 14+ ✅\n🚗 **Buggy** — 16+ ✅\n🏄 **Jet Ski** — 16+ (solo), 12+ (tandem with adult)\n\n👴 **No upper age limit** for most activities!\n💡 *Seniors love the catamaran and boat trips — great for any fitness level.*",
      suggestions: ['Best for kids?', 'Family packages?', 'Safety info'],
    }),
  },

  // ── FAMILY ──
  {
    id: 'family',
    patterns: [/\b(family|families|kid|children|parents|toddler|whole.?family|group.*family|multiple.*age)\b/],
    response: () => ({
      text: "👨‍👩‍👧 **Perfect for Families!**\n\n**Top family picks:**\n🥇 **Boat Trip** — Everyone loves it, all ages\n🥈 **Catamaran** — A full-day family adventure\n🥉 **Parasailing (tandem)** — Kids love flying with a parent!\n\n✅ Relaxed environment, no pressure\n✅ Life jackets in all sizes including kids'\n✅ Patient, family-friendly staff\n✅ Shaded areas on boats\n🍦 Ice cream vendor usually nearby!\n\n🎁 **Family package (4+ people, 2+ activities): 20% off!**\n\nHow many people and what ages?",
      suggestions: ['Book family package', 'Safe for toddlers?', 'What age for jet ski?'],
    }),
  },

  // ── ROMANTIC / COUPLE ──
  {
    id: 'romantic',
    patterns: [/\b(romantic|couple|love|anniversary|honeymoon|date|partner|wife|husband|girlfriend|boyfriend|propose|wedding)\b/],
    response: () => ({
      text: "💕 **Romance on the Mediterranean!**\n\n**Most romantic experiences:**\n🌅 **Sunset Catamaran** (6 PM) — absolute magic\n🪂 **Tandem Parasailing** — fly together hand in hand\n🚤 **Private Boat Trip** — just the two of you\n⛵ **Evening Cruise** — stars & sea\n\n✨ Optional: champagne on board\n🌹 Rose petals & special setup available on request\n📸 Photographer can be arranged\n\n💖 *Perfect for anniversaries, honeymoons & proposals!*\n\nShall I tell you more about our **Couples Package**?",
      suggestions: ['Couples package price?', 'Sunset cruise booking', 'Add photographer?'],
    }),
  },

  // ── THRILL / ADRENALINE ──
  {
    id: 'thrill',
    patterns: [/\b(thrill|adrenalin|excit|extreme|fast|adventure|wild|rush|insane|crazy|intense|heart.*pump)\b/],
    response: () => ({
      text: "🔥 **Maximum Adrenaline — You Asked for It!**\n\n⚡ **Jet Ski** — Hit 60 km/h on open water!\n🪂 **Parasailing** — 50m above the sea, pure free-fall feeling!\n🏍️ **Quad Biking** — Full throttle through desert dunes!\n🚗 **Buggy Rides** — Off-road chaos!\n\n💥 **ULTIMATE COMBO (Best Value):**\nJet Ski (30 min) + Parasailing = **55 TND** (save 10!)\n\n🏆 **Challenge yourself:** Do all 4 adrenaline activities in one day — we call it the **Tunisian Rush!**\n\nReady to feel alive? 🇹🇳",
      suggestions: ['Book Ultimate Combo', 'Jet ski details', 'Parasailing details'],
    }),
  },

  // ── COMPARISON ──
  {
    id: 'compare_js_ps',
    patterns: [/jet.?ski.*parasail|parasail.*jet.?ski|vs|compare|difference|better|choose.*between/],
    response: () => ({
      text: "🏄 **Jet Ski vs 🪂 Parasailing — Which is right for you?**\n\n| | Jet Ski | Parasailing |\n|---|---|---|\n| **Price** | From 25 TND | From 25 TND |\n| **Adrenaline** | ⚡⚡⚡⚡ | ⚡⚡⚡ |\n| **Views** | Sea level | 🏆 Aerial |\n| **Wet?** | Yes, very! | No, stays dry |\n| **Control** | You steer! | Passive, relaxing |\n| **Duration** | 15–60 min | 15–20 min |\n| **With partner** | Tandem option | Tandem option |\n\n💡 **Can't decide?** Do both! Combo price: **55 TND** (save 10 TND)",
      suggestions: ['Book the combo', 'I prefer staying dry', 'I want to be in control!'],
    }),
  },

  // ── WHAT'S INCLUDED ──
  {
    id: 'included',
    patterns: [/\b(includ|what.*get|what.*come|extra|additional|bring|provided|gear|equipment|prepare)\b/],
    response: () => ({
      text: "✅ **What's Included in Every Activity:**\n\n🦺 Life jacket (mandatory)\n🪖 Helmet (Quad/Buggy)\n👓 Safety glasses where needed\n📋 Full safety briefing\n🏊 Supervision by certified instructor\n📸 Basic photos (most activities)\n🚿 Freshwater rinse after water activities\n\n**Also included:**\n✅ Free parking\n✅ Arabic/French/English/German staff\n✅ First aid on site\n\n**Not included (optional add-ons):**\n📷 Pro video package (+15 TND)\n🚗 Hotel pickup (+5 TND)\n🥤 Refreshments",
      suggestions: ['Add video package?', 'Book free activity', 'What to wear?'],
    }),
  },

  // ── WHAT TO WEAR / BRING ──
  {
    id: 'what_to_wear',
    patterns: [/\b(wear|bring|pack|prepare|dress|clothe|swimsuit|towel|sunscreen|hat|sunglasse)\b/],
    response: () => ({
      text: "👗 **What to Bring & Wear:**\n\n**Essentials:**\n👙 Swimsuit (for water activities)\n🩴 Flip-flops or water shoes\n🕶️ Sunglasses (we have straps)\n🧴 Sunscreen (reef-safe preferred!)\n🎒 Small waterproof bag\n\n**We provide:**\n🦺 Life jackets & safety gear\n🚿 Freshwater shower after\n🔒 Secure locker for valuables\n\n**Optional:**\n📸 GoPro (we also offer video rental)\n💧 Water bottle\n🍌 Light snack for boat trips\n\n💡 *Leave jewelry & valuables at your hotel!*",
      suggestions: ["What's included?", 'Can I bring my camera?', 'Book now'],
    }),
  },

  // ── BOOKING PROCESS ──
  {
    id: 'booking',
    patterns: [/\b(book|reserv|schedule|appointment|order|sign.?up|register|how.*book)\b/],
    response: () => ({
      text: `📅 **How to Book — Super Easy!**\n\n**Option 1: Online** ✅ (fastest)\n→ Click any 'Book Now' button\n→ Select location & activity\n→ Pick your date & fill in details\n→ Done! Instant confirmation email\n\n**Option 2: WhatsApp** 💬\n→ ${PHONE_DISPLAY}\n→ Tell us your activity, date & group size\n→ We'll confirm within 30 minutes!\n\n**Option 3: Phone** 📞\n→ ${PHONE_DISPLAY}\n→ Speak directly with our team\n\n⚡ No payment needed to reserve!\n🔄 Free cancellation up to 24h before\n\n🎁 Use code **FIRSTTIME** for 10% off!`,
      suggestions: ['Book online now', 'WhatsApp us', 'Cancellation policy?'],
    }),
  },

  // ── CANCELLATION ──
  {
    id: 'cancellation',
    patterns: [/\b(cancel|refund|change|reschedule|postpone|policy|flexible|money.?back)\b/],
    response: () => ({
      text: "🔄 **Flexible Cancellation Policy:**\n\n✅ **Free cancellation** up to 24 hours before\n✅ **Free reschedule** — move to any other date\n⚠️ **Within 24 hours:** 50% refund\n❌ **No-show:** No refund\n\n🌧️ **Bad weather?**\nIf WE cancel due to weather → 100% refund OR free reschedule\n\n💳 **Refunds:** Processed within 3–5 business days\n\n💡 *We're very flexible — just message us on WhatsApp if plans change!*",
      suggestions: ['How to cancel?', 'Book with confidence', 'Weather policy?'],
    }),
  },

  // ── WEATHER ──
  {
    id: 'weather',
    patterns: [/\b(weather|rain|wind|wave|temp|hot|cold|season|summer|winter|spring|autumn|month|forecast|climate)\b/],
    response: () => ({
      text: "☀️ **Tunisia's Weather — Mostly Perfect!**\n\n**Best months: May – October** 🏆\n• Sea temp: 22–27°C\n• Air temp: 28–38°C\n• Very little rain\n\n📅 **Month by Month:**\n🌸 April–May: 24–28°C, quiet, perfect\n☀️ Jun–Aug: 35–40°C, busiest, hot but amazing\n🍂 Sep–Oct: 28–33°C, less crowded, ideal!\n❄️ Nov–Mar: 15–20°C, off-season (some activities limited)\n\n🌊 **Sea conditions:**\nWe monitor daily & only operate in safe conditions\n\n💡 *September is our favourite month — warm sea, smaller crowds, perfect prices!*",
      suggestions: ['Best time to visit?', 'Activities in winter?', 'Book September trip'],
    }),
  },

  // ── BEST TIME TO VISIT ──
  {
    id: 'best_time',
    patterns: [/\b(best.?time|when.?to.?visit|when.?to.?come|peak.?season|off.?season|recommend.*month)\b/],
    response: () => ({
      text: "📅 **Best Time to Visit Tunisia:**\n\n🏆 **September–October** — Our top pick!\n→ Warm sea (26°C), cooler air (28°C)\n→ Fewer tourists, better service\n→ Same prices, less waiting\n\n🥈 **May–June** — Great choice!\n→ Perfect weather before summer crowds\n→ Everything open & ready\n\n☀️ **July–August** — Peak season\n→ Hottest & most exciting\n→ Book well in advance!\n\n❄️ **November–April** — Quieter\n→ Some activities available\n→ Best deals, off-season rates\n\nWhen are you planning to come? 🌊",
      suggestions: ['Prices in September?', 'Book summer trip', 'Off-season activities?'],
    }),
  },

  // ── PAYMENT ──
  {
    id: 'payment',
    patterns: [/\b(pay|payment|cash|card|credit|debit|online.?pay|transfer|invoice|receipt|currency|euro|pound|dinar)\b/],
    response: () => ({
      text: "💳 **Payment Methods We Accept:**\n\n💵 **Cash (TND)** — Pay on the day\n💳 **Credit/Debit Card** — Visa, Mastercard\n📱 **Bank Transfer** — for large groups\n💬 **No deposit needed** to reserve!\n\n💱 **Currency:**\n• We price in **TND** (Tunisian Dinar)\n• ~100 TND ≈ €30 / £25\n• Exchange at airport, banks, or our office\n• We accept EUR/GBP at day's rate\n\n📄 Receipt/invoice available for all bookings\n\n💡 *ATMs available near all our locations!*",
      suggestions: ['Currency exchange rates?', 'Book without paying?', 'Group invoice?'],
    }),
  },

  // ── FOOD / RESTAURANTS ──
  {
    id: 'food',
    patterns: [/\b(food|eat|restaurant|lunch|dinner|hungry|cafe|snack|drink|water|meals|catering)\b/],
    response: () => ({
      text: "🍽️ **Food & Restaurants Near Us:**\n\n🏖️ **At our beach locations:**\n• Beachside cafés (coffee, snacks, cold drinks)\n• Seafood restaurants 50–100m away\n• Ice cream & juice vendors\n\n🚤 **On full-day Catamaran:**\n• Lunch included! (fresh Tunisian cuisine)\n• Drinks & soft beverages included\n\n🇹🇳 **Must-try Tunisian food nearby:**\n• Brick (crispy egg pastry) — ~3 TND\n• Grilled sea bass — ~15 TND\n• Fresh mint tea — free with dessert!\n\n💡 *Bring a small snack & water bottle for morning activities — restaurants open from 11 AM.*",
      suggestions: ['Catamaran with lunch?', 'What to expect on site?', 'Book now'],
    }),
  },

  // ── PHOTOGRAPHY / VIDEO ──
  {
    id: 'photography',
    patterns: [/\b(photo|video|camera|gopro|picture|film|selfie|memory|instagram|footage|capture|record)\b/],
    response: () => ({
      text: "📸 **Capture Every Moment!**\n\n📷 **Our Photography Packages:**\n• Basic (10 photos) — **FREE** with all activities!\n• Photo + Video HD package — **+15 TND**\n• GoPro rental (full activity) — **+10 TND**\n• Drone footage (where permitted) — **+25 TND**\n\n✅ Photos delivered via WhatsApp same day\n✅ Waterproof camera available for underwater\n\n📱 **Bringing your own:**\n• GoPro mounts on helmets & wetsuits\n• Waterproof phone case rental: +5 TND\n• We'll look after your phone during activities\n\n💡 *Our sea photos are incredibly Instagrammable!* 📸",
      suggestions: ['Add photo package', 'GoPro rental details', 'Book with photos'],
    }),
  },

  // ── LANGUAGES ──
  {
    id: 'languages',
    patterns: [/\b(language|speak|english|french|german|arabic|italian|spanish|multilingual|translate)\b/],
    response: () => ({
      text: "🌍 **We Speak Your Language!**\n\nOur team is fluent in:\n🇬🇧 **English** — Full team\n🇫🇷 **French** — Full team\n🇩🇪 **German** — Most staff\n🇹🇳 **Arabic** — Full team\n🇮🇹 **Italian** — Some staff\n🇪🇸 **Spanish** — Some staff\n\n💡 *Most of our guests are from UK, France and Germany — you'll always have someone who speaks your language!*\n\nAsk me anything in French or German — I understand! 😊",
      suggestions: ['Ask in French', 'German question?', 'Book now'],
    }),
  },

  // ── FRENCH QUESTIONS ──
  {
    id: 'french',
    patterns: [/\b(activité|activite|réserver|reserver|prix|combien|bateau|mer|plage|vacances|voile|jet|parachute|ascensionnel)\b/],
    response: () => ({
      text: `🇫🇷 **Bonjour! Bienvenue chez Quads Tunisia!**\n\n**Nos activités:**\n🏄 Jet Ski — à partir de **25 TND**\n🪂 Parachute ascensionnel — **25 TND**\n⛵ Catamaran — **150 TND**\n🏍️ Quad — **25 TND**\n🚤 Excursion en bateau — **20 TND**\n\n📞 **Contactez-nous:**\nWhatsApp: ${PHONE_DISPLAY}\nEmail: ${SUPPORT_EMAIL}\n\n🎁 **-10% sur votre première réservation!**\n\n*Comment puis-je vous aider?*`,
      suggestions: ['Réserver maintenant', 'Prix détaillés', 'Sécurité enfants'],
    }),
  },

  // ── GERMAN QUESTIONS ──
  {
    id: 'german',
    patterns: [/\b(aktivität|aktivitat|buchen|preis|wie\s+viel|boot|meer|strand|urlaub|segeln|tauchen|wassersport)\b/],
    response: () => ({
      text: `🇩🇪 **Herzlich Willkommen bei Quads Tunisia!**\n\n**Unsere Aktivitäten:**\n🏄 Jet Ski — ab **25 TND**\n🪂 Parasailing — **25 TND**\n⛵ Katamaran — **150 TND**\n🏍️ Quad-Biking — **25 TND**\n🚤 Bootsfahrt — **20 TND**\n\n📞 **Kontakt:**\nWhatsApp: ${PHONE_DISPLAY}\nEmail: ${SUPPORT_EMAIL}\n\n🎁 **10% Rabatt** auf Ihre erste Buchung!\n\n*Wie kann ich Ihnen helfen?*`,
      suggestions: ['Jetzt buchen', 'Preisliste', 'Sicherheit & Kinder'],
    }),
  },

  // ── TUNISIA GENERAL INFO ──
  {
    id: 'tunisia_info',
    patterns: [/\b(tunisia|tunis|tunisian|north\s*africa|mediterranean|country|visit|tourist|culture|history|muslim|arabic)\b/],
    response: () => ({
      text: "🇹🇳 **About Tunisia — Quick Facts:**\n\n🌍 Location: North Africa, Mediterranean coast\n🌡️ Climate: Mediterranean — hot summers, mild winters\n💰 Currency: Tunisian Dinar (TND)\n🗣️ Languages: Arabic, French (widely spoken)\n🕌 Religion: Predominantly Muslim (very welcoming to all!)\n\n**For visitors:**\n• Very safe for tourists\n• Europeans don't need a visa\n• Most hotel staff speak French/English\n• Extremely affordable vs. Europe\n• Ramadan: activity hours may vary\n\n🏄 *Tunisia has 1,300 km of coastline — we're on the best parts!*",
      suggestions: ['Visa requirements?', 'Safety for tourists?', 'Best cities?'],
    }),
  },

  // ── VISA ──
  {
    id: 'visa',
    patterns: [/\b(visa|passport|entry|border|customs|document|citizen|national)\b/],
    response: () => ({
      text: "🛂 **Visa Information for Tunisia:**\n\n**NO VISA NEEDED for:**\n🇬🇧 UK citizens ✅ (up to 90 days)\n🇫🇷 French citizens ✅ (up to 3 months)\n🇩🇪 German citizens ✅ (up to 3 months)\n🇪🇺 Most EU nationals ✅\n🇺🇸 US citizens ✅\n\n**Entry requirements:**\n✅ Valid passport (6+ months)\n✅ Return ticket\n✅ Hotel booking confirmation\n\n💡 *Most Western tourists enter freely — no visa hassle!*\n\nNote: Visa rules change — always check your country's official guidance closer to travel.",
      suggestions: ['Safety in Tunisia?', 'Best time to visit?', 'Activities to book'],
    }),
  },

  // ── OPENING HOURS ──
  {
    id: 'hours',
    patterns: [/\b(open|hour|time|when.*open|close|schedule|available|morning|afternoon|evening|8am|7pm)\b/],
    response: () => ({
      text: "🕐 **Our Operating Hours:**\n\n☀️ **Daily: 8:00 AM – 7:00 PM**\n(All 3 locations)\n\n📅 **7 days a week** — including weekends & holidays!\n\n**Best times:**\n🌅 **Morning (8–10 AM):** Calmest sea, beautiful light, less busy\n☀️ **Midday (11–2 PM):** Busiest but most energy!\n🌇 **Afternoon (4–7 PM):** Sunset cruises, perfect light for photos\n\n💡 *We recommend booking morning slots in July–August — it fills up fast!*\n\n⚠️ Activities may pause during bad weather (we'll always contact you)",
      suggestions: ['Book morning slot', 'Sunset cruise time?', 'Book activity now'],
    }),
  },

  // ── GROUP BOOKING ──
  {
    id: 'group',
    patterns: [/\b(group|corporate|team|party|event|large|multiple|friends|school|stag|hen|bachelor|bachelorette|birthday\s*party)\b/],
    response: () => ({
      text: `🎉 **Group Bookings — We Love Big Parties!**\n\n**Group Discounts:**\n• 5–9 people: **15% off**\n• 10–19 people: **20% off**\n• 20+ people: **Custom quote** (up to 35% off!)\n\n**We can accommodate:**\n👨‍👩‍👧 Family gatherings\n🎂 Birthday parties\n🏢 Corporate team events\n💍 Stag/hen parties\n🏫 School groups (special safety brief)\n\n✅ Private beach area available for large groups\n✅ Custom activity schedule\n✅ Catering coordination\n✅ Group photographer available\n\n📞 WhatsApp us for a custom quote: ${PHONE_DISPLAY}`,
      suggestions: ['Get group quote', 'Corporate events?', 'Birthday party?'],
    }),
  },

  // ── RECOMMENDATIONS ──
  {
    id: 'recommend',
    patterns: [/\b(recommend|suggest|best|top|popular|famous|must|try|start|first.?time|never.*done|beginner)\b/],
    response: () => ({
      text: "⭐ **My Top Recommendations:**\n\n**For first-timers:**\n🥇 **Jet Ski** — safe, exciting, 15 min intro is perfect\n🥈 **Boat Trip** — great intro to the sea\n\n**For families:**\n👨‍👩‍👧 **Catamaran day trip** — everyone loves it\n\n**For couples:**\n💕 **Sunset Catamaran** — most romantic thing we offer\n\n**For thrill-seekers:**\n🔥 **Jet Ski + Parasailing combo** — best day ever!\n\n**Best value:**\n💰 **Boat Trip to Kuriat Islands** — includes snorkelling, turtles & dolphins!\n\nWhat kind of experience are you looking for?",
      suggestions: ['I want thrills!', 'Family outing?', 'Something romantic'],
    }),
  },

  // ── DOLPHINS / WILDLIFE ──
  {
    id: 'wildlife',
    patterns: [/\b(dolphin|turtle|whale|fish|wildlife|animal|nature|marine|sea.?life|snorkel|reef|underwater)\b/],
    response: () => ({
      text: "🐬 **Tunisia's Amazing Marine Life!**\n\n🐢 **Sea Turtles** — Kuriat Islands (Monastir)\n→ Protected nesting site, often spotted snorkelling!\n\n🐬 **Dolphins** — Mainly Mahdia coast\n→ Wild pods sometimes follow our boats!\n\n🐠 **Snorkelling:** Sea bass, octopus, starfish, sea urchins\n\n🦑 **Diving:** Underwater caves, WWII wrecks (advanced)\n\n**Best for wildlife:**\n🥇 **Kuriat Islands boat trip** — sea turtles near certain!\n🥈 **Mahdia boat trip** — dolphin spotting\n🥉 **Monastir snorkelling** — clearest water\n\n🌊 *Early morning trips = best wildlife sightings!*",
      suggestions: ['Kuriat Islands trip', 'Dolphin tour?', 'Snorkelling details'],
    }),
  },

  // ── CONTACT ──
  {
    id: 'contact',
    patterns: [/\b(contact|call|phone|whatsapp|email|reach|support|help|speak.*human|real.*person|talk.*someone)\b/],
    response: () => ({
      text: `📞 **Contact Quads Tunisia:**\n\n📱 **Phone:** ${PHONE_DISPLAY}\n💬 **WhatsApp:** ${PHONE_DISPLAY} *(fastest!)*\n✉️ **Email:** ${SUPPORT_EMAIL}\n🌐 **Website:** aquasports.tn\n\n📍 **Find us:**\n• Sousse: Port El Kantaoui Marina\n• Monastir: Marina Monastir\n• Mahdia: Mahdia Beach Club\n• Hammamet: Hammamet Beachfront\n\n🕐 **Response time:**\n• WhatsApp: within 30 min (8AM–7PM)\n• Email: within 24 hours\n\n🌍 We reply in English, French, German & Arabic!`,
      suggestions: ['WhatsApp now', 'Book online', 'Find our location'],
    }),
  },

  // ── THANK YOU ──
  {
    id: 'thanks',
    patterns: [/\b(thank|thanks|merci|danke|shukran|cheers|appreciate|helpful|great\s*answer|perfect|amazing)\b/],
    response: () => ({
      text: "You're very welcome! 😊\n\nI'm always here if you have more questions. Is there anything else I can help you plan for your Tunisian adventure?\n\n🌊 *Quads Tunisia — where every day is an adventure!*",
      suggestions: ['What else can you help with?', 'Book an activity', 'Contact the team'],
    }),
  },

  // ── GOODBYE ──
  {
    id: 'bye',
    patterns: [/\b(bye|goodbye|ciao|au\s*revoir|see\s*ya|later|leaving|done|that'?s\s*all)\b/],
    response: () => ({
      text: "Goodbye! 🌊 It was great chatting with you!\n\nWhenever you're ready to book your Tunisian adventure, we're here — online, by phone, or WhatsApp.\n\n🇹🇳 **See you on the water!** 🏄",
      suggestions: ['Book before I go!', 'One last question', 'Contact us'],
    }),
  },
];

// ── Intent Scoring Engine ──────────────────────────────────────────────────────
function scoreIntent(msg, entry) {
  let score = 0;
  const text = msg.toLowerCase();
  for (const pattern of entry.patterns) {
    if (pattern.test(text)) score += 10;
  }
  if (entry.anti) {
    for (const p of entry.anti) {
      if (p.test(text)) score -= 8;
    }
  }
  return score;
}

// ── Live data helpers (no API key, no LLM — just the DB activities) ──────────
const LOCATION_SLUGS = ['sousse', 'monastir', 'mahdia', 'hammamet'];
const CURRENCY_RATES = { GBP: 1, TND: 4, EUR: 1.17 };
const CURRENCY_SYMBOL = { GBP: '£', TND: 'TND', EUR: '€' };

function detectLocation(msg) {
  const m = msg.toLowerCase();
  return LOCATION_SLUGS.find(l => m.includes(l));
}

function detectCurrency(msg) {
  const m = msg.toLowerCase();
  if (/\beur(o)?s?\b|€/.test(m)) return 'EUR';
  if (/\btnd\b|dinar|tunisi(an|en)\s*dinar/.test(m)) return 'TND';
  if (/\bgbp\b|pound|sterling|£/.test(m)) return 'GBP';
  return 'GBP';
}

function detectPersonCount(msg) {
  const m = msg.toLowerCase();
  if (/\b(for\s+)?2\b|\btwo\b|\bcouple\b|\bdouble\b/.test(m)) return 2;
  if (/\b(for\s+)?1\b|\bone\b|\bsingle\b|\bsolo\b/.test(m)) return 1;
  return null;
}

function fmtPrice(gbp, currency) {
  const v = gbp * (CURRENCY_RATES[currency] || 1);
  if (currency === 'TND') return `${Math.round(v)} TND`;
  return `${CURRENCY_SYMBOL[currency]}${currency === 'GBP' ? Math.round(v) : v.toFixed(2)}`;
}

function findActivities(msg, activities) {
  const m = msg.toLowerCase();
  // Tokenize into 3+ char words, ignore filler
  const stopwords = new Set(['the','and','for','how','much','price','cost','what','about','tell','show','book','please','your','available','offer','have']);
  const tokens = m.match(/[a-z]{3,}/g)?.filter(t => !stopwords.has(t)) || [];
  if (tokens.length === 0) return [];
  return activities
    .map(a => {
      const haystack = `${a.name} ${a.category} ${a.description || ''}`.toLowerCase();
      const hits = tokens.filter(t => haystack.includes(t)).length;
      return { activity: a, score: hits };
    })
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);
}

function describeOptions(activity, currency) {
  if (!activity.pricingOptions) return null;
  try {
    const opts = JSON.parse(activity.pricingOptions);
    if (opts.length <= 1) return null;
    return opts.map(o => `• **${o.label}** — ${fmtPrice(o.price, currency)}`).join('\n');
  } catch { return null; } // eslint-disable-line
}

// Build a per-activity reply with options + locations + duration.
function activityCard(activity, currency, persons) {
  const locs = activity.location || 'all locations';
  const duration = activity.duration ? ` ⏱️ ${activity.duration}h` : '';
  const optsBlock = describeOptions(activity, currency);
  const lines = [`🎯 **${activity.name}**${duration} — 📍 ${locs}`];

  if (optsBlock) {
    lines.push('');
    // If user said "for 2", try to find a matching option
    if (persons) {
      try {
        const opts = JSON.parse(activity.pricingOptions);
        const match = opts.find(o => o.participants === persons);
        if (match) {
          lines.push(`For **${persons} ${persons === 1 ? 'person' : 'people'}**: **${fmtPrice(match.price, currency)}** (${match.label})`);
          lines.push('');
        }
      } catch { /* ignore */ } // eslint-disable-line
    }
    lines.push(optsBlock);
  } else {
    lines.push(`💰 **${fmtPrice(activity.price, currency)}**`);
  }
  return lines.join('\n');
}

// Dynamic intent: pull a real answer from the live activity catalogue.
// Returns null if it can't help — caller falls through to KB / generic fallback.
function tryDynamicAnswer(msg, activities) {
  if (!activities || activities.length === 0) return null;
  const text = msg.toLowerCase();
  const currency = detectCurrency(msg);
  const persons = detectPersonCount(msg);
  const location = detectLocation(msg);
  const wantsPrice = /\b(price|cost|how\s*much|tarif|combien|preis|kosten|سعر|كم|tnd|eur|gbp|pound|dinar|euro|£|\$|€)\b/i.test(text);

  // 1. "Activities in <location>" → list catalogue for that location
  if (location && /\b(activit|things|do|offer|available|available|propose|liste|list)/i.test(text)) {
    const filtered = activities.filter(a =>
      !a.location || a.location.toLowerCase().includes(location)
    );
    if (filtered.length === 0) return null;
    const top = filtered.slice(0, 8).map(a => `• **${a.name}** — ${fmtPrice(a.price, currency)}${a.duration ? ` (${a.duration}h)` : ''}`).join('\n');
    const more = filtered.length > 8 ? `\n\n_…and ${filtered.length - 8} more — visit /booking/${location} for the full list._` : '';
    return {
      text: `📍 **Activities in ${location[0].toUpperCase() + location.slice(1)}** (${filtered.length} total):\n\n${top}${more}`,
      suggestions: ['Best for families?', 'Cheapest options', 'Book now'],
    };
  }

  // 2. Specific activity question → pull that activity's card
  const matches = findActivities(msg, activities);
  if (matches.length > 0) {
    // Cap at 3 cards to avoid wall-of-text
    const shown = matches.slice(0, 3);
    const cards = shown.map(({ activity }) => activityCard(activity, currency, persons)).join('\n\n──────────\n\n');
    const intro = wantsPrice
      ? `💰 Here's what I found${location ? ` in ${location[0].toUpperCase() + location.slice(1)}` : ''}:`
      : `🎯 Found ${shown.length} match${shown.length > 1 ? 'es' : ''}:`;
    return {
      text: `${intro}\n\n${cards}\n\n👉 Tap **"Book on WhatsApp"** below or visit **/locations** to reserve.`,
      suggestions: ['Book this', 'Compare another', 'WhatsApp us'],
    };
  }

  // 3. "Cheapest" / "best value" → sort by price
  if (/\b(cheap(est)?|budget|low(est)?|affordable|less.*expensive|economic|pas\s*cher|günstig)\b/i.test(text)) {
    const cheapest = [...activities].sort((a, b) => a.price - b.price).slice(0, 5);
    const list = cheapest.map(a => `• **${a.name}** — ${fmtPrice(a.price, currency)}${a.duration ? ` (${a.duration}h)` : ''}`).join('\n');
    return {
      text: `💸 **Best value picks** (${currency}):\n\n${list}\n\n_All include FREE pickup 🚐_`,
      suggestions: ['Tell me more', 'Activities for kids', 'Book now'],
    };
  }

  // 4. "Family" / "kids" / "all ages" → activities flagged Beginner
  if (/\b(family|kids?|child(ren)?|enfant|kinder|all\s*ages)\b/i.test(text)) {
    const family = activities.filter(a => a.difficulty === 'Beginner').slice(0, 6);
    if (family.length > 0) {
      const list = family.map(a => `• **${a.name}** — ${fmtPrice(a.price, currency)}`).join('\n');
      return {
        text: `👨‍👩‍👧 **Family-friendly activities** (suitable for all ages):\n\n${list}\n\n_All include FREE pickup 🚐 and a professional guide._`,
        suggestions: ['Show prices in TND', 'Book a family trip', 'WhatsApp us'],
      };
    }
  }

  // 5. Currency conversion question — "in euros", "in TND" — show all if no specific activity
  if (currency !== 'GBP' && /\bin\s+(eur|euro|tnd|dinar|gbp|pound)/i.test(text)) {
    const sample = activities.slice(0, 6);
    const list = sample.map(a => `• ${a.name}: **${fmtPrice(a.price, currency)}**`).join('\n');
    return {
      text: `💱 Sample prices in **${currency}**:\n\n${list}\n\n_Switch currency on the booking page for the full catalogue._`,
      suggestions: ['Show all prices', 'Cheapest activity', 'Book now'],
    };
  }

  return null;
}

function getAIResponse(message, history = [], activities = []) {
  const msg = message.toLowerCase().trim();

  // Score every KB entry
  const scored = KB.map(entry => ({ entry, score: scoreIntent(msg, entry) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score);

  // Try dynamic data-driven answer first if KB doesn't strongly match.
  // Threshold of 10 means "exactly one pattern hit" — anything stronger
  // (multiple hits, KB intent stacking) takes priority over dynamic.
  const topKbScore = scored[0]?.score || 0;
  if (topKbScore < 20) {
    const dyn = tryDynamicAnswer(msg, activities);
    if (dyn) return dyn;
  }

  if (scored.length > 0) {
    return scored[0].entry.response();
  }

  // Context-aware fallback: look at recent AI message topic
  const lastAI = [...history].reverse().find(m => m.role === 'ai');
  if (lastAI?.text?.includes('Jet Ski')) {
    return {
      text: "Still curious about **Jet Ski**? 🏄 You can book directly on our site, or ask me anything specific — session lengths, age limits, what's included...",
      suggestions: ['Book Jet Ski', 'Safety details', 'Jet Ski prices'],
    };
  }

  // Generic fallback with helpful structure
  return {
    text: "🌊 Good question! I want to make sure I give you the right answer.\n\nI can help with:\n\n🏄 **Activities** — jet ski, parasailing, catamaran & more\n💰 **Prices & deals** — best value options\n📍 **Locations** — Sousse, Monastir, Mahdia, Hammamet\n🛡️ **Safety & ages** — who can do what\n📅 **Booking** — how to reserve your spot\n🌡️ **Weather & best time** — when to come\n\nTry asking something like: *\"how much is parasailing for 2?\"* or *\"activities in Mahdia\"*",
    suggestions: ['Show all activities', 'Activities in Mahdia', 'Cheapest options'],
  };
}

// ── Chat UI ────────────────────────────────────────────────────────────────────
export default function AIChat() {
  const [isOpen, setIsOpen]   = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "Marhba! 🌊 I'm **Quads AI** — your personal adventure guide for Tunisia!\n\nI can answer questions about activities, prices, locations, safety, weather, food, transport, and much more. What would you like to know?",
      suggestions: ['What activities do you offer?', 'Show me prices', 'Best for families?'],
    },
  ]);
  const [input, setInput]     = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [unread, setUnread]   = useState(true);
  const [liveActivities, setLiveActivities] = useState([]);
  const messagesEndRef        = useRef(null);
  const inputRef              = useRef(null);

  // Pull live activity catalogue once when the chat first opens. Cheap (one
  // request, cached in component state) and lets the KB answer specific price
  // questions from real DB data instead of hardcoded numbers.
  useEffect(() => {
    if (!isOpen || liveActivities.length > 0) return;
    activitiesAPI.getAll({ isActive: 'true' })
      .then(r => setLiveActivities(r.data || []))
      .catch(() => { /* fail silent — KB still works without live data */ }); // eslint-disable-line
  }, [isOpen, liveActivities.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  useEffect(() => {
    if (isOpen) {
      setUnread(false);
      const t = setTimeout(() => inputRef.current?.focus(), 150);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const sendMessage = (text) => {
    const msg = (text !== undefined ? text : input).trim();
    if (!msg) return;
    const newMessages = [...messages, { role: 'user', text: msg }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);
    const delay = 500 + Math.random() * 600;
    setTimeout(() => {
      const response = getAIResponse(msg, newMessages, liveActivities);
      setMessages(prev => [...prev, { role: 'ai', ...response }]);
      setIsTyping(false);
    }, delay);
  };

  const formatText = (text) =>
    text.split('\n').map((line, i, arr) => {
      const parts = line.split(/\*\*(.*?)\*\*/);
      return (
        <span key={i}>
          {parts.map((p, j) => (j % 2 === 1 ? <strong key={j}>{p}</strong> : p))}
          {i < arr.length - 1 && <br />}
        </span>
      );
    });

  return (
    <>
      {isOpen && (
        <div className="ai-chat-window">
          {/* Header */}
          <div className="ai-chat-header">
            <div className="ai-avatar-wrap">
              <div className="ai-avatar-circle">🌊</div>
              <div className="ai-online-dot" />
            </div>
            <div className="ai-header-info">
              <div className="ai-header-name">Quads AI</div>
              <div className="ai-header-status">
                <span className="ai-status-dot" />
                Online · Knows everything about Tunisia 🇹🇳
              </div>
            </div>
            <button className="ai-close-btn" onClick={() => setIsOpen(false)}>
              <svg viewBox="0 0 24 24" fill="currentColor" width="18" height="18">
                <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
              </svg>
            </button>
          </div>

          {/* Messages */}
          <div className="ai-messages-container">
            {messages.map((msg, idx) => (
              <div key={idx} className={`ai-msg-row ${msg.role}`}>
                {msg.role === 'ai' && <div className="ai-msg-icon">🌊</div>}
                <div className="ai-msg-body">
                  <div className={`ai-bubble ${msg.role}`}>{formatText(msg.text)}</div>
                  {msg.role === 'ai' && msg.suggestions && (
                    <div className="ai-chips">
                      {msg.suggestions.map((s, si) => (
                        <button key={si} className="ai-chip" onClick={() => sendMessage(s)}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isTyping && (
              <div className="ai-msg-row ai">
                <div className="ai-msg-icon">🌊</div>
                <div className="ai-msg-body">
                  <div className="ai-bubble ai ai-typing-bubble">
                    <div className="ai-typing-dots"><div /><div /><div /></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="ai-input-area">
            <input
              ref={inputRef}
              className="ai-input"
              type="text"
              placeholder="Ask anything — prices, safety, weather, food…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') sendMessage(); }}
            />
            <button
              className="ai-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim()}
            >
              <svg viewBox="0 0 24 24" fill="currentColor" width="20" height="20">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        className={`ai-fab ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen((o) => !o)}
        aria-label="Open AI Adventure Guide"
      >
        <div className="ai-fab-ring" />
        <div className="ai-fab-ring ring2" />
        {isOpen ? (
          <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
            <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" fill="white" width="24" height="24">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z" />
          </svg>
        )}
        {!isOpen && unread && <span className="ai-fab-badge">AI</span>}
      </button>
    </>
  );
}
