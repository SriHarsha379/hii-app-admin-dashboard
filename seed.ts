/**
 * seed.ts  — Run with:  npx tsx seed.ts
 *
 * Images use:
 *   picsum.photos  — real landscape/portrait photos (free, no API key)
 *   ui-avatars.com — letter-avatar for artists (free, no API key)
 *
 * Every seed image URL is a permanent, publicly accessible URL that works
 * immediately in <img src> tags and survives every redeploy.
 * When you're ready, you can replace them with real uploads via /api/upload.
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

const MONGO_URI = process.env.MONGO_URI || '';
if (!MONGO_URI) { console.error('❌ MONGO_URI not set'); process.exit(1); }

// ─── Image helpers ────────────────────────────────────────────────────────────
// picsum.photos uses a seed string so the same seed always returns the same image
const pic = (seed: string, w: number, h: number) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

// landscape 16:9  (venue cover / event banner)
const landscape = (seed: string) => pic(seed, 1280, 720);

// portrait  4:5   (event poster)
const portrait  = (seed: string) => pic(seed, 800, 1000);

// square avatar for artists
const avatar = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=256&background=1a1a2e&color=ff2d9a&bold=true&format=png`;

// ════════════════════════════════════════════════════════════════════════════
// SCHEMAS
// ════════════════════════════════════════════════════════════════════════════

const FilterOptionSchema = new mongoose.Schema({
  name: { type: String, unique: true, required: true, trim: true },
  status: { type: String, default: 'ACTIVE' },
  is_active: { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
}, { timestamps: true });

const GenreModel     = mongoose.models.Genre     || mongoose.model('Genre',     FilterOptionSchema, 'genres');
const EventTypeModel = mongoose.models.EventType || mongoose.model('EventType', FilterOptionSchema, 'event_types');
const VenueTypeModel = mongoose.models.VenueType || mongoose.model('VenueType', FilterOptionSchema, 'venue_types');

const CitySchema = new mongoose.Schema({
  city_name:  { type: String, unique: true, trim: true },
  latitude:   { type: Number },
  longitude:  { type: Number },
  is_active:  { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
}, { timestamps: true, collection: 'cities' });
const CityModel = mongoose.models.City || mongoose.model('City', CitySchema);

const VendorSchema = new mongoose.Schema({
  name:           { type: String, trim: true },
  email:          { type: String },
  type:           { type: String },
  phone:          { type: String },
  description:    { type: String },
  city:           { type: String },
  address:        { type: String },
  capacity:       { type: Number },
  portrait_url:   { type: String, default: '' },
  landscape_urls: [{ type: String }],
  working_hours: [{
    day:    { type: String },
    time:   { type: String },
    active: { type: Boolean, default: false },
  }],
  status:     { type: String, default: 'ACTIVE' },
  is_active:  { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
}, { timestamps: true });
const VendorModel = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);

const EventSchema = new mongoose.Schema({
  title:          { type: String, required: true, trim: true },
  description:    { type: String, default: '' },
  date:           { type: String },
  start_time:     { type: String },
  end_time:       { type: String },
  city:           { type: String },
  address:        { type: String },
  poster_url:     { type: String, default: '' },
  landscape_urls: [{ type: String }],
  ticketing_link: { type: String, default: '' },
  genre:          [{ type: String }],
  event_type:     [{ type: String }],
  venue_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  venue_name:     { type: String },
  category:       { type: String },
  artists: [{
    name: { type: String }, title: { type: String },
    subtitle: { type: String }, image: { type: String },
  }],
  event_layout_images:  [{ image_url: String }],
  terms_and_conditions: [{ item: String }],
  faqs:                 [{ question: String, answer: String }],
  prohibited_items:     [{ item: String }],
  status:     { type: String, default: 'UPCOMING' },
  is_active:  { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
}, { timestamps: true });
const EventModel = mongoose.models.Event || mongoose.model('Event', EventSchema);

// ════════════════════════════════════════════════════════════════════════════
// REFERENCE DATA
// ════════════════════════════════════════════════════════════════════════════

const GENRES = [
  'Bollywood','EDM','Commercial','House','Tech House','Hip Hop','R&B',
  'Techno','Minimal Techno','Trance','Psychedelic music','Afrobeats',
  'Reggaeton','Deep House','Progressive House','Drum & Bass','Rock Music','Pop','Acoustic',
];

const EVENT_TYPES = [
  'DJ Night','Festival','Comedy','Live Music','Theme Party',
  'Karaoke Night','Open Mic','Concert','Pool Party','Sundowner','Workshop',
];

const VENUE_TYPES = [
  'Bar/Pub','Beach Club','Lounge','Nightclub','Banquet Hall','Restaurant',
  'Cafe','Auditorium','Stadium','Resort','Rooftop','Open Air','Hotel',
  'Garden/Lawn','Cruise Ship/Boat',
];

const CITIES = [
  { city_name: 'Mumbai',    latitude: 19.0760, longitude: 72.8777 },
  { city_name: 'Delhi',     latitude: 28.6139, longitude: 77.2090 },
  { city_name: 'Bangalore', latitude: 12.9716, longitude: 77.5946 },
  { city_name: 'Goa',       latitude: 15.2993, longitude: 74.1240 },
  { city_name: 'Pune',      latitude: 18.5204, longitude: 73.8567 },
  { city_name: 'Hyderabad', latitude: 17.3850, longitude: 78.4867 },
];

// ════════════════════════════════════════════════════════════════════════════
// VENDORS  — portrait_url = tall club photo (9:16)
//          — landscape_urls = 3 cover shots (16:9)
// ════════════════════════════════════════════════════════════════════════════

const VENDORS = [
  {
    name:        'The Vault',
    email:       'contact@thevault.com',
    phone:       '+91 98200 11111',
    type:        'Nightclub',
    city:        'Mumbai',
    address:     '123 Colaba Causeway, Mumbai 400001',
    capacity:    800,
    description: "Mumbai's premier underground nightclub. Three floors of music, two bars, and a rooftop terrace.",
    portrait_url:   pic('vault-portrait',  800, 1420),
    landscape_urls: [
      landscape('vault-main'),
      landscape('vault-bar'),
      landscape('vault-floor'),
    ],
    working_hours: [
      { day: 'Thursday', time: '10:00 PM - 04:00 AM', active: true },
      { day: 'Friday',   time: '10:00 PM - 05:00 AM', active: true },
      { day: 'Saturday', time: '10:00 PM - 05:00 AM', active: true },
    ],
    status: 'ACTIVE',
  },
  {
    name:        'Neon Lounge',
    email:       'info@neonlounge.in',
    phone:       '+91 98200 22222',
    type:        'Lounge',
    city:        'Delhi',
    address:     '45 Hauz Khas Village, New Delhi 110016',
    capacity:    350,
    description: 'Intimate lounge venue in the heart of Hauz Khas. Known for curated DJ sets and craft cocktails.',
    portrait_url:   pic('neon-portrait',  800, 1420),
    landscape_urls: [
      landscape('neon-main'),
      landscape('neon-bar'),
      landscape('neon-stage'),
    ],
    working_hours: [
      { day: 'Wednesday', time: '09:00 PM - 03:00 AM', active: true },
      { day: 'Thursday',  time: '09:00 PM - 03:00 AM', active: true },
      { day: 'Friday',    time: '09:00 PM - 04:00 AM', active: true },
      { day: 'Saturday',  time: '09:00 PM - 04:00 AM', active: true },
    ],
    status: 'ACTIVE',
  },
  {
    name:        'Beach House Goa',
    email:       'hello@beachhouse.com',
    phone:       '+91 98200 33333',
    type:        'Beach Club',
    city:        'Goa',
    address:     'Baga Beach Road, Calangute, Goa 403516',
    capacity:    1200,
    description: 'Open-air beach club on Baga Beach. Sunsets, sand, and the best electronic music in Goa.',
    portrait_url:   pic('beach-portrait', 800, 1420),
    landscape_urls: [
      landscape('beach-main'),
      landscape('beach-sunset'),
      landscape('beach-crowd'),
    ],
    working_hours: [
      { day: 'Friday',   time: '06:00 PM - 04:00 AM', active: true },
      { day: 'Saturday', time: '06:00 PM - 04:00 AM', active: true },
      { day: 'Sunday',   time: '06:00 PM - 02:00 AM', active: true },
    ],
    status: 'ACTIVE',
  },
  {
    name:        'Skyline Rooftop',
    email:       'bookings@skyline.in',
    phone:       '+91 98200 44444',
    type:        'Rooftop',
    city:        'Bangalore',
    address:     '100 Feet Road, Indiranagar, Bangalore 560038',
    capacity:    500,
    description: 'Rooftop venue with panoramic views of Bangalore. Specialises in commercial house and Bollywood nights.',
    portrait_url:   pic('skyline-portrait', 800, 1420),
    landscape_urls: [
      landscape('skyline-main'),
      landscape('skyline-view'),
      landscape('skyline-night'),
    ],
    working_hours: [
      { day: 'Thursday', time: '08:00 PM - 02:00 AM', active: true },
      { day: 'Friday',   time: '08:00 PM - 03:00 AM', active: true },
      { day: 'Saturday', time: '08:00 PM - 03:00 AM', active: true },
    ],
    status: 'ACTIVE',
  },
  {
    name:        'Underground Beats',
    email:       'underground@beats.com',
    phone:       '+91 98200 55555',
    type:        'Nightclub',
    city:        'Mumbai',
    address:     'Lower Parel, Mumbai 400013',
    capacity:    600,
    description: 'The go-to venue for techno and minimal techno in Mumbai. Resident DJs every weekend.',
    portrait_url:   pic('underground-portrait', 800, 1420),
    landscape_urls: [
      landscape('underground-main'),
      landscape('underground-dark'),
      landscape('underground-booth'),
    ],
    working_hours: [
      { day: 'Friday',   time: '11:00 PM - 06:00 AM', active: true },
      { day: 'Saturday', time: '11:00 PM - 06:00 AM', active: true },
    ],
    status: 'ACTIVE',
  },
];

// ════════════════════════════════════════════════════════════════════════════
// EVENTS  — poster_url   = 4:5 portrait poster
//         — landscape_urls = 16:9 banner/gallery shots
//         — artists[].image = letter avatar
// ════════════════════════════════════════════════════════════════════════════

const buildEvents = (vendors: any[]) => {
  const v = (name: string) => {
    const found = vendors.find((x: any) => x.name === name);
    if (!found) throw new Error(`Vendor "${name}" not found`);
    return { id: found._id, name: found.name, city: found.city };
  };

  const future = (days: number) => {
    const d = new Date(); d.setDate(d.getDate() + days);
    return d.toISOString().split('T')[0];
  };
  const past = (days: number) => {
    const d = new Date(); d.setDate(d.getDate() - days);
    return d.toISOString().split('T')[0];
  };

  return [
    // ── The Vault ────────────────────────────────────────────────────────────
    {
      title:       'Midnight Eclipse',
      description: "A night of pure techno and minimal beats. Headlined by Berlin-based DJ Kollektiv and Mumbai's own Syne. Expect dark rooms, strobes, and relentless 4/4 rhythms until sunrise.",
      date: future(7), start_time: '22:00', end_time: '05:00',
      city: v('The Vault').city, address: '123 Colaba Causeway, Mumbai 400001',
      poster_url:    portrait('midnight-eclipse-poster'),
      landscape_urls: [
        landscape('midnight-eclipse-banner'),
        landscape('midnight-eclipse-crowd'),
        landscape('midnight-eclipse-lights'),
      ],
      ticketing_link: 'https://tickets.example.com/midnight-eclipse',
      genre: ['Techno', 'Minimal Techno'], event_type: ['DJ Night'],
      venue_id: v('The Vault').id, venue_name: v('The Vault').name,
      category: 'Techno',
      artists: [
        { name: 'DJ Kollektiv', title: 'Headliner', subtitle: 'Berlin', image: avatar('DJ Kollektiv') },
        { name: 'Syne',         title: 'Support',   subtitle: 'Mumbai', image: avatar('Syne')         },
      ],
      event_layout_images: [
        { image_url: landscape('eclipse-layout-1') },
        { image_url: landscape('eclipse-layout-2') },
      ],
      terms_and_conditions: [
        { item: 'No re-entry after midnight' },
        { item: 'Valid photo ID required' },
        { item: 'Dress code strictly enforced' },
      ],
      faqs: [
        { question: 'Is there a dress code?', answer: 'Smart casual. No slippers or shorts.' },
        { question: 'Is parking available?',  answer: 'Valet parking available at ₹200.' },
      ],
      prohibited_items: [
        { item: 'Outside food and beverages' },
        { item: 'Professional cameras' },
      ],
      status: 'UPCOMING', is_active: true,
    },
    {
      title:       'Bass Culture Vol. 3',
      description: 'The third edition of our wildly popular drum & bass series. Four hours of rolling basslines and intricate percussion.',
      date: future(14), start_time: '21:00', end_time: '04:00',
      city: v('The Vault').city, address: '123 Colaba Causeway, Mumbai 400001',
      poster_url:    portrait('bass-culture-poster'),
      landscape_urls: [
        landscape('bass-culture-banner'),
        landscape('bass-culture-dj'),
      ],
      ticketing_link: 'https://tickets.example.com/bass-culture-3',
      genre: ['Drum & Bass', 'EDM'], event_type: ['DJ Night', 'Live Music'],
      venue_id: v('The Vault').id, venue_name: v('The Vault').name,
      category: 'Drum & Bass',
      artists: [
        { name: 'MC Freight', title: 'MC',        subtitle: 'London', image: avatar('MC Freight') },
        { name: 'DJ Liqtech', title: 'Headliner', subtitle: 'Berlin', image: avatar('DJ Liqtech') },
      ],
      status: 'UPCOMING', is_active: true,
    },
    {
      title:       "New Year's Countdown 2024",
      description: 'Ring in the new year at The Vault. Open bar from 11pm to midnight, followed by a confetti drop and 5 hours of non-stop music.',
      date: past(30), start_time: '21:00', end_time: '06:00',
      city: v('The Vault').city, address: '123 Colaba Causeway, Mumbai 400001',
      poster_url:    portrait('nye-poster'),
      landscape_urls: [
        landscape('nye-banner'),
        landscape('nye-crowd'),
        landscape('nye-confetti'),
      ],
      ticketing_link: '',
      genre: ['EDM', 'Commercial', 'House'], event_type: ['DJ Night', 'Theme Party'],
      venue_id: v('The Vault').id, venue_name: v('The Vault').name,
      category: 'EDM',
      artists: [
        { name: 'KSHMR',     title: 'Headliner', subtitle: 'USA',    image: avatar('KSHMR')     },
        { name: 'DJ Chetas', title: 'Support',   subtitle: 'Mumbai', image: avatar('DJ Chetas') },
      ],
      status: 'UPCOMING', is_active: false,
    },

    // ── Neon Lounge ──────────────────────────────────────────────────────────
    {
      title:       'Deep Dive Sundays',
      description: 'A curated selection of deep house and afrobeats every Sunday evening. Laid-back vibes, great cocktails, no cover charge before 9pm.',
      date: future(10), start_time: '20:00', end_time: '02:00',
      city: v('Neon Lounge').city, address: '45 Hauz Khas Village, New Delhi 110016',
      poster_url:    portrait('deep-dive-poster'),
      landscape_urls: [
        landscape('deep-dive-banner'),
        landscape('deep-dive-lounge'),
      ],
      ticketing_link: '',
      genre: ['Deep House', 'Afrobeats'], event_type: ['DJ Night', 'Sundowner'],
      venue_id: v('Neon Lounge').id, venue_name: v('Neon Lounge').name,
      category: 'Deep House',
      artists: [
        { name: 'Arjun Vagale', title: 'Resident DJ', subtitle: 'Delhi', image: avatar('Arjun Vagale') },
      ],
      status: 'UPCOMING', is_active: true,
    },
    {
      title:       'Hip Hop & R&B Night',
      description: "Old school meets new school. A full night of hip hop classics and contemporary R&B with live freestyles from Delhi's best MCs.",
      date: future(21), start_time: '21:00', end_time: '03:00',
      city: v('Neon Lounge').city, address: '45 Hauz Khas Village, New Delhi 110016',
      poster_url:    portrait('hiphop-poster'),
      landscape_urls: [
        landscape('hiphop-banner'),
        landscape('hiphop-stage'),
        landscape('hiphop-crowd'),
      ],
      ticketing_link: 'https://tickets.example.com/hiphop-rnb',
      genre: ['Hip Hop', 'R&B'], event_type: ['DJ Night', 'Live Music'],
      venue_id: v('Neon Lounge').id, venue_name: v('Neon Lounge').name,
      category: 'Hip Hop',
      artists: [
        { name: 'Divine',   title: 'Headliner', subtitle: 'Mumbai', image: avatar('Divine')   },
        { name: 'MC Altaf', title: 'Support',   subtitle: 'Delhi',  image: avatar('MC Altaf') },
      ],
      status: 'UPCOMING', is_active: true,
    },

    // ── Beach House Goa ──────────────────────────────────────────────────────
    {
      title:       'Sunburn Warm-Up',
      description: 'The official warm-up party for Sunburn Festival. International DJs, premium sound system, and Baga Beach as your backdrop.',
      date: future(5), start_time: '17:00', end_time: '04:00',
      city: v('Beach House Goa').city, address: 'Baga Beach Road, Calangute, Goa 403516',
      poster_url:    portrait('sunburn-poster'),
      landscape_urls: [
        landscape('sunburn-banner'),
        landscape('sunburn-beach'),
        landscape('sunburn-stage'),
      ],
      ticketing_link: 'https://tickets.example.com/sunburn-warmup',
      genre: ['EDM', 'Progressive House', 'Trance'], event_type: ['Festival', 'DJ Night'],
      venue_id: v('Beach House Goa').id, venue_name: v('Beach House Goa').name,
      category: 'EDM',
      artists: [
        { name: 'Nucleya',      title: 'Headliner', subtitle: 'India', image: avatar('Nucleya')      },
        { name: 'Lost Stories', title: 'Support',   subtitle: 'India', image: avatar('Lost Stories') },
      ],
      terms_and_conditions: [
        { item: 'Entry restricted to 18+ with valid ID' },
        { item: 'No outside alcohol permitted' },
      ],
      status: 'UPCOMING', is_active: true,
    },
    {
      title:       'Reggaeton Playa',
      description: 'A Latin night on the beach. Reggaeton, dancehall, and Afrobeats under the stars. Dress code: beach chic.',
      date: future(18), start_time: '19:00', end_time: '03:00',
      city: v('Beach House Goa').city, address: 'Baga Beach Road, Calangute, Goa 403516',
      poster_url:    portrait('reggaeton-poster'),
      landscape_urls: [
        landscape('reggaeton-banner'),
        landscape('reggaeton-night'),
      ],
      ticketing_link: '',
      genre: ['Reggaeton', 'Afrobeats'], event_type: ['DJ Night', 'Theme Party'],
      venue_id: v('Beach House Goa').id, venue_name: v('Beach House Goa').name,
      category: 'Reggaeton',
      artists: [
        { name: 'DJ Pheno', title: 'Headliner', subtitle: 'Goa', image: avatar('DJ Pheno') },
      ],
      status: 'UPCOMING', is_active: true,
    },

    // ── Skyline Rooftop ──────────────────────────────────────────────────────
    {
      title:       'Bollywood Nights',
      description: 'The biggest Bollywood party in Bangalore. Non-stop hits from the 90s to today, plus surprise celebrity appearances.',
      date: future(3), start_time: '20:00', end_time: '02:00',
      city: v('Skyline Rooftop').city, address: '100 Feet Road, Indiranagar, Bangalore 560038',
      poster_url:    portrait('bollywood-poster'),
      landscape_urls: [
        landscape('bollywood-banner'),
        landscape('bollywood-crowd'),
        landscape('bollywood-lights'),
      ],
      ticketing_link: 'https://tickets.example.com/bollywood-nights',
      genre: ['Bollywood', 'Commercial'], event_type: ['DJ Night', 'Theme Party'],
      venue_id: v('Skyline Rooftop').id, venue_name: v('Skyline Rooftop').name,
      category: 'Bollywood',
      artists: [
        { name: 'DJ Suketu', title: 'Headliner', subtitle: 'Mumbai',    image: avatar('DJ Suketu') },
        { name: 'DJ NYK',    title: 'Support',   subtitle: 'Bangalore', image: avatar('DJ NYK')    },
      ],
      status: 'UPCOMING', is_active: true,
    },
    {
      title:       'Sundowner Sessions',
      description: 'Watch the Bangalore skyline turn golden while listening to progressive house and deep house. Cocktail hour starts at 7pm.',
      date: future(25), start_time: '19:00', end_time: '01:00',
      city: v('Skyline Rooftop').city, address: '100 Feet Road, Indiranagar, Bangalore 560038',
      poster_url:    portrait('sundowner-poster'),
      landscape_urls: [
        landscape('sundowner-banner'),
        landscape('sundowner-sky'),
      ],
      ticketing_link: '',
      genre: ['Progressive House', 'Deep House', 'House'], event_type: ['Sundowner', 'DJ Night'],
      venue_id: v('Skyline Rooftop').id, venue_name: v('Skyline Rooftop').name,
      category: 'Progressive House',
      artists: [
        { name: 'Ankytrixx', title: 'Headliner', subtitle: 'Mumbai', image: avatar('Ankytrixx') },
      ],
      status: 'UPCOMING', is_active: true,
    },

    // ── Underground Beats ────────────────────────────────────────────────────
    {
      title:       'Void — A Techno Experience',
      description: 'No phones. No photos. Just you and the music. A sensory techno experience in complete darkness with a 30,000W sound system.',
      date: future(12), start_time: '23:00', end_time: '06:00',
      city: v('Underground Beats').city, address: 'Lower Parel, Mumbai 400013',
      poster_url:    portrait('void-poster'),
      landscape_urls: [
        landscape('void-banner'),
        landscape('void-dark'),
        landscape('void-booth'),
      ],
      ticketing_link: 'https://tickets.example.com/void-techno',
      genre: ['Techno', 'Minimal Techno', 'Tech House'], event_type: ['DJ Night'],
      venue_id: v('Underground Beats').id, venue_name: v('Underground Beats').name,
      category: 'Techno',
      artists: [
        { name: 'Perc',   title: 'Headliner', subtitle: 'London', image: avatar('Perc')   },
        { name: 'Blawan', title: 'Headliner', subtitle: 'UK',     image: avatar('Blawan') },
        { name: 'Kohra',  title: 'Support',   subtitle: 'India',  image: avatar('Kohra')  },
      ],
      event_layout_images: [
        { image_url: landscape('void-layout-1') },
        { image_url: landscape('void-layout-2') },
      ],
      terms_and_conditions: [
        { item: 'Phone cameras must be covered with stickers provided at entry' },
        { item: 'Strictly 21+ event' },
        { item: 'No refunds after purchase' },
      ],
      faqs: [
        { question: 'Why no phones?',      answer: 'We believe music is experienced, not filmed. Stickers provided at door.' },
        { question: 'Is there cloakroom?', answer: 'Yes, free of charge.' },
      ],
      prohibited_items: [
        { item: 'Uncovered phone cameras' },
        { item: 'Outside drinks' },
        { item: 'Backpacks larger than A4' },
      ],
      status: 'UPCOMING', is_active: true,
    },
    {
      title:       'Tech House Tuesday',
      description: 'Weekly Tuesday residency featuring the best tech house DJs from India and abroad.',
      date: past(15), start_time: '22:00', end_time: '04:00',
      city: v('Underground Beats').city, address: 'Lower Parel, Mumbai 400013',
      poster_url:    portrait('techhouse-poster'),
      landscape_urls: [
        landscape('techhouse-banner'),
        landscape('techhouse-crowd'),
      ],
      ticketing_link: '',
      genre: ['Tech House', 'House'], event_type: ['DJ Night'],
      venue_id: v('Underground Beats').id, venue_name: v('Underground Beats').name,
      category: 'Tech House',
      artists: [
        { name: 'Sohail Arora', title: 'Resident', subtitle: 'Mumbai', image: avatar('Sohail Arora') },
      ],
      status: 'UPCOMING', is_active: false,
    },
  ];
};

// ════════════════════════════════════════════════════════════════════════════
// SEED
// ════════════════════════════════════════════════════════════════════════════

async function seed() {
  await mongoose.connect(MONGO_URI);
  console.log('✅ Connected to MongoDB\n');

  const upsertMany = async (model: any, names: string[], extra = {}) => {
    await Promise.all(names.map(name =>
      model.updateOne(
        { name },
        { $setOnInsert: { name }, $set: { ...extra, is_active: true, is_deleted: false } },
        { upsert: true }
      )
    ));
  };

  console.log('📀 Seeding genres...');
  await upsertMany(GenreModel, GENRES, { status: 'ACTIVE' });
  console.log(`   ✔ ${await (GenreModel as any).countDocuments()} genres`);

  console.log('📀 Seeding event types...');
  await upsertMany(EventTypeModel, EVENT_TYPES, { status: 'ACTIVE' });
  console.log(`   ✔ ${await (EventTypeModel as any).countDocuments()} event types`);

  console.log('📀 Seeding venue types...');
  await upsertMany(VenueTypeModel, VENUE_TYPES, { status: 'ACTIVE' });
  console.log(`   ✔ ${await (VenueTypeModel as any).countDocuments()} venue types`);

  console.log('📀 Seeding cities...');
  await Promise.all(CITIES.map(c =>
    CityModel.updateOne(
      { city_name: c.city_name },
      { $setOnInsert: c, $set: { is_active: true, is_deleted: false } },
      { upsert: true }
    )
  ));
  console.log(`   ✔ ${await (CityModel as any).countDocuments()} cities`);

  console.log('\n📀 Seeding vendors (clubs)...');
  const insertedVendors: any[] = [];
  for (const v of VENDORS) {
    const existing = await (VendorModel as any).findOne({ name: v.name, is_deleted: false });
    if (existing) {
      // Update images even if vendor already exists
      await (VendorModel as any).findByIdAndUpdate(existing._id, {
        portrait_url: v.portrait_url,
        landscape_urls: v.landscape_urls,
      });
      console.log(`   ↻  Updated images for "${v.name}"`);
      insertedVendors.push({ ...existing.toObject(), ...v, _id: existing._id });
    } else {
      const created = await (VendorModel as any).create(v);
      console.log(`   ✔  Created "${created.name}" (${created.type}, ${created.city}) → ${created._id}`);
      console.log(`       portrait:  ${v.portrait_url}`);
      console.log(`       covers:    ${v.landscape_urls.length} images`);
      insertedVendors.push(created);
    }
  }

  console.log('\n📀 Seeding events...');
  const events = buildEvents(insertedVendors);
  let createdCount = 0, skippedCount = 0;
  for (const e of events) {
    const existing = await (EventModel as any).findOne({ title: e.title, venue_id: e.venue_id, is_deleted: false });
    if (existing) {
      // Update images even if event already exists
      await (EventModel as any).findByIdAndUpdate(existing._id, {
        poster_url:     e.poster_url,
        landscape_urls: e.landscape_urls,
        'artists': e.artists,
      });
      console.log(`   ↻  Updated images for "${e.title}"`);
      skippedCount++;
    } else {
      await (EventModel as any).create(e);
      console.log(`   ✔  "${e.title}"`);
      console.log(`       venue:   ${e.venue_name} (${e.city})`);
      console.log(`       date:    ${e.date}  ${e.start_time}–${e.end_time}`);
      console.log(`       genres:  ${e.genre.join(', ')}`);
      console.log(`       poster:  ${e.poster_url}`);
      createdCount++;
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  console.log('\n════════════════════════════════════════════════════');
  console.log('✅  SEED COMPLETE');
  console.log('════════════════════════════════════════════════════');
  console.log(`  Genres:      ${await (GenreModel as any).countDocuments()}`);
  console.log(`  Event Types: ${await (EventTypeModel as any).countDocuments()}`);
  console.log(`  Venue Types: ${await (VenueTypeModel as any).countDocuments()}`);
  console.log(`  Cities:      ${await (CityModel as any).countDocuments()}`);
  console.log(`  Vendors:     ${await (VendorModel as any).countDocuments({ is_deleted: false })}`);
  console.log(`  Events:      ${await (EventModel as any).countDocuments({ is_deleted: false })}  (${createdCount} new, ${skippedCount} updated)`);
  console.log('\n📌 Vendor → Event → Genre map:');
  for (const vendor of insertedVendors) {
    const vEvents = await (EventModel as any)
      .find({ venue_id: vendor._id, is_deleted: false })
      .select('title genre poster_url date').lean();
    console.log(`\n  🏢 ${vendor.name} (${vendor.city})`);
    console.log(`     portrait : ${vendor.portrait_url}`);
    console.log(`     covers   : ${vendor.landscape_urls?.length || 0} images`);
    for (const ev of vEvents) {
      const e = ev as any;
      console.log(`\n     🎵 ${e.title}  [${e.date}]`);
      console.log(`        genres : ${e.genre.join(', ')}`);
      console.log(`        poster : ${e.poster_url}`);
    }
  }

  await mongoose.disconnect();
  console.log('\n✅ Done. Disconnected from MongoDB.');
}

seed().catch(err => {
  console.error('❌ Seed failed:', err);
  mongoose.disconnect();
  process.exit(1);
});