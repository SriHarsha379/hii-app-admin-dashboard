import 'dotenv/config';
import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import fs from 'fs';
import { connectDB } from './src/lib/db.ts';
import {
  Admin, User, Club, Event, Ad, Broadcast,
  Poll, Contest, ContestParticipant,
  Complaint, Request, ActivityLog,
  City, Genre, EventType, VenueType,
} from './src/lib/models.ts';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-hii-app-key-2026';

// ─── Seed initial data ────────────────────────────────────────────────────────

async function seedData() {
  try {
    // Admins
    const adminDefs = [
      { email: 'admin@hiiapp.com', name: 'Super Admin', role: 'SUPER_ADMIN', password: 'admin123' },
      { email: 'club@admin', name: 'Club Admin', role: 'CLUB_ADMIN', password: 'club123' },
      { email: 'events@admin', name: 'Events Admin', role: 'EVENT_ADMIN', password: 'events123' },
      { email: 'normal@admin', name: 'Normal Admin', role: 'NORMAL_ADMIN', password: 'normal123' },
    ];
    for (const def of adminDefs) {
      const exists = await Admin.findOne({ email: def.email });
      if (!exists) {
        const hash = bcrypt.hashSync(def.password, 10);
        await Admin.create({ name: def.name, email: def.email, password: hash, role: def.role });
      }
    }

    // Cities
    if ((await City.countDocuments()) === 0) {
      await City.insertMany(
        ['Mumbai', 'Delhi', 'Bangalore', 'Goa', 'Pune', 'Hyderabad'].map(name => ({ name }))
      );
    }

    // Genres
    if ((await Genre.countDocuments()) === 0) {
      await Genre.insertMany(
        ['Techno', 'Bollywood', 'Hip Hop', 'Commercial', 'Trance', 'House'].map(name => ({ name }))
      );
    }

    // Event Types
    if ((await EventType.countDocuments()) === 0) {
      await EventType.insertMany(
        ['Live Music', 'DJ Set', 'Comedy', 'Festival', 'Networking'].map(name => ({ name }))
      );
    }

    // Venue Types
    if ((await VenueType.countDocuments()) === 0) {
      await VenueType.insertMany(
        ['Nightclub', 'Lounge', 'Beach Club', 'Bar', 'Pub'].map(name => ({ name }))
      );
    }

    // Demo users
    if ((await User.countDocuments()) === 0) {
      const users = [];
      for (let i = 1; i <= 20; i++) {
        users.push({
          name: `User ${i}`,
          email: `user${i}@example.com`,
          mobile: `555-010${i}`,
          gender: i % 2 === 0 ? 'Male' : 'Female',
          level: i % 5 === 0 ? 'GOLD' : 'BRONZE',
          status: 'ACTIVE',
        });
      }
      await User.insertMany(users);
    }

    // Demo clubs + events
    if ((await Club.countDocuments()) === 0) {
      const clubs = await Club.insertMany([
        { name: 'The Vault', city: 'Mumbai', address: '123 Colaba, Mumbai', contactInfo: 'contact@thevault.com' },
        { name: 'Neon Lounge', city: 'Delhi', address: '45 Hauz Khas, Delhi', contactInfo: 'info@neonlounge.in' },
        { name: 'Beach House', city: 'Goa', address: 'Baga Beach, Goa', contactInfo: 'hello@beachhouse.com' },
        { name: 'Skyline Rooftop', city: 'Bangalore', address: '100 Ft Road, Indiranagar', contactInfo: 'bookings@skyline.in' },
        { name: 'Underground Beats', city: 'Mumbai', address: 'Lower Parel, Mumbai', contactInfo: 'underground@beats.com' },
      ]);

      if ((await Event.countDocuments()) === 0) {
        await Event.insertMany([
          {
            title: 'Techno Valley Vol. 1', venueId: clubs[0]._id.toString(),
            dateTime: new Date(Date.now() + 86400000 * 2), city: 'Mumbai',
            posterUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
            landscapeUrl: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&q=80',
            synopsis: 'A night of deep techno and immersive visuals.', musicGenre: 'Techno', crowdType: 'Mixed',
          },
          {
            title: 'Bollywood Night', venueId: clubs[1]._id.toString(),
            dateTime: new Date(Date.now() + 86400000 * 5), city: 'Delhi',
            posterUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&q=80',
            landscapeUrl: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=1600&q=80',
            synopsis: 'Dance to the latest Bollywood hits with DJ Raj.', musicGenre: 'Bollywood', crowdType: 'Couples/Groups',
          },
          {
            title: 'Sunset Sundowner', venueId: clubs[2]._id.toString(),
            dateTime: new Date(Date.now() + 86400000 * 7), city: 'Goa',
            posterUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
            landscapeUrl: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&q=80',
            synopsis: 'Chill vibes by the beach with live acoustic music.', musicGenre: 'Acoustic/House', crowdType: 'Everyone',
          },
          {
            title: 'Indie Rock Fest', venueId: clubs[3]._id.toString(),
            dateTime: new Date(Date.now() + 86400000 * 10), city: 'Bangalore',
            posterUrl: 'https://images.unsplash.com/photo-1501281668745-f7f5792203b4?w=800&q=80',
            landscapeUrl: 'https://images.unsplash.com/photo-1501281668745-f7f5792203b4?w=1600&q=80',
            synopsis: 'Local indie bands taking over the stage.', musicGenre: 'Indie Rock', crowdType: 'College/Young Adults',
          },
          {
            title: 'Midnight Jazz', venueId: clubs[4]._id.toString(),
            dateTime: new Date(Date.now() + 86400000 * 14), city: 'Mumbai',
            posterUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80',
            landscapeUrl: 'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1600&q=80',
            synopsis: 'Smooth jazz and cocktails.', musicGenre: 'Jazz', crowdType: 'Couples/Mature',
          },
        ]);
      }
    }

    // Demo ads
    if ((await Ad.countDocuments()) === 0) {
      const admin = await Admin.findOne();
      if (admin) {
        await Ad.insertMany([
          { managerId: admin._id.toString(), title: 'Summer Festival Promo', amount: 5000, status: 'ACTIVE' },
          { managerId: admin._id.toString(), title: 'VIP Membership Discount', amount: 2500, status: 'ACTIVE' },
          { managerId: admin._id.toString(), title: 'New Year Bash Early Bird', amount: 10000, status: 'PENDING' },
        ]);
      }
    }

    // Demo polls
    if ((await Poll.countDocuments()) === 0) {
      await Poll.insertMany([
        {
          title: 'Next DJ for Neon Lounge?', city: 'Delhi',
          options: ['DJ Snake', 'Martin Garrix', 'David Guetta'],
          endDate: new Date(Date.now() + 86400000 * 5), status: 'ACTIVE', votes: 150,
        },
        {
          title: 'Favorite Music Genre?', city: 'Mumbai',
          options: ['Techno', 'Bollywood', 'Hip Hop', 'Jazz'],
          endDate: new Date(Date.now() + 86400000 * 2), status: 'ACTIVE', votes: 320,
        },
      ]);
    }

    // Demo contests
    if ((await Contest.countDocuments()) === 0) {
      await Contest.insertMany([
        {
          title: 'Best Party Outfit', city: 'Mumbai',
          rules: 'Upload a picture of your best party outfit.',
          reward: 'VIP Pass for 2', deadline: new Date(Date.now() + 86400000 * 10),
          status: 'ACTIVE', participants: 45,
        },
        {
          title: 'Guess the Track', city: 'Delhi',
          rules: 'Guess the track played in the video clip.',
          reward: 'Free Drinks Voucher', deadline: new Date(Date.now() + 86400000 * 3),
          status: 'ACTIVE', participants: 120,
        },
      ]);
    }

    // Demo complaints & requests
    if ((await Complaint.countDocuments()) === 0) {
      const user = await User.findOne();
      if (user) {
        await Complaint.insertMany([
          { userId: user._id.toString(), username: user.name, subject: 'Payment Failed', message: 'My payment for the VIP pass failed but money was deducted.', priority: 'HIGH', status: 'OPEN' },
          { userId: user._id.toString(), username: user.name, subject: 'App Crash', message: 'The app crashes when I try to open the events page.', priority: 'MEDIUM', status: 'OPEN' },
        ]);
      }
    }

    if ((await Request.countDocuments()) === 0) {
      const user = await User.findOne();
      if (user) {
        await Request.insertMany([
          { userId: user._id.toString(), username: user.name, subject: 'Feature Request', message: 'Please add a dark mode option.', priority: 'LOW', status: 'OPEN' },
          { userId: user._id.toString(), username: user.name, subject: 'Account Deletion', message: 'I want to delete my account.', priority: 'HIGH', status: 'OPEN' },
        ]);
      }
    }

    // Demo activity logs
    if ((await ActivityLog.countDocuments()) === 0) {
      const admin = await Admin.findOne();
      if (admin) {
        await ActivityLog.insertMany([
          { adminId: admin._id.toString(), action: 'LOGIN', resource: 'SYSTEM', details: 'Admin logged in successfully.' },
          { adminId: admin._id.toString(), action: 'CREATE', resource: 'EVENT', details: 'Created event: Techno Valley Vol. 1' },
          { adminId: admin._id.toString(), action: 'UPDATE', resource: 'CLUB', details: 'Updated details for club: The Vault' },
        ]);
      }
    }

    console.log('Seed check complete.');
  } catch (err) {
    console.error('Seeding error:', err);
  }
}

