import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './src/lib/db.ts';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import fs from 'fs';
import mongoose from 'mongoose';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-hii-app-key-2026';
const MONGO_URI = process.env.MONGO_URI || '';

// ─── MongoDB Models ───────────────────────────────────────────────────────────

const EventSchema = new mongoose.Schema(
  {
    vendor_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor', required: true },
    venue_name:   { type: String, required: true, trim: true },
    venue_image:  { type: String, required: true },
    category_ids: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    start_time:   { type: String, required: true },
    end_time:     { type: String, required: true },
    address:      { type: String, required: true },
    latitude:     { type: Number },
    longitude:    { type: Number },
    start_date:   { type: String, required: true },
    end_date:     { type: String, required: true },
    is_multi_day: { type: Boolean, default: false },
    about:        { type: String, required: true },
    gallery_images: [{ type: String }],
    artists: [{
      name:     { type: String, required: true },
      title:    { type: String },
      subtitle: { type: String },
      image:    { type: String },
    }],
    is_active:   { type: Boolean, default: true },
    is_deleted:  { type: Boolean, default: false },
    event_layout_images: [{ image_url: { type: String } }],
    terms_and_conditions: [{ item: { type: String } }],
    faqs: [{ question: { type: String }, answer: { type: String } }],
    prohibited_items: [{ item: { type: String } }],
  },
  { timestamps: true }
);
const EventModel: any = mongoose.models.Event || mongoose.model('Event', EventSchema);

const CategorySchema = new mongoose.Schema({
  category_name: { type: String },
  category_type: { type: Number }, // 1 = Event, 2 = Venue
  is_active:     { type: Boolean },
  is_deleted:    { type: Boolean },
});
const CategoryModel: any = mongoose.models.Category || mongoose.model('Category', CategorySchema);

const VendorSchema = new mongoose.Schema({
  name:       { type: String },
  email:      { type: String },
  is_active:  { type: Boolean },
  is_deleted: { type: Boolean },
});
const VendorModel: any = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);

const CitySchema = new mongoose.Schema(
  {
    city_name: { type: String, unique: true, trim: true },
    latitude:  { type: Number },
    longitude: { type: Number },
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true, collection: 'cities' }
);
const CityModel: any = mongoose.models.City || mongoose.model('City', CitySchema);

