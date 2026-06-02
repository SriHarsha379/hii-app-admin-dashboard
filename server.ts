import express from 'express';
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import db from './src/lib/db.ts';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-hii-app-key-2026';

// Seed Admin if not exists
const seedAdmin = () => {
  try {
    const emails = ['admin@hiiapp.com', 'club@admin', 'events@admin', 'normal@admin'];
    const names = ['Super Admin', 'Club Admin', 'Events Admin', 'Normal Admin'];
    const roles = ['SUPER_ADMIN', 'CLUB_ADMIN', 'EVENT_ADMIN', 'NORMAL_ADMIN'];
    const passwords = ['admin123', 'club123', 'events123', 'normal123'];

    const salt = bcrypt.genSaltSync(10);
    
    emails.forEach((email, i) => {
      const adminExists = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
      if (!adminExists) {
        const hash = bcrypt.hashSync(passwords[i], salt);
        db.prepare('INSERT INTO admins (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
          uuidv4(),
          names[i],
          email,
          hash,
          roles[i]
        );
      }
    });

    // Seed some mock data if empty
    const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
    if (usersCount.count === 0) {
      for (let i = 1; i <= 20; i++) {
        db.prepare('INSERT INTO users (id, name, email, mobile, gender, level, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          uuidv4(),
          `User ${i}`,
          `user${i}@example.com`,
          `555-010${i}`,
          i % 2 === 0 ? 'Male' : 'Female',
          i % 5 === 0 ? 'GOLD' : 'BRONZE',
          'ACTIVE'
        );
      }
    }

    const clubsCount = db.prepare('SELECT COUNT(*) as count FROM clubs').get() as any;
    if (clubsCount.count === 0) {
      const club1Id = uuidv4();
      const club2Id = uuidv4();
      const club3Id = uuidv4();
      const club4Id = uuidv4();
      const club5Id = uuidv4();

      const insertClub = db.prepare(`
        INSERT INTO clubs (id, name, city, address, contact_info, status) 
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      
      insertClub.run(club1Id, 'The Vault', 'Mumbai', '123 Colaba, Mumbai', 'contact@thevault.com', 'ACTIVE');
      insertClub.run(club2Id, 'Neon Lounge', 'Delhi', '45 Hauz Khas, Delhi', 'info@neonlounge.in', 'ACTIVE');
      insertClub.run(club3Id, 'Beach House', 'Goa', 'Baga Beach, Goa', 'hello@beachhouse.com', 'ACTIVE');
      insertClub.run(club4Id, 'Skyline Rooftop', 'Bangalore', '100 Ft Road, Indiranagar', 'bookings@skyline.in', 'ACTIVE');
      insertClub.run(club5Id, 'Underground Beats', 'Mumbai', 'Lower Parel, Mumbai', 'underground@beats.com', 'ACTIVE');

      const eventsCount = db.prepare('SELECT COUNT(*) as count FROM events').get() as any;
      if (eventsCount.count === 0) {
        const insertEvent = db.prepare(`
          INSERT INTO events (id, title, venue_id, date_time, city, poster_url, landscape_url, synopsis, music_genre, crowd_type, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        
        insertEvent.run(
          uuidv4(), 
          'Techno Valley Vol. 1', 
          club1Id, 
          new Date(Date.now() + 86400000 * 2).toISOString(), 
          'Mumbai', 
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80', 
          'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=1600&q=80',
          'A night of deep techno and immersive visuals.', 
          'Techno',
          'Mixed',
          'UPCOMING'
        );
        
        insertEvent.run(
          uuidv4(), 
          'Bollywood Night', 
          club2Id, 
          new Date(Date.now() + 86400000 * 5).toISOString(), 
          'Delhi', 
          'https://images.unsplash.com/photo-1545128485-c400e7702796?w=800&q=80', 
          'https://images.unsplash.com/photo-1545128485-c400e7702796?w=1600&q=80',
          'Dance to the latest Bollywood hits with DJ Raj.', 
          'Bollywood',
          'Couples/Groups',
          'UPCOMING'
        );
        
        insertEvent.run(
          uuidv4(), 
          'Sunset Sundowner', 
          club3Id, 
          new Date(Date.now() + 86400000 * 7).toISOString(), 
          'Goa', 
          'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80', 
          'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=1600&q=80',
          'Chill vibes by the beach with live acoustic music.', 
          'Acoustic/House',
          'Everyone',
          'UPCOMING'
        );

        insertEvent.run(
          uuidv4(), 
          'Indie Rock Fest', 
          club4Id, 
          new Date(Date.now() + 86400000 * 10).toISOString(), 
          'Bangalore', 
          'https://images.unsplash.com/photo-1501281668745-f7f5792203b4?w=800&q=80', 
          'https://images.unsplash.com/photo-1501281668745-f7f5792203b4?w=1600&q=80',
          'Local indie bands taking over the stage.', 
          'Indie Rock',
          'College/Young Adults',
          'UPCOMING'
        );

        insertEvent.run(
          uuidv4(), 
          'Midnight Jazz', 
          club5Id, 
          new Date(Date.now() + 86400000 * 14).toISOString(), 
          'Mumbai', 
          'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=800&q=80', 
          'https://images.unsplash.com/photo-1511192336575-5a79af67a629?w=1600&q=80',
          'Smooth jazz and cocktails.', 
          'Jazz',
          'Couples/Mature',
          'UPCOMING'
        );
      }
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
        uuidv4(), 'Next DJ for Neon Lounge?', 'Delhi', JSON.stringify(['DJ Snake', 'Martin Garrix', 'David Guetta']), new Date(Date.now() + 86400000 * 5).toISOString(), 'ACTIVE', 150
      );
      db.prepare('INSERT INTO polls (id, title, city, options, end_date, status, votes) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
        uuidv4(), 'Favorite Music Genre?', 'Mumbai', JSON.stringify(['Techno', 'Bollywood', 'Hip Hop', 'Jazz']), new Date(Date.now() + 86400000 * 2).toISOString(), 'ACTIVE', 320
      );
    }

    const contestsCount = db.prepare('SELECT COUNT(*) as count FROM contests').get() as any;
    if (contestsCount.count === 0) {
      db.prepare('INSERT INTO contests (id, title, city, rules, reward, deadline, status, participants) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        uuidv4(), 'Best Party Outfit', 'Mumbai', 'Upload a picture of your best party outfit.', 'VIP Pass for 2', new Date(Date.now() + 86400000 * 10).toISOString(), 'ACTIVE', 45
      );
      db.prepare('INSERT INTO contests (id, title, city, rules, reward, deadline, status, participants) VALUES (?, ?, ?, ?, ?, ?, ?, ?)').run(
        uuidv4(), 'Guess the Track', 'Delhi', 'Guess the track played in the video clip.', 'Free Drinks Voucher', new Date(Date.now() + 86400000 * 3).toISOString(), 'ACTIVE', 120
      );
    }

    const complaintsCount = db.prepare('SELECT COUNT(*) as count FROM complaints').get() as any;
    if (complaintsCount.count === 0) {
      const userId = db.prepare('SELECT id FROM users LIMIT 1').get() as any;
      if (userId) {
        db.prepare('INSERT INTO complaints (id, user_id, username, subject, message, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          uuidv4(), userId.id, 'User 1', 'Payment Failed', 'My payment for the VIP pass failed but money was deducted.', 'HIGH', 'OPEN'
        );
        db.prepare('INSERT INTO complaints (id, user_id, username, subject, message, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          uuidv4(), userId.id, 'User 1', 'App Crash', 'The app crashes when I try to open the events page.', 'MEDIUM', 'OPEN'
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
        db.prepare('INSERT INTO requests (id, user_id, username, subject, message, priority, status) VALUES (?, ?, ?, ?, ?, ?, ?)').run(
          uuidv4(), userId.id, 'User 1', 'Account Deletion', 'I want to delete my account.', 'HIGH', 'OPEN'
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
        db.prepare('INSERT INTO activity_logs (id, admin_id, action, resource, details) VALUES (?, ?, ?, ?, ?)').run(
          uuidv4(), adminId.id, 'CREATE', 'EVENT', 'Created event: Techno Valley Vol. 1'
        );
        db.prepare('INSERT INTO activity_logs (id, admin_id, action, resource, details) VALUES (?, ?, ?, ?, ?)').run(
          uuidv4(), adminId.id, 'UPDATE', 'CLUB', 'Updated details for club: The Vault'
        );
      }
    }
  } catch (err) {
    console.error('Database seeding error:', err);
  }
};

seedAdmin();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // Ensure uploads directory exists
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure multer for file uploads
  const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({ 
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
  });

  // Serve static files from uploads directory
  app.use('/uploads', express.static(uploadsDir));

  // --- Middleware ---

  const authenticateToken = (req: any, res: any, next: any) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (token == null) return res.sendStatus(401);

    jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
      if (err) return res.sendStatus(403);
      req.user = user;
      next();
    });
  };

  const authorizeRoles = (...roles: string[]) => {
    return (req: any, res: any, next: any) => {
      if (!roles.includes(req.user.role)) {
        return res.status(403).json({ error: 'Access denied' });
      }
      next();
    };
  };

  const logActivity = (adminId: string, action: string, resource: string, details?: string) => {
    try {
      db.prepare('INSERT INTO activity_logs (id, admin_id, action, resource, details) VALUES (?, ?, ?, ?, ?)').run(
        uuidv4(),
        adminId,
        action,
        resource,
        details || null
      );
    } catch (err) {
      console.error('Activity logging error:', err);
    }
  };

  // --- API Routes ---

  // Upload
  app.post('/api/upload', authenticateToken, upload.single('file'), (req: any, res) => {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    const url = `/uploads/${req.file.filename}`;
    res.json({ url });
  });

  // Auth
  app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;
    try {
      const admin: any = db.prepare('SELECT * FROM admins WHERE email = ?').get(email);
      
      if (!admin) return res.status(401).json({ error: 'Invalid credentials' });
      
      const validPassword = bcrypt.compareSync(password, admin.password);
      if (!validPassword) return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign({ id: admin.id, role: admin.role, name: admin.name }, JWT_SECRET, { expiresIn: '24h' });
      res.json({ token, user: { id: admin.id, name: admin.name, email: admin.email, role: admin.role, organisation: admin.organisation } });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Stats
  app.get('/api/stats', authenticateToken, (req, res) => {
    try {
      const usersCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as any;
      const eventsCount = db.prepare('SELECT COUNT(*) as count FROM events').get() as any;
      const activeEventsCount = db.prepare('SELECT COUNT(*) as count FROM events WHERE status IN ("LIVE", "UPCOMING")').get() as any;
      const pastEventsCount = db.prepare('SELECT COUNT(*) as count FROM events WHERE status = "COMPLETED"').get() as any;
      const clubsCount = db.prepare('SELECT COUNT(*) as count FROM clubs').get() as any;
      const complaintsCount = db.prepare('SELECT COUNT(*) as count FROM complaints WHERE status = "PENDING"').get() as any;
      const requestsCount = db.prepare('SELECT COUNT(*) as count FROM requests WHERE status = "PENDING"').get() as any;
      const adsCount = db.prepare('SELECT COUNT(*) as count FROM ads').get() as any;

      res.json({
        totalUsers: usersCount.count,
        activeUsers: usersCount.count, // Using total users as active for now
        totalEvents: eventsCount.count,
        activeEvents: activeEventsCount.count,
        pastEvents: pastEventsCount.count,
        totalClubs: clubsCount.count,
        pendingComplaints: complaintsCount.count,
        pendingRequests: requestsCount.count,
        totalAds: adsCount.count,
        totalReservations: 1284, // Mock reservations
        revenue: 125400 // Mock revenue
      });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Users
  app.get('/api/users', authenticateToken, (req, res) => {
    const users = db.prepare('SELECT id, name, email, mobile, gender, level, status, created_at FROM users ORDER BY created_at DESC').all();
    res.json(users);
  });

  app.get('/api/users/:id', authenticateToken, (req, res) => {
    const user = db.prepare('SELECT id, name, email, mobile, gender, level, status, created_at FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  });

  app.get('/api/cities', authenticateToken, (req, res) => {
    try {
      const cities = db.prepare('SELECT * FROM cities WHERE status = ? ORDER BY name').all('ACTIVE');
      res.json(cities);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch cities' });
    }
  });

  app.post('/api/cities', authenticateToken, (req, res) => {
    try {
      const id = uuidv4();
      db.prepare('INSERT INTO cities (id, name) VALUES (?, ?)').run(id, req.body.name);
      res.status(201).json({ id, name: req.body.name });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add city' });
    }
  });

  app.delete('/api/cities/:id', authenticateToken, (req, res) => {
    try {
      db.prepare('UPDATE cities SET status = ? WHERE id = ?').run('INACTIVE', req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete city' });
    }
  });

  app.get('/api/genres', authenticateToken, (req, res) => {
    try {
      const genres = db.prepare('SELECT * FROM genres WHERE status = ? ORDER BY name').all('ACTIVE');
      res.json(genres);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch genres' });
    }
  });

  app.post('/api/genres', authenticateToken, (req, res) => {
    try {
      const id = uuidv4();
      db.prepare('INSERT INTO genres (id, name) VALUES (?, ?)').run(id, req.body.name);
      res.status(201).json({ id, name: req.body.name });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add genre' });
    }
  });

  app.delete('/api/genres/:id', authenticateToken, (req, res) => {
    try {
      db.prepare('UPDATE genres SET status = ? WHERE id = ?').run('INACTIVE', req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete genre' });
    }
  });

  app.get('/api/eventTypes', authenticateToken, (req, res) => {
    try {
      const types = db.prepare('SELECT * FROM event_types WHERE status = ? ORDER BY name').all('ACTIVE');
      res.json(types);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch event types' });
    }
  });

  app.post('/api/eventTypes', authenticateToken, (req, res) => {
    try {
      const id = uuidv4();
      db.prepare('INSERT INTO event_types (id, name) VALUES (?, ?)').run(id, req.body.name);
      res.status(201).json({ id, name: req.body.name });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add event type' });
    }
  });

  app.delete('/api/eventTypes/:id', authenticateToken, (req, res) => {
    try {
      db.prepare('UPDATE event_types SET status = ? WHERE id = ?').run('INACTIVE', req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete event type' });
    }
  });

  app.get('/api/venueTypes', authenticateToken, (req, res) => {
    try {
      const types = db.prepare('SELECT * FROM venue_types WHERE status = ? ORDER BY name').all('ACTIVE');
      res.json(types);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch venue types' });
    }
  });

  app.post('/api/venueTypes', authenticateToken, (req, res) => {
    try {
      const id = uuidv4();
      db.prepare('INSERT INTO venue_types (id, name) VALUES (?, ?)').run(id, req.body.name);
      res.status(201).json({ id, name: req.body.name });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add venue type' });
    }
  });

  app.delete('/api/venueTypes/:id', authenticateToken, (req, res) => {
    try {
      db.prepare('UPDATE venue_types SET status = ? WHERE id = ?').run('INACTIVE', req.params.id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete venue type' });
    }
  });

  // Events
  app.get('/api/events', authenticateToken, (req, res) => {
    const events = db.prepare(`
      SELECT e.*, c.name as venue 
      FROM events e 
      LEFT JOIN clubs c ON e.venue_id = c.id 
      ORDER BY e.date_time DESC
    `).all();
    res.json(events);
  });

  app.post('/api/events', authenticateToken, (req: any, res) => {
    const id = uuidv4();
    const { 
      title, venue_id, date_time, city, synopsis, email, phone, 
      ticket_link, music_genre, crowd_type, poster_url, landscape_url, media_gallery 
    } = req.body;
    try {
      db.prepare(`
        INSERT INTO events (id, title, venue_id, date_time, city, synopsis, email, phone, ticket_link, music_genre, crowd_type, poster_url, landscape_url, media_gallery)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        id, title, venue_id, date_time, city, synopsis, email, phone, 
        ticket_link, music_genre, crowd_type, poster_url, landscape_url, 
        typeof media_gallery === 'string' ? media_gallery : JSON.stringify(media_gallery || [])
      );
      
      logActivity(req.user.id, 'CREATE', `EVENT: ${title}`);
      res.status(201).json({ id, ...req.body });
    } catch (err) {
      console.error('Error creating event:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.put('/api/events/:id', authenticateToken, (req: any, res) => {
    const { id } = req.params;
    const { 
      title, venue_id, date_time, city, synopsis, email, phone, 
      ticket_link, music_genre, crowd_type, poster_url, landscape_url, media_gallery,
      hide_end_time, advertise, status
    } = req.body;
    try {
      db.prepare(`
        UPDATE events 
        SET title = ?, venue_id = ?, date_time = ?, city = ?, synopsis = ?, 
            email = ?, phone = ?, ticket_link = ?, music_genre = ?, 
            crowd_type = ?, poster_url = ?, landscape_url = ?, media_gallery = ?,
            hide_end_time = ?, advertise = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(
        title, venue_id, date_time, city, synopsis, email, phone, 
        ticket_link, music_genre, crowd_type, poster_url, landscape_url, 
        typeof media_gallery === 'string' ? media_gallery : JSON.stringify(media_gallery || []),
        hide_end_time ? 1 : 0, advertise ? 1 : 0, status || 'UPCOMING',
        id
      );
      
      logActivity(req.user.id, 'UPDATE', `EVENT: ${title}`);
      res.json({ id, ...req.body });
    } catch (err) {
      console.error('Error updating event:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Clubs
  app.get('/api/clubs', authenticateToken, (req, res) => {
    const clubs = db.prepare('SELECT id, name, city as location, city, address, contact_info, media, status, created_at FROM clubs ORDER BY created_at DESC').all();
    res.json(clubs);
  });

  app.post('/api/clubs', authenticateToken, (req: any, res) => {
    const id = uuidv4();
    const { name, city, address, contact_info } = req.body;
    try {
      db.prepare('INSERT INTO clubs (id, name, city, address, contact_info) VALUES (?, ?, ?, ?, ?)').run(
        id, name, city, address, contact_info
      );
      logActivity(req.user.id, 'CREATE', `CLUB: ${name}`);
      res.status(201).json({ id, ...req.body });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Ads
  app.get('/api/ads', authenticateToken, (req, res) => {
    const ads = db.prepare('SELECT * FROM ads ORDER BY created_at DESC').all();
    res.json(ads);
  });

  app.post('/api/ads', authenticateToken, (req: any, res) => {
    const id = uuidv4();
    const { title, amount } = req.body;
    try {
      db.prepare('INSERT INTO ads (id, manager_id, title, amount) VALUES (?, ?, ?, ?)').run(
        id, req.user.id, title, amount
      );
      logActivity(req.user.id, 'CREATE', `AD: ${title}`);
      res.status(201).json({ id, ...req.body });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Broadcasts
  app.post('/api/broadcasts', authenticateToken, (req: any, res) => {
    const id = uuidv4();
    const { type, message, audience } = req.body;
    try {
      db.prepare('INSERT INTO broadcasts (id, type, message, audience) VALUES (?, ?, ?, ?)').run(
        id, type, message, JSON.stringify(audience)
      );
      logActivity(req.user.id, 'SEND', `BROADCAST: ${type}`);
      res.status(201).json({ id, ...req.body });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Polls & Contests
  app.get('/api/polls', authenticateToken, (req, res) => {
    const polls = db.prepare('SELECT * FROM polls ORDER BY created_at DESC').all();
    res.json(polls);
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
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch('/api/polls/:id/status', authenticateToken, (req: any, res) => {
    const { status } = req.body;
    try {
      db.prepare('UPDATE polls SET status = ? WHERE id = ?').run(status, req.params.id);
      logActivity(req.user.id, 'UPDATE', `POLL STATUS: ${req.params.id} -> ${status}`);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/contests', authenticateToken, (req, res) => {
    const contests = db.prepare('SELECT * FROM contests ORDER BY created_at DESC').all();
    res.json(contests);
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
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.patch('/api/contests/:id/status', authenticateToken, (req: any, res) => {
    const { status } = req.body;
    try {
      db.prepare('UPDATE contests SET status = ? WHERE id = ?').run(status, req.params.id);
      logActivity(req.user.id, 'UPDATE', `CONTEST STATUS: ${req.params.id} -> ${status}`);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/contests/:id/participants', authenticateToken, (req, res) => {
    try {
      const participants = db.prepare(`
        SELECT cp.*, u.name, u.email, u.mobile
        FROM contest_participants cp
        JOIN users u ON cp.user_id = u.id
        WHERE cp.contest_id = ?
        ORDER BY cp.created_at DESC
      `).all(req.params.id);
      res.json(participants);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Complaints
  app.get('/api/complaints', authenticateToken, (req, res) => {
    const complaints = db.prepare('SELECT * FROM complaints ORDER BY created_at DESC').all();
    res.json(complaints);
  });

  app.patch('/api/complaints/:id', authenticateToken, (req: any, res) => {
    const { status } = req.body;
    try {
      db.prepare('UPDATE complaints SET status = ? WHERE id = ?').run(status, req.params.id);
      logActivity(req.user.id, 'UPDATE', `COMPLAINT: ${req.params.id} to ${status}`);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Requests
  app.get('/api/requests', authenticateToken, (req, res) => {
    const requests = db.prepare('SELECT * FROM requests ORDER BY created_at DESC').all();
    res.json(requests);
  });

  app.patch('/api/requests/:id', authenticateToken, (req: any, res) => {
    const { status } = req.body;
    try {
      db.prepare('UPDATE requests SET status = ? WHERE id = ?').run(status, req.params.id);
      logActivity(req.user.id, 'UPDATE', `REQUEST: ${req.params.id} to ${status}`);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Activity Logs
  app.get('/api/activity-logs', authenticateToken, (req, res) => {
    try {
      const logs = db.prepare(`
        SELECT l.*, a.name as admin_name 
        FROM activity_logs l 
        JOIN admins a ON l.admin_id = a.id 
        ORDER BY l.created_at DESC
      `).all();
      res.json(logs);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Admins
  app.get('/api/admins', authenticateToken, authorizeRoles('SUPER_ADMIN'), (req, res) => {
    const admins = db.prepare('SELECT id, name, email, role, status, created_at FROM admins').all();
    res.json(admins);
  });

  app.post('/api/admins', authenticateToken, authorizeRoles('SUPER_ADMIN'), (req: any, res) => {
    const id = uuidv4();
    const { name, email, password, role } = req.body;
    try {
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);
      db.prepare('INSERT INTO admins (id, name, email, password, role) VALUES (?, ?, ?, ?, ?)').run(
        id, name, email, hash, role
      );
      logActivity(req.user.id, 'CREATE', `ADMIN: ${name}`);
      res.status(201).json({ id, name, email, role });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // Search
  app.get('/api/search', authenticateToken, (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    const query = `%${q}%`;
    try {
      const users = db.prepare('SELECT id, name as title, "User" as type, "/users" as link FROM users WHERE name LIKE ? LIMIT 3').all(query);
      const events = db.prepare('SELECT id, title, "Event" as type, "/events" as link FROM events WHERE title LIKE ? LIMIT 3').all(query);
      const clubs = db.prepare('SELECT id, name as title, "Club" as type, "/clubs" as link FROM clubs WHERE name LIKE ? LIMIT 3').all(query);
      res.json([...users, ...events, ...clubs]);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // --- Vite Middleware ---
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
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