// ─── Format helpers ───────────────────────────────────────────────────────────

function fmtDoc(doc: any) {
  if (!doc) return doc;
  const obj = doc.toObject ? doc.toObject() : { ...doc };
  obj.id = obj._id?.toString();
  delete obj._id;
  delete obj.__v;
  return obj;
}

function fmtDocs(docs: any[]) {
  return docs.map(fmtDoc);
}

// ─── Server ───────────────────────────────────────────────────────────────────

async function startServer() {
  await connectDB();
  await seedData();

  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json({ limit: '50mb' }));

  // Uploads
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

  const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, 'uploads/'),
    filename: (_req, file, cb) => {
      const suffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      cb(null, suffix + path.extname(file.originalname));
    },
  });
  const upload = multer({ storage, limits: { fileSize: 5 * 1024 * 1024 } });
  app.use('/uploads', express.static(uploadsDir));

  // ─── Middleware ─────────────────────────────────────────────────────────────

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

  const logActivity = async (adminId: string, action: string, resource: string, details?: string) => {
    try {
      await ActivityLog.create({ adminId, action, resource, details: details || null });
    } catch (err) {
      console.error('Activity logging error:', err);
    }
  };

  // ─── Routes ─────────────────────────────────────────────────────────────────

  // Upload
  app.post('/api/upload', authenticateToken, upload.single('file'), (req: any, res) => {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ url: `/uploads/${req.file.filename}` });
  });

  // Auth – login
  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const admin: any = await Admin.findOne({ email });
      if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
      if (!bcrypt.compareSync(password, admin.password))
        return res.status(401).json({ error: 'Invalid credentials' });
      const token = jwt.sign(
        { id: admin._id.toString(), role: admin.role, name: admin.name },
        JWT_SECRET, { expiresIn: '24h' }
      );
      res.json({ token, user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role, organisation: admin.organisation } });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Stats
  app.get('/api/stats', authenticateToken, async (_req, res) => {
    try {
      const [
        usersCount, eventsCount, activeEventsCount, pastEventsCount,
        clubsCount, complaintsCount, requestsCount, adsCount,
      ] = await Promise.all([
        User.countDocuments(),
        Event.countDocuments(),
        Event.countDocuments({ status: { $in: ['LIVE', 'UPCOMING'] } }),
        Event.countDocuments({ status: 'COMPLETED' }),
        Club.countDocuments(),
        Complaint.countDocuments({ status: 'PENDING' }),
        Request.countDocuments({ status: 'PENDING' }),
        Ad.countDocuments(),
      ]);
      res.json({
        totalUsers: usersCount,
        activeUsers: usersCount,
        totalEvents: eventsCount,
        activeEvents: activeEventsCount,
        pastEvents: pastEventsCount,
        totalClubs: clubsCount,
        pendingComplaints: complaintsCount,
        pendingRequests: requestsCount,
        totalAds: adsCount,
        totalReservations: 1284,
        revenue: 125400,
      });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Users
  app.get('/api/users', authenticateToken, async (_req, res) => {
    const users = await User.find().sort({ createdAt: -1 });
    res.json(fmtDocs(users));
  });

  app.get('/api/users/:id', authenticateToken, async (req, res) => {
    const user = await User.findById(req.params.id).catch(() => null);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(fmtDoc(user));
  });

  // Cities
  app.get('/api/cities', authenticateToken, async (_req, res) => {
    try {
      const cities = await City.find({ status: 'ACTIVE' }).sort({ name: 1 });
      res.json(fmtDocs(cities));
    } catch { res.status(500).json({ error: 'Failed to fetch cities' }); }
  });

  app.post('/api/cities', authenticateToken, async (req, res) => {
    try {
      const city = await City.create({ name: req.body.name });
      res.status(201).json(fmtDoc(city));
    } catch { res.status(500).json({ error: 'Failed to add city' }); }
  });

  app.delete('/api/cities/:id', authenticateToken, async (req, res) => {
    try {
      await City.findByIdAndUpdate(req.params.id, { status: 'INACTIVE' });
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Failed to delete city' }); }
  });

  // Genres
  app.get('/api/genres', authenticateToken, async (_req, res) => {
    try {
      const genres = await Genre.find({ status: 'ACTIVE' }).sort({ name: 1 });
      res.json(fmtDocs(genres));
    } catch { res.status(500).json({ error: 'Failed to fetch genres' }); }
  });

  app.post('/api/genres', authenticateToken, async (req, res) => {
    try {
      const genre = await Genre.create({ name: req.body.name });
      res.status(201).json(fmtDoc(genre));
    } catch { res.status(500).json({ error: 'Failed to add genre' }); }
  });

  app.delete('/api/genres/:id', authenticateToken, async (req, res) => {
    try {
      await Genre.findByIdAndUpdate(req.params.id, { status: 'INACTIVE' });
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Failed to delete genre' }); }
  });

  // Event Types
  app.get('/api/eventTypes', authenticateToken, async (_req, res) => {
    try {
      const types = await EventType.find({ status: 'ACTIVE' }).sort({ name: 1 });
      res.json(fmtDocs(types));
    } catch { res.status(500).json({ error: 'Failed to fetch event types' }); }
  });

  app.post('/api/eventTypes', authenticateToken, async (req, res) => {
    try {
      const type = await EventType.create({ name: req.body.name });
      res.status(201).json(fmtDoc(type));
    } catch { res.status(500).json({ error: 'Failed to add event type' }); }
  });

  app.delete('/api/eventTypes/:id', authenticateToken, async (req, res) => {
    try {
      await EventType.findByIdAndUpdate(req.params.id, { status: 'INACTIVE' });
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Failed to delete event type' }); }
  });

  // Venue Types
  app.get('/api/venueTypes', authenticateToken, async (_req, res) => {
    try {
      const types = await VenueType.find({ status: 'ACTIVE' }).sort({ name: 1 });
      res.json(fmtDocs(types));
    } catch { res.status(500).json({ error: 'Failed to fetch venue types' }); }
  });

  app.post('/api/venueTypes', authenticateToken, async (req, res) => {
    try {
      const type = await VenueType.create({ name: req.body.name });
      res.status(201).json(fmtDoc(type));
    } catch { res.status(500).json({ error: 'Failed to add venue type' }); }
  });

  app.delete('/api/venueTypes/:id', authenticateToken, async (req, res) => {
    try {
      await VenueType.findByIdAndUpdate(req.params.id, { status: 'INACTIVE' });
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Failed to delete venue type' }); }
  });

  // Events
  app.get('/api/events', authenticateToken, async (_req, res) => {
    const events = await Event.find().sort({ dateTime: -1 });
    const clubIds = [...new Set(events.map(e => e.venueId).filter(Boolean))];
    const clubs = await Club.find({ _id: { $in: clubIds } });
    const clubMap: Record<string, string> = {};
    clubs.forEach(c => { clubMap[c._id.toString()] = c.name; });
    res.json(fmtDocs(events).map((e: any) => ({
      ...e,
      venue: e.venueId ? clubMap[e.venueId] || null : null,
    })));
  });

  app.post('/api/events', authenticateToken, async (req: any, res) => {
    const { title, venue_id, date_time, city, synopsis, email, phone,
      ticket_link, music_genre, crowd_type, poster_url, landscape_url, media_gallery } = req.body;
    try {
      const event = await Event.create({
        title, venueId: venue_id, dateTime: date_time, city, synopsis,
        email, phone, ticketLink: ticket_link, musicGenre: music_genre,
        crowdType: crowd_type, posterUrl: poster_url, landscapeUrl: landscape_url,
        mediaGallery: Array.isArray(media_gallery) ? media_gallery : [],
      });
      await logActivity(req.user.id, 'CREATE', `EVENT: ${title}`);
      res.status(201).json(fmtDoc(event));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/events/:id', authenticateToken, async (req: any, res) => {
    const { title, venue_id, date_time, city, synopsis, email, phone,
      ticket_link, music_genre, crowd_type, poster_url, landscape_url,
      media_gallery, hide_end_time, advertise, status } = req.body;
    try {
      const event = await Event.findByIdAndUpdate(
        req.params.id,
        {
          title, venueId: venue_id, dateTime: date_time, city, synopsis,
          email, phone, ticketLink: ticket_link, musicGenre: music_genre,
          crowdType: crowd_type, posterUrl: poster_url, landscapeUrl: landscape_url,
          mediaGallery: Array.isArray(media_gallery) ? media_gallery : [],
          hideEndTime: !!hide_end_time, advertise: !!advertise,
          status: status || 'UPCOMING',
        },
        { new: true }
      );
      await logActivity(req.user.id, 'UPDATE', `EVENT: ${title}`);
      res.json(fmtDoc(event));
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Clubs
  app.get('/api/clubs', authenticateToken, async (_req, res) => {
    const clubs = await Club.find().sort({ createdAt: -1 });
    res.json(fmtDocs(clubs).map((c: any) => ({ ...c, location: c.city, contact_info: c.contactInfo })));
  });

  app.post('/api/clubs', authenticateToken, async (req: any, res) => {
    const { name, city, address, contact_info } = req.body;
    try {
      const club = await Club.create({ name, city, address, contactInfo: contact_info });
      await logActivity(req.user.id, 'CREATE', `CLUB: ${name}`);
      res.status(201).json(fmtDoc(club));
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Ads
  app.get('/api/ads', authenticateToken, async (_req, res) => {
    const ads = await Ad.find().sort({ createdAt: -1 });
    res.json(fmtDocs(ads));
  });

  app.post('/api/ads', authenticateToken, async (req: any, res) => {
    const { title, amount } = req.body;
    try {
      const ad = await Ad.create({ managerId: req.user.id, title, amount });
      await logActivity(req.user.id, 'CREATE', `AD: ${title}`);
      res.status(201).json(fmtDoc(ad));
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Broadcasts
  app.post('/api/broadcasts', authenticateToken, async (req: any, res) => {
    const { type, message, audience } = req.body;
    try {
      const broadcast = await Broadcast.create({ type, message, audience });
      await logActivity(req.user.id, 'SEND', `BROADCAST: ${type}`);
      res.status(201).json(fmtDoc(broadcast));
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Polls
  app.get('/api/polls', authenticateToken, async (_req, res) => {
    const polls = await Poll.find().sort({ createdAt: -1 });
    res.json(fmtDocs(polls));
  });

  app.post('/api/polls', authenticateToken, async (req: any, res) => {
    const { title, city, options, endDate } = req.body;
    try {
      const poll = await Poll.create({ title, city, options, endDate, status: 'PENDING', votes: 0 });
      await logActivity(req.user.id, 'CREATE', `POLL: ${title}`);
      res.status(201).json(fmtDoc(poll));
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch('/api/polls/:id/status', authenticateToken, async (req: any, res) => {
    const { status } = req.body;
    try {
      await Poll.findByIdAndUpdate(req.params.id, { status });
      await logActivity(req.user.id, 'UPDATE', `POLL STATUS: ${req.params.id} -> ${status}`);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Contests
  app.get('/api/contests', authenticateToken, async (_req, res) => {
    const contests = await Contest.find().sort({ createdAt: -1 });
    res.json(fmtDocs(contests));
  });

  app.post('/api/contests', authenticateToken, async (req: any, res) => {
    const { title, city, rules, reward, deadline } = req.body;
    try {
      const contest = await Contest.create({ title, city, rules, reward, deadline, status: 'PENDING', participants: 0 });
      await logActivity(req.user.id, 'CREATE', `CONTEST: ${title}`);
      res.status(201).json(fmtDoc(contest));
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch('/api/contests/:id/status', authenticateToken, async (req: any, res) => {
    const { status } = req.body;
    try {
      await Contest.findByIdAndUpdate(req.params.id, { status });
      await logActivity(req.user.id, 'UPDATE', `CONTEST STATUS: ${req.params.id} -> ${status}`);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/contests/:id/participants', authenticateToken, async (req, res) => {
    try {
      const participants = await ContestParticipant.find({ contestId: req.params.id }).sort({ createdAt: -1 });
      const userIds = participants.map(p => p.userId);
      const users = await User.find({ _id: { $in: userIds } });
      const userMap: Record<string, any> = {};
      users.forEach(u => { userMap[u._id.toString()] = u; });
      res.json(fmtDocs(participants).map((p: any) => {
        const u = userMap[p.userId];
        return { ...p, name: u?.name, email: u?.email, mobile: u?.mobile };
      }));
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Complaints
  app.get('/api/complaints', authenticateToken, async (_req, res) => {
    const complaints = await Complaint.find().sort({ createdAt: -1 });
    res.json(fmtDocs(complaints));
  });

  app.patch('/api/complaints/:id', authenticateToken, async (req: any, res) => {
    const { status } = req.body;
    try {
      await Complaint.findByIdAndUpdate(req.params.id, { status });
      await logActivity(req.user.id, 'UPDATE', `COMPLAINT: ${req.params.id} to ${status}`);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Requests
  app.get('/api/requests', authenticateToken, async (_req, res) => {
    const requests = await Request.find().sort({ createdAt: -1 });
    res.json(fmtDocs(requests));
  });

  app.patch('/api/requests/:id', authenticateToken, async (req: any, res) => {
    const { status } = req.body;
    try {
      await Request.findByIdAndUpdate(req.params.id, { status });
      await logActivity(req.user.id, 'UPDATE', `REQUEST: ${req.params.id} to ${status}`);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Activity Logs
  app.get('/api/activity-logs', authenticateToken, async (_req, res) => {
    try {
      const logs = await ActivityLog.find().sort({ createdAt: -1 });
      const adminIds = [...new Set(logs.map(l => l.adminId).filter(Boolean))];
      const admins = await Admin.find({ _id: { $in: adminIds } });
      const adminMap: Record<string, string> = {};
      admins.forEach(a => { adminMap[a._id.toString()] = a.name; });
      res.json(fmtDocs(logs).map((l: any) => ({
        ...l,
        admin_name: l.adminId ? adminMap[l.adminId] || 'Unknown' : 'System',
      })));
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Admins
  app.get('/api/admins', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (_req, res) => {
    const admins = await Admin.find({}, '-password').sort({ createdAt: -1 });
    res.json(fmtDocs(admins));
  });

  app.post('/api/admins', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req: any, res) => {
    const { name, email, password, role } = req.body;
    try {
      const hash = bcrypt.hashSync(password, 10);
      const admin = await Admin.create({ name, email, password: hash, role });
      await logActivity(req.user.id, 'CREATE', `ADMIN: ${name}`);
      res.status(201).json({ id: admin._id, name, email, role });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Search
  app.get('/api/search', authenticateToken, async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    const regex = new RegExp(q as string, 'i');
    try {
      const [users, events, clubs] = await Promise.all([
        User.find({ name: regex }, 'name').limit(3),
        Event.find({ title: regex }, 'title').limit(3),
        Club.find({ name: regex }, 'name').limit(3),
      ]);
      res.json([
        ...users.map(u => ({ id: u._id, title: u.name, type: 'User', link: '/users' })),
        ...events.map(e => ({ id: e._id, title: e.title, type: 'Event', link: '/events' })),
        ...clubs.map(c => ({ id: c._id, title: c.name, type: 'Club', link: '/clubs' })),
      ]);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ─── Vite / Static ──────────────────────────────────────────────────────────

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'build');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