const FilterOptionSchema = new mongoose.Schema(
  {
    name: { type: String, unique: true, required: true, trim: true },
    status: { type: String, default: 'ACTIVE' },
    is_active: { type: Boolean, default: true },
    is_deleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const GenreModel: any = mongoose.models.Genre || mongoose.model('Genre', FilterOptionSchema, 'genres');
const EventTypeModel: any = mongoose.models.EventType || mongoose.model('EventType', FilterOptionSchema, 'event_types');
const VenueTypeModel: any = mongoose.models.VenueType || mongoose.model('VenueType', FilterOptionSchema, 'venue_types');

const requiredGenres = [
  'Bollywood',
  'EDM',
  'Commercial',
  'House',
  'Tech House',
  'Hip Hop',
  'R&B',
  'Techno',
  'Minimal Techno',
  'Trance',
  'Psychedelic music',
  'Afrobeats',
  'Reggaeton',
  'Deep House',
  'Progressive House',
  'Drum & Bass',
  'Rock Music',
  'Pop',
  'Acoustic',
];

const requiredEventTypes = [
  'DJ Night',
  'Festival',
  'Comedy',
  'Live Music',
  'Theme Party',
  'Karaoke Night',
  'Open Mic',
  'Concert',
  'Pool Party',
  'Sundowner',
  'Workshop',
];

const requiredVenueTypes = [
  'Bar/Pub',
  'Beach Club',
  'Lounge',
  'Nightclub',
  'Banquet Hall',
  'Restaurant',
  'Cafe',
  'Auditorium',
  'Stadium',
  'Resort',
  'Rooftop',
  'Open Air',
  'Hotel',
  'Garden/Lawn',
  'Cruise Ship/Boat',
];

const requiredCities = ['Mumbai', 'Delhi', 'Bangalore', 'Goa', 'Pune', 'Hyderabad'];

const mapMongoOption = (item: any) => ({
  id: item._id,
  name: item.name,
  status: item.status || (item.is_active && !item.is_deleted ? 'ACTIVE' : 'INACTIVE'),
  created_at: item.createdAt,
});

const mapMongoCity = (city: any) => ({
  id: city._id,
  name: city.city_name,
  latitude: city.latitude,
  longitude: city.longitude,
  status: city.is_active && !city.is_deleted ? 'ACTIVE' : 'INACTIVE',
  created_at: city.createdAt,
});

const seedMongoReferenceData = async () => {
  const syncFilterOptions = async (model: any, names: string[]) => {
    await Promise.all(names.map(name => model.updateOne(
      { name },
      { $setOnInsert: { name }, $set: { status: 'ACTIVE', is_active: true, is_deleted: false } },
      { upsert: true }
    )));
  };

  await Promise.all([
    syncFilterOptions(GenreModel, requiredGenres),
    syncFilterOptions(EventTypeModel, requiredEventTypes),
    syncFilterOptions(VenueTypeModel, requiredVenueTypes),
    Promise.all(requiredCities.map(cityName => CityModel.updateOne(
      { city_name: cityName },
      { $setOnInsert: { city_name: cityName }, $set: { is_active: true, is_deleted: false } },
      { upsert: true }
    ))),
  ]);
};

// ─── SQLite Seed ──────────────────────────────────────────────────────────────

const seedAdmin = () => {
  try {
    const emails = ['admin@hiiapp.com', 'club@admin', 'events@admin', 'normal@admin'];
    const names = ['Super Admin', 'Club Admin', 'Events Admin', 'Normal Admin'];
    const roles = ['SUPER_ADMIN', 'CLUB_ADMIN', 'EVENT_ADMIN', 'NORMAL_ADMIN'];
    const passwords = ['admin123', 'club123', 'events123', 'normal123'];
    const organisations = ['HiiApp', 'The Vault', 'Elite Event Solutions', 'HiiApp'];

    const salt = bcrypt.genSaltSync(10);
    emails.forEach((email, i) => {
      const adminExists = db.prepare('SELECT * FROM admins WHERE email = ?').get(email) as any;
      if (!adminExists) {
        const hash = bcrypt.hashSync(passwords[i], salt);
        db.prepare('INSERT INTO admins (id, name, email, password, role, organisation) VALUES (?, ?, ?, ?, ?, ?)').run(
          uuidv4(), names[i], email, hash, roles[i], organisations[i]
        );
      } else if (!adminExists.organisation) {
        db.prepare('UPDATE admins SET organisation = ? WHERE email = ?').run(organisations[i], email);
      }
    });

    const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    if (usersCount.count === 0) {
      for (let i = 1; i <= 20; i++) {
        db.prepare('INSERT INTO users (id, name, email, mobile, gender, level, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          uuidv4(), `User ${i}`, `user${i}@example.com`, `555-010${i}`,
          i % 2 === 0 ? 'Male' : 'Female', i % 5 === 0 ? 'GOLD' : 'BRONZE', 'ACTIVE'
        );
      }
    }

    const clubsCount = db.prepare('SELECT COUNT(*) as count FROM clubs').get() as any;
    if (clubsCount.count === 0) {
      const insertClub = db.prepare(`INSERT INTO clubs (id, name, city, address, contact_info, status) VALUES (?, ?, ?, ?, ?, ?)`);
      insertClub.run(uuidv4(), 'The Vault', 'Mumbai', '123 Colaba, Mumbai', 'contact@thevault.com', 'ACTIVE');
      insertClub.run(uuidv4(), 'Neon Lounge', 'Delhi', '45 Hauz Khas, Delhi', 'info@neonlounge.in', 'ACTIVE');
      insertClub.run(uuidv4(), 'Beach House', 'Goa', 'Baga Beach, Goa', 'hello@beachhouse.com', 'ACTIVE');
      insertClub.run(uuidv4(), 'Skyline Rooftop', 'Bangalore', '100 Ft Road, Indiranagar', 'bookings@skyline.in', 'ACTIVE');
      insertClub.run(uuidv4(), 'Underground Beats', 'Mumbai', 'Lower Parel, Mumbai', 'underground@beats.com', 'ACTIVE');
    }

    const adsCount = db.prepare('SELECT COUNT(*) as count FROM ads').get() as any;
    if (adsCount.count === 0) {
      const adminId = db.prepare('SELECT id FROM admins LIMIT 1').get() as any;
      if (adminId) {
        db.prepare('INSERT INTO ads (id, manager_id, title, amount, status) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), adminId.id, 'Summer Festival Promo', 5000, 'ACTIVE');
        db.prepare('INSERT INTO ads (id, manager_id, title, amount, status) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), adminId.id, 'VIP Membership Discount', 2500, 'ACTIVE');
        db.prepare('INSERT INTO ads (id, manager_id, title, amount, status) VALUES (?, ?, ?, ?, ?)').run(uuidv4(), adminId.id, 'New Year Bash Early Bird', 10000, 'PENDING');
      }
    }

    const pollsCount = db.prepare('SELECT COUNT(*) as count FROM polls').get() as any;
    if (pollsCount.count === 0) {
      db.prepare('INSERT INTO polls (id, title, city, options, end_date, status, votes) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        uuidv4(), 'Next DJ for Neon Lounge?', 'Delhi', JSON.stringify(['DJ Snake', 'Martin Garrix', 'David Guetta']),
        new Date(Date.now() + 86400000 * 5).toISOString(), 'ACTIVE', 150
      );
    }

    const contestsCount = db.prepare('SELECT COUNT(*) as count FROM contests').get() as any;
    if (contestsCount.count === 0) {
      db.prepare('INSERT INTO contests (id, title, city, rules, reward, deadline, status, participants) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        uuidv4(), 'Best Party Outfit', 'Mumbai', 'Upload a picture of your best party outfit.',
        'VIP Pass for 2', new Date(Date.now() + 86400000 * 10).toISOString(), 'ACTIVE', 45
      );
    }

    const complaintsCount = db.prepare('SELECT COUNT(*) as count FROM complaints').get() as any;
    if (complaintsCount.count === 0) {
      const userId = db.prepare('SELECT id FROM users LIMIT 1').get() as any;
      if (userId) {
        db.prepare('INSERT INTO complaints (id, user_id, username, subject, message, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          uuidv4(), userId.id, 'User 1', 'Payment Failed', 'My payment for the VIP pass failed.', 'HIGH', 'OPEN'
        );
      }
    }

    const requestsCount = db.prepare('SELECT COUNT(*) as count FROM requests').get() as any;
    if (requestsCount.count === 0) {
      const userId = db.prepare('SELECT id FROM users LIMIT 1').get() as any;
      if (userId) {
        db.prepare('INSERT INTO requests (id, user_id, username, subject, message, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          uuidv4(), userId.id, 'User 1', 'Feature Request', 'Please add a dark mode option.', 'LOW', 'OPEN'
        );
      }
    }

    const activityLogsCount = db.prepare('SELECT COUNT(*) as count FROM activity_logs').get() as any;
    if (activityLogsCount.count === 0) {
      const adminId = db.prepare('SELECT id FROM admins LIMIT 1').get() as any;
      if (adminId) {
        db.prepare('INSERT INTO activity_logs (id, admin_id, action, resource, details) VALUES (?, ?, ?, ?, ?)').run(
          uuidv4(), adminId.id, 'LOGIN', 'SYSTEM', 'Admin logged in successfully.'
        );
      }
    }
  } catch (err) {
    console.error('Database seeding error:', err);
  }
};

seedAdmin();

async function startServer() {
  // ─── Connect MongoDB ─────────────────────────────────────────────────────
  if (MONGO_URI) {
    try {
      await mongoose.connect(MONGO_URI);
      console.log('✅ MongoDB Connected (nightlifeDB)');
      await seedMongoReferenceData();
      console.log('✅ MongoDB reference filters synced');
    } catch (err) {
      console.error('❌ MongoDB connection failed:', err);
    }
  } else {
    console.warn('⚠️  MONGO_URI not set — event routes will not work');
  }

  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, 'uploads/'),
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });
  const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
  app.use('/uploads', express.static(uploadsDir));

  // ─── Middleware ───────────────────────────────────────────────────────────

  const authenticateToken = (req: any, res: any, next: any) => {
    const token = req.headers['authorization']?.split(' ')[1];
    if (!token) return res.sendStatus(401);
    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const authorizeRoles = (...roles: string[]) => (req: any, res: any, next: any) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: 'Access denied' });
    next();
  };

  const logActivity = (adminId: string, action: string, resource: string, details?: string) => {
    try {
      db.prepare('INSERT INTO activity_logs (id, admin_id, action, resource, details) VALUES (?, ?, ?, ?, ?)').run(
        uuidv4(), adminId, action, resource, details || null
      );
    } catch (err) {
      console.error('Activity logging error:', err);
    }
  };

  // ─── Upload ───────────────────────────────────────────────────────────────

  app.post('/api/upload', authenticateToken, upload.single('file'), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // ─── Auth ─────────────────────────────────────────────────────────────────

  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    try {
      const admin: any = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
      if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
      if (!bcrypt.compareSync(password, admin.password)) return res.status(401).json({ error: 'Invalid credentials' });
      const organisation = admin.organisation || 'HiiApp';
      const token = jwt.sign({ id: admin.id, role: admin.role, name: admin.name, organisation }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role, organisation } });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ─── Stats (events count from MongoDB) ───────────────────────────────────

  app.get('/api/stats', authenticateToken, async (req, res) => {
    try {
      const usersCount    = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
      const clubsCount    = db.prepare('SELECT COUNT(*) as count FROM clubs').get() as any;
      const complaintsCount = db.prepare('SELECT COUNT(*) as count FROM complaints WHERE status = "PENDING"').get() as any;
      const requestsCount = db.prepare('SELECT COUNT(*) as count FROM requests WHERE status = "PENDING"').get() as any;
      const adsCount      = db.prepare('SELECT COUNT(*) as count FROM ads').get() as any;

      const today = new Date().toISOString().split('T')[0];
      let totalEvents = 0, activeEvents = 0, pastEvents = 0;
      try {
        totalEvents  = await EventModel.countDocuments({ is_deleted: false });
        activeEvents = await EventModel.countDocuments({ is_deleted: false, is_active: true, end_date: { $gte: today } });
        pastEvents   = await EventModel.countDocuments({ is_deleted: false, end_date: { $lt: today } });
      } catch(mongoErr) {
        console.error('MongoDB stats error:', mongoErr);
      }

      res.json({
        totalUsers: usersCount.count,
        activeUsers: usersCount.count,
        totalEvents,
        activeEvents,
        pastEvents,
        totalClubs: clubsCount.count,
        pendingComplaints: complaintsCount.count,
        pendingRequests: requestsCount.count,
        totalAds: adsCount.count,
        totalReservations: 1284,
        revenue: 125400,
      });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ─── MongoDB: Categories & Vendors (for dropdowns) ───────────────────────

  app.get('/api/mongo/cities', authenticateToken, async (req, res) => {
    try {
      const cities = await CityModel.find({ is_deleted: false, is_active: true })
        .select('_id city_name latitude longitude').lean();
      // Return in same shape as SQLite cities so frontend works without changes
      const mapped = cities.map(mapMongoCity);
      res.json(mapped);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch cities' });
    }
  });

  app.get('/api/mongo/categories', authenticateToken, async (req, res) => {
    try {
      const categories = await CategoryModel.find({ is_deleted: false, is_active: true, category_type: 1 })
        .select('_id category_name').lean();
      res.json(categories);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });

  app.get('/api/mongo/vendors', authenticateToken, async (req, res) => {
    try {
      const vendors = await VendorModel.find({
        $and: [
          { $or: [{ is_deleted: false }, { is_deleted: { $exists: false } }] },
          { $or: [{ is_active: true }, { is_active: { $exists: false } }] },
        ],
      })
        .select('_id name email').lean();
      res.json(vendors);
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch vendors' });
    }
  });

  // ─── Events (MongoDB) ─────────────────────────────────────────────────────

  app.get('/api/events', authenticateToken, async (req, res) => {
    try {
      const events = await EventModel.find({ is_deleted: false })
        .populate('category_ids', 'category_name')
        .populate('vendor_id', 'name email')
        .sort({ createdAt: -1 })
        .lean();
      // Transform to match frontend field expectations
      const transformed = events.map((e: any) => ({
        ...e,
        id: e._id,
        title: e.venue_name,
        city: e.address || '',
        date_time: e.start_date + ' ' + e.start_time,
        poster_url: e.venue_image,
        synopsis: e.about,
        status: e.is_active ? 'UPCOMING' : 'INACTIVE',
      }));
      res.json(transformed);
    } catch (err) {
      console.error('Error fetching events:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/events/:id', authenticateToken, async (req, res) => {
    try {
      const event = await EventModel.findOne({ _id: req.params.id, is_deleted: false })
        .populate('category_ids', 'category_name')
        .populate('vendor_id', 'name email')
        .lean();
      if (!event) return res.status(404).json({ error: 'Event not found' });
      res.json(event);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.post('/api/events', authenticateToken, async (req: any, res) => {
    try {
      const {
        vendor_id, venue_name, venue_image, category_ids,
        start_time, end_time, address, latitude, longitude,
        start_date, end_date, is_multi_day, about,
        gallery_images, artists, event_layout_images,
        terms_and_conditions, faqs, prohibited_items,
      } = req.body;

      const event = await EventModel.create({
        vendor_id,
        venue_name,
        venue_image:  venue_image || 'default.png',
        category_ids: category_ids || [],
        start_time,
        end_time,
        address,
        latitude:     latitude  || 0,
        longitude:    longitude || 0,
        start_date,
        end_date,
        is_multi_day: is_multi_day || false,
        about,
        gallery_images:        gallery_images        || [],
        artists:               artists               || [],
        event_layout_images:   event_layout_images   || [],
        terms_and_conditions:  terms_and_conditions  || [],
        faqs:                  faqs                  || [],
        prohibited_items:      prohibited_items      || [],
        is_active:  true,
        is_deleted: false,
      });

      logActivity(req.user.id, 'CREATE', `EVENT: ${venue_name}`);
      res.status(201).json(event);
    } catch (err) {
      console.error('Error creating event:', err);
      res.status(500).json({ error: 'Internal server error', details: String(err) });
    }
  });

  app.put('/api/events/:id', authenticateToken, async (req: any, res) => {
    try {
      const event = await EventModel.findOneAndUpdate(
        { _id: req.params.id, is_deleted: false },
        { ...req.body, updatedAt: new Date() },
        { new: true }
      );
      if (!event) return res.status(404).json({ error: 'Event not found' });
      logActivity(req.user.id, 'UPDATE', `EVENT: ${event.venue_name}`);
      res.json(event);
    } catch (err) {
      console.error('Error updating event:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.delete('/api/events/:id', authenticateToken, async (req: any, res) => {
    try {
      const event = await EventModel.findOneAndUpdate(
        { _id: req.params.id },
        { is_deleted: true, is_active: false },
        { new: true }
      );
      if (!event) return res.status(404).json({ error: 'Event not found' });
      logActivity(req.user.id, 'DELETE', `EVENT: ${event.venue_name}`);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ─── Users (SQLite) ───────────────────────────────────────────────────────

  app.get('/api/users', authenticateToken, (req, res) => {
    const users = db.prepare('SELECT id, name, email, mobile, gender, level, status, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  });

  app.get('/api/users/:id', authenticateToken, (req, res) => {
    const user = db.prepare('SELECT id, name, email, mobile, gender, level, status, created_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });

  // ─── Cities / Genres / EventTypes / VenueTypes (MongoDB Atlas) ───────────

  const getMongoOptions = async (model: any, res: any, errorMessage: string) => {
    try {
      const items = await model.find({ is_deleted: false, is_active: true, status: 'ACTIVE' })
        .sort({ name: 1 })
        .lean();
      res.json(items.map(mapMongoOption));
    } catch (err) {
      res.status(500).json({ error: errorMessage });
    }
  };

  const addMongoOption = async (model: any, req: any, res: any, errorMessage: string) => {
    try {
      const name = String(req.body.name || '').trim();
      if (!name) return res.status(400).json({ error: 'Name is required' });

      const item = await model.findOneAndUpdate(
        { name },
        { $set: { name, status: 'ACTIVE', is_active: true, is_deleted: false } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      res.status(201).json(mapMongoOption(item));
    } catch (err) {
      res.status(500).json({ error: errorMessage });
    }
  };

  const deleteMongoOption = async (model: any, req: any, res: any, errorMessage: string) => {
    try {
      await model.findByIdAndUpdate(req.params.id, {
        status: 'INACTIVE',
        is_active: false,
        is_deleted: true,
      });
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: errorMessage });
    }
  };

  app.get('/api/cities', authenticateToken, async (req, res) => {
    try {
      const cities = await CityModel.find({ is_deleted: false, is_active: true })
        .sort({ city_name: 1 })
        .lean();
      res.json(cities.map(mapMongoCity));
    } catch {
      res.status(500).json({ error: 'Failed to fetch cities' });
    }
  });
  app.post('/api/cities', authenticateToken, async (req, res) => {
    try {
      const cityName = String(req.body.name || '').trim();
      if (!cityName) return res.status(400).json({ error: 'Name is required' });

      const city = await CityModel.findOneAndUpdate(
        { city_name: cityName },
        { $set: { city_name: cityName, is_active: true, is_deleted: false } },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      ).lean();

      res.status(201).json(mapMongoCity(city));
    } catch {
      res.status(500).json({ error: 'Failed to add city' });
    }
  });
  app.delete('/api/cities/:id', authenticateToken, async (req, res) => {
    try {
      await CityModel.findByIdAndUpdate(req.params.id, { is_active: false, is_deleted: true });
      res.json({ success: true });
    } catch {
      res.status(500).json({ error: 'Failed to delete city' });
    }
  });

  app.get('/api/genres', authenticateToken, async (req, res) => {
    await getMongoOptions(GenreModel, res, 'Failed to fetch genres');
  });
  app.post('/api/genres', authenticateToken, async (req, res) => {
    await addMongoOption(GenreModel, req, res, 'Failed to add genre');
  });
  app.delete('/api/genres/:id', authenticateToken, async (req, res) => {
    await deleteMongoOption(GenreModel, req, res, 'Failed to delete genre');
  });

  app.get('/api/eventTypes', authenticateToken, async (req, res) => {
    await getMongoOptions(EventTypeModel, res, 'Failed to fetch event types');
  });
  app.post('/api/eventTypes', authenticateToken, async (req, res) => {
    await addMongoOption(EventTypeModel, req, res, 'Failed to add event type');
  });
  app.delete('/api/eventTypes/:id', authenticateToken, async (req, res) => {
    await deleteMongoOption(EventTypeModel, req, res, 'Failed to delete event type');
  });

  app.get('/api/venueTypes', authenticateToken, async (req, res) => {
    await getMongoOptions(VenueTypeModel, res, 'Failed to fetch venue types');
  });
  app.post('/api/venueTypes', authenticateToken, async (req, res) => {
    await addMongoOption(VenueTypeModel, req, res, 'Failed to add venue type');
  });
  app.delete('/api/venueTypes/:id', authenticateToken, async (req, res) => {
    await deleteMongoOption(VenueTypeModel, req, res, 'Failed to delete venue type');
  });

  // ─── Clubs (SQLite) ───────────────────────────────────────────────────────

  app.get('/api/clubs', authenticateToken, (req, res) => {
    res.json(db.prepare('SELECT id, name, city as location, city, address, contact_info, media, status, created_at FROM clubs ORDER BY created_at DESC').all());
  });
  app.post('/api/clubs', authenticateToken, (req: any, res) => {
    const id = uuidv4();
    const { name, city, address, contact_info } = req.body;
    try {
      db.prepare('INSERT INTO clubs (id, name, city, address, contact_info) VALUES (?, ?, ?, ?, ?)').run(id, name, city, address, contact_info);
      logActivity(req.user.id, 'CREATE', `CLUB: ${name}`);
      res.status(201).json({ id, ...req.body });
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  // ─── Ads (SQLite) ─────────────────────────────────────────────────────────

  app.get('/api/ads', authenticateToken, (req, res) => {
    res.json(db.prepare('SELECT * FROM ads ORDER BY created_at DESC').all());
  });
  app.post('/api/ads', authenticateToken, (req: any, res) => {
    const id = uuidv4();
    const { title, amount } = req.body;
    try {
      db.prepare('INSERT INTO ads (id, manager_id, title, amount) VALUES (?, ?, ?, ?)').run(id, req.user.id, title, amount);
      logActivity(req.user.id, 'CREATE', `AD: ${title}`);
      res.status(201).json({ id, ...req.body });
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  // ─── Broadcasts (SQLite) ──────────────────────────────────────────────────

  app.post('/api/broadcasts', authenticateToken, (req: any, res) => {
    const id = uuidv4();
    const { type, message, audience } = req.body;
    try {
      db.prepare('INSERT INTO broadcasts (id, type, message, audience) VALUES (?, ?, ?, ?)').run(id, type, message, JSON.stringify(audience));
      logActivity(req.user.id, 'SEND', `BROADCAST: ${type}`);
      res.status(201).json({ id, ...req.body });
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  // ─── Polls (SQLite) ───────────────────────────────────────────────────────

  app.get('/api/polls', authenticateToken, (req, res) => {
    res.json(db.prepare('SELECT * FROM polls ORDER BY created_at DESC').all());
  });
  app.post('/api/polls', authenticateToken, (req: any, res) => {
    const id = uuidv4();
    const { title, city, options, endDate } = req.body;
    try {
      db.prepare('INSERT INTO polls (id, title, city, options, end_date, status, votes) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        id, title, city, JSON.stringify(options), endDate, 'PENDING', 0
      );
      logActivity(req.user.id, 'CREATE', `POLL: ${title}`);
      res.status(201).json({ id, ...req.body });
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });
  app.patch('/api/polls/:id/status', authenticateToken, (req: any, res) => {
    const { status } = req.body;
    try {
      db.prepare('UPDATE polls SET status = ? WHERE id = ?').run(status, req.params.id);
      logActivity(req.user.id, 'UPDATE', `POLL STATUS: ${req.params.id} -> ${status}`);
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  // ─── Contests (SQLite) ────────────────────────────────────────────────────

  app.get('/api/contests', authenticateToken, (req, res) => {
    res.json(db.prepare('SELECT * FROM contests ORDER BY created_at DESC').all());
  });
  app.post('/api/contests', authenticateToken, (req: any, res) => {
    const id = uuidv4();
    const { title, city, rules, reward, deadline } = req.body;
    try {
      db.prepare('INSERT INTO contests (id, title, city, rules, reward, deadline, status, participants) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        id, title, city, rules, reward, deadline, 'PENDING', 0
      );
      logActivity(req.user.id, 'CREATE', `CONTEST: ${title}`);
      res.status(201).json({ id, ...req.body });
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });
  app.patch('/api/contests/:id/status', authenticateToken, (req: any, res) => {
    const { status } = req.body;
    try {
      db.prepare('UPDATE contests SET status = ? WHERE id = ?').run(status, req.params.id);
      logActivity(req.user.id, 'UPDATE', `CONTEST STATUS: ${req.params.id} -> ${status}`);
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });
  app.get('/api/contests/:id/participants', authenticateToken, (req, res) => {
    try {
      res.json(db.prepare(`
        SELECT cp.*, u.name, u.email, u.mobile FROM contest_participants cp
        JOIN users u ON cp.user_id = u.id WHERE cp.contest_id = ? ORDER BY cp.created_at DESC
      `).all(req.params.id));
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  // ─── Complaints (SQLite) ──────────────────────────────────────────────────

  app.get('/api/complaints', authenticateToken, (req, res) => {
    res.json(db.prepare('SELECT * FROM complaints ORDER BY created_at DESC').all());
  });
  app.patch('/api/complaints/:id', authenticateToken, (req: any, res) => {
    const { status } = req.body;
    try {
      db.prepare('UPDATE complaints SET status = ? WHERE id = ?').run(status, req.params.id);
      logActivity(req.user.id, 'UPDATE', `COMPLAINT: ${req.params.id} to ${status}`);
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  // ─── Requests (SQLite) ────────────────────────────────────────────────────

  app.get('/api/requests', authenticateToken, (req, res) => {
    res.json(db.prepare('SELECT * FROM requests ORDER BY created_at DESC').all());
  });
  app.patch('/api/requests/:id', authenticateToken, (req: any, res) => {
    const { status } = req.body;
    try {
      db.prepare('UPDATE requests SET status = ? WHERE id = ?').run(status, req.params.id);
      logActivity(req.user.id, 'UPDATE', `REQUEST: ${req.params.id} to ${status}`);
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  // ─── Activity Logs (SQLite) ───────────────────────────────────────────────

  app.get('/api/activity-logs', authenticateToken, (req, res) => {
    try {
      res.json(db.prepare(`
        SELECT l.*, a.name as admin_name FROM activity_logs l
        JOIN admins a ON l.admin_id = a.id ORDER BY l.created_at DESC
      `).all());
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  // ─── Admins (SQLite) ──────────────────────────────────────────────────────

  app.get('/api/admins', authenticateToken, authorizeRoles('SUPER_ADMIN'), (req, res) => {
    res.json(db.prepare('SELECT id, name, email, role, status, created_at FROM admins').all());
  });
  app.post('/api/admins', authenticateToken, authorizeRoles('SUPER_ADMIN'), (req: any, res) => {
    const id = uuidv4();
    const { name, email, password, role } = req.body;
    try {
      const hash = bcrypt.hashSync(password, bcrypt.genSaltSync(10));
      db.prepare('INSERT INTO admins (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(id, name, email, hash, role);
      logActivity(req.user.id, 'CREATE', `ADMIN: ${name}`);
      res.status(201).json({ id, name, email, role });
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  // ─── Search ───────────────────────────────────────────────────────────────

  app.get('/api/search', authenticateToken, async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    const query = `%${q}%`;
    try {
      const users  = db.prepare('SELECT id, name as title, "User" as type, "/users" as link FROM users WHERE name LIKE ? LIMIT 3').all(query);
      const clubs  = db.prepare('SELECT id, name as title, "Club" as type, "/clubs" as link FROM clubs WHERE name LIKE ? LIMIT 3').all(query);
      const events = await EventModel.find({
        is_deleted: false,
        venue_name: { $regex: q as string, $options: 'i' }
      }).select('_id venue_name').limit(3).lean();
      const eventResults = events.map((e: any) => ({ id: e._id, title: e.venue_name, type: 'Event', link: '/events' }));
      res.json([...users, ...eventResults, ...clubs]);
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  // ─── Vite ─────────────────────────────────────────────────────────────────

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'build');
    app.use(express.static(distPath));
    app.get('*', (req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`Server running on http://localhost:${PORT}`));
}

startServer();
