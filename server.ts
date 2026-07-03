import express from 'express';
import dotenv from 'dotenv';
dotenv.config();
import path from 'path';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import multer from 'multer';
import mongoose from 'mongoose';
import { GridFSBucket } from 'mongodb';
import { Readable } from 'stream';

// ─── Config ───────────────────────────────────────────────────────────────────
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-hii-app-key-2026';
const MONGO_URI  = process.env.MONGO_URI  || '';
const PORT       = Number(process.env.PORT) || 3000;

// GridFS bucket — initialised after mongoose connects
let gfsBucket: GridFSBucket;

// ════════════════════════════════════════════════════════════════════════════
// MONGOOSE SCHEMAS
// ════════════════════════════════════════════════════════════════════════════

// ── Admin ─────────────────────────────────────────────────────────────────────
const AdminSchema = new mongoose.Schema({
  name:         { type: String, required: true, trim: true },
  email:        { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:     { type: String, required: true },
  role:         { type: String, enum: ['SUPER_ADMIN', 'CLUB_ADMIN', 'EVENT_ADMIN', 'NORMAL_ADMIN'], default: 'NORMAL_ADMIN' },
  organisation: { type: String, default: 'HiiApp' },
  status:       { type: String, default: 'ACTIVE' },
  is_active:    { type: Boolean, default: true },
  is_deleted:   { type: Boolean, default: false },
}, { timestamps: true });
const AdminModel: any = mongoose.models.Admin || mongoose.model('Admin', AdminSchema);

// ── User ──────────────────────────────────────────────────────────────────────
const UserSchema = new mongoose.Schema({
  name:        { type: String, trim: true },
  email:       { type: String, unique: true, lowercase: true, trim: true },
  mobile:      { type: String },
  gender:      { type: String },
  level:       { type: String, default: 'BRONZE' },
  status:      { type: String, default: 'ACTIVE' },
  isActive:    { type: Boolean, default: false },
  last_active: { type: Date },
  is_deleted:  { type: Boolean, default: false },
}, { timestamps: true });
const UserModel: any = mongoose.models.User || mongoose.model('User', UserSchema);

// ── Vendor (Club / Venue) ─────────────────────────────────────────────────────
const VendorSchema = new mongoose.Schema({
  name:           { type: String, trim: true },
  email:          { type: String },
  type:           { type: String },
  phone:          { type: String },
  description:    { type: String },
  city:           { type: String },
  address:        { type: String },
  capacity:       { type: Number },
  // These store GridFS file IDs as strings  e.g. "/api/images/64a1f..."
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
const VendorModel: any = mongoose.models.Vendor || mongoose.model('Vendor', VendorSchema);

// ── Event ─────────────────────────────────────────────────────────────────────
const EventSchema = new mongoose.Schema({
  title:          { type: String, required: true, trim: true },
  description:    { type: String, default: '' },
  date:           { type: String },
  start_time:     { type: String },
  end_time:       { type: String },
  city:           { type: String },
  address:        { type: String },
  // These also store GridFS-served URLs e.g. "/api/images/64a1f..."
  poster_url:     { type: String, default: '' },
  landscape_urls: [{ type: String }],
  ticketing_link: { type: String, default: '' },
  genre:          [{ type: String }],
  event_type:     [{ type: String }],
  venue_id:       { type: mongoose.Schema.Types.ObjectId, ref: 'Vendor' },
  venue_name:     { type: String },
  category:       { type: String },
  artists: [{
    name:     { type: String },
    title:    { type: String },
    subtitle: { type: String },
    image:    { type: String },
  }],
  event_layout_images:  [{ image_url: String }],
  terms_and_conditions: [{ item: String }],
  faqs:                 [{ question: String, answer: String }],
  prohibited_items:     [{ item: String }],
  status:     { type: String, default: 'UPCOMING' },
  is_active:  { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
}, { timestamps: true });
const EventModel: any = mongoose.models.Event || mongoose.model('Event', EventSchema);

// ── City ──────────────────────────────────────────────────────────────────────
const CitySchema = new mongoose.Schema({
  city_name:  { type: String, unique: true, trim: true },
  latitude:   { type: Number },
  longitude:  { type: Number },
  is_active:  { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
}, { timestamps: true, collection: 'cities' });
const CityModel: any = mongoose.models.City || mongoose.model('City', CitySchema);

// ── Filter options ────────────────────────────────────────────────────────────
const FilterOptionSchema = new mongoose.Schema({
  name:       { type: String, unique: true, required: true, trim: true },
  status:     { type: String, default: 'ACTIVE' },
  is_active:  { type: Boolean, default: true },
  is_deleted: { type: Boolean, default: false },
}, { timestamps: true });
const GenreModel: any     = mongoose.models.Genre     || mongoose.model('Genre',     FilterOptionSchema, 'genres');
const EventTypeModel: any = mongoose.models.EventType || mongoose.model('EventType', FilterOptionSchema, 'event_types');
const VenueTypeModel: any = mongoose.models.VenueType || mongoose.model('VenueType', FilterOptionSchema, 'venue_types');

// ── Ad ────────────────────────────────────────────────────────────────────────
const AdSchema = new mongoose.Schema({
  manager_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  title:      { type: String },
  amount:     { type: Number },
  status:     { type: String, default: 'ACTIVE' },
  is_deleted: { type: Boolean, default: false },
}, { timestamps: true });
const AdModel: any = mongoose.models.Ad || mongoose.model('Ad', AdSchema);

// ── Broadcast ─────────────────────────────────────────────────────────────────
const BroadcastSchema = new mongoose.Schema({
  type:     { type: String },
  message:  { type: String },
  audience: { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });
const BroadcastModel: any = mongoose.models.Broadcast || mongoose.model('Broadcast', BroadcastSchema);

// ── Poll ──────────────────────────────────────────────────────────────────────
const PollSchema = new mongoose.Schema({
  title:      { type: String },
  city:       { type: String },
  options:    [{ type: String }],
  end_date:   { type: String },
  status:     { type: String, default: 'PENDING' },
  votes:      { type: Number, default: 0 },
  is_deleted: { type: Boolean, default: false },
}, { timestamps: true });
const PollModel: any = mongoose.models.Poll || mongoose.model('Poll', PollSchema);

// ── Contest ───────────────────────────────────────────────────────────────────
const ContestSchema = new mongoose.Schema({
  title:        { type: String },
  city:         { type: String },
  rules:        { type: String },
  reward:       { type: String },
  deadline:     { type: String },
  status:       { type: String, default: 'PENDING' },
  participants: { type: Number, default: 0 },
  is_deleted:   { type: Boolean, default: false },
}, { timestamps: true });
const ContestModel: any = mongoose.models.Contest || mongoose.model('Contest', ContestSchema);

// ── Complaint ─────────────────────────────────────────────────────────────────
const ComplaintSchema = new mongoose.Schema({
  user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username:   { type: String },
  subject:    { type: String },
  message:    { type: String },
  priority:   { type: String, default: 'MEDIUM' },
  status:     { type: String, default: 'OPEN' },
  is_deleted: { type: Boolean, default: false },
}, { timestamps: true });
const ComplaintModel: any = mongoose.models.Complaint || mongoose.model('Complaint', ComplaintSchema);

// ── Request ───────────────────────────────────────────────────────────────────
const RequestSchema = new mongoose.Schema({
  user_id:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  username:   { type: String },
  subject:    { type: String },
  message:    { type: String },
  priority:   { type: String, default: 'LOW' },
  status:     { type: String, default: 'OPEN' },
  is_deleted: { type: Boolean, default: false },
}, { timestamps: true });
const RequestModel: any = mongoose.models.Request || mongoose.model('Request', RequestSchema);

// ── Activity Log ──────────────────────────────────────────────────────────────
const ActivityLogSchema = new mongoose.Schema({
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  action:   { type: String },
  resource: { type: String },
  details:  { type: String },
}, { timestamps: true });
const ActivityLogModel: any = mongoose.models.ActivityLog || mongoose.model('ActivityLog', ActivityLogSchema);

// ── Notification ──────────────────────────────────────────────────────────────
const NotificationSchema = new mongoose.Schema({
  admin_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  message:  { type: String },
  read:     { type: Boolean, default: false },
  type:     { type: String, default: 'INFO' },
}, { timestamps: true });
const NotificationModel: any = mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);

// ── Recommendation ────────────────────────────────────────────────────────────
const RecommendationSchema = new mongoose.Schema({
  type:             { type: String, enum: ['event', 'club'], required: true },
  resource_id:      { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'resource_model' },
  resource_model:   { type: String, enum: ['Event', 'Vendor'], required: true },
  title:            { type: String, default: '' },       // optional display override
  priority:         { type: Number, default: 0 },
  target_city:      { type: String, default: null },
  target_gender:    { type: String, default: null },
  target_crowd_type: { type: String, default: null },
  active:           { type: Boolean, default: true },
  starts_at:        { type: Date, default: null },
  ends_at:          { type: Date, default: null },
  created_by:       { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
  is_deleted:       { type: Boolean, default: false },
}, { timestamps: true });
const RecommendationModel: any = mongoose.models.Recommendation || mongoose.model('Recommendation', RecommendationSchema);

// ════════════════════════════════════════════════════════════════════════════
// SEED
// ════════════════════════════════════════════════════════════════════════════

const seedMongoDB = async () => {
  const syncOptions = async (model: any, names: string[]) => {
    await Promise.all(names.map(name =>
      model.updateOne(
        { name },
        { $setOnInsert: { name }, $set: { status: 'ACTIVE', is_active: true, is_deleted: false } },
        { upsert: true }
      )
    ));
  };

  await syncOptions(GenreModel, [
    'Bollywood', 'EDM', 'Commercial', 'House', 'Tech House', 'Hip Hop', 'R&B',
    'Techno', 'Minimal Techno', 'Trance', 'Psychedelic music', 'Afrobeats',
    'Reggaeton', 'Deep House', 'Progressive House', 'Drum & Bass', 'Rock Music', 'Pop', 'Acoustic',
  ]);
  await syncOptions(EventTypeModel, [
    'DJ Night', 'Festival', 'Comedy', 'Live Music', 'Theme Party',
    'Karaoke Night', 'Open Mic', 'Concert', 'Pool Party', 'Sundowner', 'Workshop',
  ]);
  await syncOptions(VenueTypeModel, [
    'Bar/Pub', 'Beach Club', 'Lounge', 'Nightclub', 'Banquet Hall', 'Restaurant',
    'Cafe', 'Auditorium', 'Stadium', 'Resort', 'Rooftop', 'Open Air', 'Hotel',
    'Garden/Lawn', 'Cruise Ship/Boat',
  ]);

  await Promise.all(['Mumbai', 'Delhi', 'Bangalore', 'Goa', 'Pune', 'Hyderabad'].map(name =>
    CityModel.updateOne(
      { city_name: name },
      { $setOnInsert: { city_name: name }, $set: { is_active: true, is_deleted: false } },
      { upsert: true }
    )
  ));

  const salt = bcrypt.genSaltSync(10);
  const defaultAdmins = [
    { name: 'Super Admin',  email: 'admin@hiiapp.com', password: 'admin123',  role: 'SUPER_ADMIN',  organisation: 'HiiApp' },
    { name: 'Club Admin',   email: 'club@admin',       password: 'club123',   role: 'CLUB_ADMIN',   organisation: 'The Vault' },
    { name: 'Events Admin', email: 'events@admin',     password: 'events123', role: 'EVENT_ADMIN',  organisation: 'Elite Event Solutions' },
    { name: 'Normal Admin', email: 'normal@admin',     password: 'normal123', role: 'NORMAL_ADMIN', organisation: 'HiiApp' },
  ];
  await Promise.all(defaultAdmins.map(a =>
    AdminModel.updateOne(
      { email: a.email },
      { $setOnInsert: { ...a, password: bcrypt.hashSync(a.password, salt) } },
      { upsert: true }
    )
  ));

  if (await UserModel.countDocuments() === 0) {
    await UserModel.insertMany(
      Array.from({ length: 20 }, (_, i) => ({
        name: `User ${i + 1}`, email: `user${i + 1}@example.com`,
        mobile: `555-010${i + 1}`, gender: i % 2 === 0 ? 'Male' : 'Female',
        level: i % 5 === 0 ? 'GOLD' : 'BRONZE', status: 'ACTIVE',
      }))
    );
  }

  if (await VendorModel.countDocuments() === 0) {
    await VendorModel.insertMany([
      { name: 'The Vault',         city: 'Mumbai',    address: '123 Colaba, Mumbai',       email: 'contact@thevault.com',  status: 'ACTIVE' },
      { name: 'Neon Lounge',       city: 'Delhi',     address: '45 Hauz Khas, Delhi',      email: 'info@neonlounge.in',    status: 'ACTIVE' },
      { name: 'Beach House',       city: 'Goa',       address: 'Baga Beach, Goa',          email: 'hello@beachhouse.com',  status: 'ACTIVE' },
      { name: 'Skyline Rooftop',   city: 'Bangalore', address: '100 Ft Road, Indiranagar', email: 'bookings@skyline.in',   status: 'ACTIVE' },
      { name: 'Underground Beats', city: 'Mumbai',    address: 'Lower Parel, Mumbai',      email: 'underground@beats.com', status: 'ACTIVE' },
    ]);
  }

  if (await PollModel.countDocuments() === 0) {
    await PollModel.create({
      title: 'Next DJ for Neon Lounge?', city: 'Delhi',
      options: ['DJ Snake', 'Martin Garrix', 'David Guetta'],
      end_date: new Date(Date.now() + 86400000 * 5).toISOString(),
      status: 'ACTIVE', votes: 150,
    });
  }

  if (await ContestModel.countDocuments() === 0) {
    await ContestModel.create({
      title: 'Best Party Outfit', city: 'Mumbai',
      rules: 'Upload a picture of your best party outfit.',
      reward: 'VIP Pass for 2',
      deadline: new Date(Date.now() + 86400000 * 10).toISOString(),
      status: 'ACTIVE', participants: 45,
    });
  }

  console.log('✅ MongoDB seed complete');
};

// ════════════════════════════════════════════════════════════════════════════
// MAPPERS
// ════════════════════════════════════════════════════════════════════════════

const mapFilterOption = (item: any) => ({
  id: item._id, name: item.name,
  status: item.status || 'ACTIVE', created_at: item.createdAt,
});

const mapCity = (city: any) => ({
  id: city._id, name: city.city_name,
  latitude: city.latitude, longitude: city.longitude,
  status: city.is_active && !city.is_deleted ? 'ACTIVE' : 'INACTIVE',
  created_at: city.createdAt,
});

// ════════════════════════════════════════════════════════════════════════════
// SERVER
// ════════════════════════════════════════════════════════════════════════════

async function startServer() {
  if (!MONGO_URI) {
    console.error('❌ MONGO_URI is not set in .env');
    process.exit(1);
  }

  await mongoose.connect(MONGO_URI);
  console.log('✅ MongoDB connected');

  // ── Initialise GridFS bucket ───────────────────────────────────────────────
  // Files are stored in the "uploads" bucket inside your MongoDB database.
  // In MongoDB Atlas you will see two collections: uploads.files + uploads.chunks
  gfsBucket = new GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
  console.log('✅ GridFS bucket ready');

  await seedMongoDB();

  const app = express();
  app.use(express.json({ limit: '50mb' }));

  // multer — memory storage, we pipe the buffer straight into GridFS
  const upload = multer({
    storage: multer.memoryStorage(),
    limits:  { fileSize: 10 * 1024 * 1024 }, // 10 MB per file
    fileFilter: (_req, file, cb) => {
      if (file.mimetype.startsWith('image/')) cb(null, true);
      else cb(new Error('Only image files are allowed'));
    },
  });

  // ── Middleware ────────────────────────────────────────────────────────────

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
      await ActivityLogModel.create({ admin_id: adminId, action, resource, details });
    } catch (err) {
      console.error('Activity log error:', err);
    }
  };

  // ─────────────────────────────────────────────────────────────────────────
  // IMAGE UPLOAD → GridFS (stored 100% in MongoDB)
  // POST /api/upload
  //   — accepts multipart field "file"
  //   — stores in MongoDB "uploads" bucket
  //   — returns { url: "/api/images/<fileId>" }
  //
  // GET  /api/images/:id
  //   — streams the image back from MongoDB to the browser
  //   — use this URL directly in <img src="..."> tags
  // ─────────────────────────────────────────────────────────────────────────

  app.post('/api/upload', authenticateToken, upload.single('file'), async (req: any, res) => {
    try {
      if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

      const { originalname, mimetype, buffer } = req.file;

      // Create a unique filename
      const filename = `${Date.now()}-${originalname.replace(/\s+/g, '_')}`;

      // Open a GridFS upload stream
      const uploadStream = gfsBucket.openUploadStream(filename, {
        contentType: mimetype,
        metadata: { uploadedBy: req.user.id, originalname },
      });

      // Pipe the buffer into GridFS
      await new Promise<void>((resolve, reject) => {
        const readable = Readable.from(buffer);
        readable.pipe(uploadStream);
        uploadStream.on('finish', resolve);
        uploadStream.on('error', reject);
      });

      // Return the URL that the frontend will store and later use in <img src>
      const url = `/api/images/${uploadStream.id}`;
      res.json({ url });
    } catch (err) {
      console.error('Upload error:', err);
      res.status(500).json({ error: 'Upload failed', details: String(err) });
    }
  });

  // GET /api/images/:id  — serve image from GridFS
  app.get('/api/images/:id', async (req, res) => {
    try {
      const fileId = new mongoose.Types.ObjectId(req.params.id);

      // Check file exists and get its metadata (for Content-Type)
      const files = await gfsBucket.find({ _id: fileId }).toArray();
      if (!files || files.length === 0) {
        return res.status(404).json({ error: 'Image not found' });
      }

      const file = files[0];

      // Set headers
      res.set('Content-Type', file.contentType || 'image/jpeg');
      res.set('Cache-Control', 'public, max-age=31536000'); // cache 1 year

      // Stream the file from MongoDB to the browser
      const downloadStream = gfsBucket.openDownloadStream(fileId);
      downloadStream.on('error', () => res.status(404).json({ error: 'Image not found' }));
      downloadStream.pipe(res);
    } catch (err) {
      // Invalid ObjectId format
      res.status(400).json({ error: 'Invalid image ID' });
    }
  });

  // ── Auth ──────────────────────────────────────────────────────────────────

  app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
      const admin: any = await AdminModel.findOne({ email: email?.toLowerCase(), is_deleted: false });
      if (!admin || !bcrypt.compareSync(password, admin.password))
        return res.status(401).json({ error: 'Invalid credentials' });

      const token = jwt.sign(
        { id: admin._id, role: admin.role, name: admin.name, organisation: admin.organisation },
        JWT_SECRET,
        { expiresIn: '24h' }
      );
      res.json({ token, user: { id: admin._id, name: admin.name, email: admin.email, role: admin.role, organisation: admin.organisation } });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ── Stats ─────────────────────────────────────────────────────────────────

  app.get('/api/stats', authenticateToken, async (_req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const [totalUsers, activeUsers, totalEvents, activeEvents, pastEvents,
             totalClubs, pendingComplaints, pendingRequests, totalAds] =
        await Promise.all([
          UserModel.countDocuments({ is_deleted: false }),
          UserModel.countDocuments({ is_deleted: false, $or: [{ isActive: true }, { last_active: { $exists: true } }] }),
          EventModel.countDocuments({ is_deleted: false }),
          EventModel.countDocuments({ is_deleted: false, is_active: true, date: { $gte: today } }),
          EventModel.countDocuments({ is_deleted: false, date: { $lt: today } }),
          VendorModel.countDocuments({ is_deleted: false }),
          ComplaintModel.countDocuments({ status: 'OPEN', is_deleted: false }),
          RequestModel.countDocuments({ status: 'OPEN', is_deleted: false }),
          AdModel.countDocuments({ is_deleted: false }),
        ]);
      res.json({ totalUsers, activeUsers, totalEvents, activeEvents, pastEvents,
                 totalClubs, pendingComplaints, pendingRequests, totalAds });
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ── Notifications ─────────────────────────────────────────────────────────

  app.get('/api/notifications', authenticateToken, async (req: any, res) => {
    try {
      const notifs = await NotificationModel.find({ admin_id: req.user.id })
        .sort({ createdAt: -1 }).limit(20).lean();
      res.json(notifs);
    } catch { res.status(500).json({ error: 'Failed to fetch notifications' }); }
  });

  app.patch('/api/notifications/read-all', authenticateToken, async (req: any, res) => {
    try {
      await NotificationModel.updateMany({ admin_id: req.user.id, read: false }, { read: true });
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Failed to mark notifications read' }); }
  });

  // ── Vendors (Clubs / Venues) ──────────────────────────────────────────────

  app.get('/api/mongo/vendors', authenticateToken, async (_req, res) => {
    try {
      res.json(await VendorModel.find({ is_deleted: false }).sort({ createdAt: -1 }).lean());
    } catch { res.status(500).json({ error: 'Failed to fetch vendors' }); }
  });

  // Alias so /api/clubs also works
  app.get('/api/clubs', authenticateToken, async (_req, res) => {
    try {
      res.json(await VendorModel.find({ is_deleted: false }).sort({ createdAt: -1 }).lean());
    } catch { res.status(500).json({ error: 'Failed to fetch clubs' }); }
  });

  app.post('/api/mongo/vendors', authenticateToken, async (req: any, res) => {
    try {
      const vendor = await VendorModel.create({ ...req.body, is_active: true, is_deleted: false });
      await logActivity(req.user.id, 'CREATE', `VENDOR: ${vendor.name}`);
      res.status(201).json(vendor);
    } catch (err) {
      res.status(500).json({ error: 'Failed to create vendor', details: String(err) });
    }
  });

  app.put('/api/mongo/vendors/:id', authenticateToken, async (req: any, res) => {
    try {
      const vendor = await VendorModel.findOneAndUpdate(
        { _id: req.params.id, is_deleted: false },
        { ...req.body },
        { new: true }
      );
      if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
      await logActivity(req.user.id, 'UPDATE', `VENDOR: ${vendor.name}`);
      res.json(vendor);
    } catch { res.status(500).json({ error: 'Failed to update vendor' }); }
  });

  app.delete('/api/mongo/vendors/:id', authenticateToken, async (req: any, res) => {
    try {
      const vendor = await VendorModel.findOneAndUpdate(
        { _id: req.params.id },
        { is_deleted: true, is_active: false },
        { new: true }
      );
      if (!vendor) return res.status(404).json({ error: 'Vendor not found' });
      await logActivity(req.user.id, 'DELETE', `VENDOR: ${vendor.name}`);
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Failed to delete vendor' }); }
  });

  // ── Events ────────────────────────────────────────────────────────────────

  app.get('/api/events', authenticateToken, async (_req, res) => {
    try {
      const events = await EventModel.find({ is_deleted: false })
        .populate('venue_id', 'name city')
        .sort({ createdAt: -1 })
        .lean();
      res.json(events);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  app.get('/api/events/:id', authenticateToken, async (req, res) => {
    try {
      const event = await EventModel.findOne({ _id: req.params.id, is_deleted: false })
        .populate('venue_id', 'name city').lean();
      if (!event) return res.status(404).json({ error: 'Event not found' });
      res.json(event);
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  app.post('/api/events', authenticateToken, async (req: any, res) => {
    try {
      const {
        title, description, date, start_time, end_time,
        city, address, poster_url, landscape_urls, ticketing_link,
        genre, event_type, venue_id, artists,
        event_layout_images, terms_and_conditions, faqs, prohibited_items,
      } = req.body;

      if (!title) return res.status(400).json({ error: 'Event title is required' });

      let venue_name = '';
      if (venue_id) {
        const vendor: any = await VendorModel.findById(venue_id).select('name').lean();
        venue_name = vendor?.name || '';
      }

      const event = await EventModel.create({
        title, description: description || '', date: date || '',
        start_time: start_time || '', end_time: end_time || '',
        city: city || '', address: address || '',
        poster_url: poster_url || '', landscape_urls: landscape_urls || [],
        ticketing_link: ticketing_link || '',
        genre: genre || [], event_type: event_type || [],
        venue_id: venue_id || null, venue_name,
        category: Array.isArray(genre) && genre.length > 0 ? genre[0] : '',
        artists: artists || [],
        event_layout_images: event_layout_images || [],
        terms_and_conditions: terms_and_conditions || [],
        faqs: faqs || [], prohibited_items: prohibited_items || [],
        status: 'UPCOMING', is_active: true, is_deleted: false,
      });

      await logActivity(req.user.id, 'CREATE', `EVENT: ${title}`);
      res.status(201).json(event);
    } catch (err) {
      console.error('Create event error:', err);
      res.status(500).json({ error: 'Internal server error', details: String(err) });
    }
  });

  app.put('/api/events/:id', authenticateToken, async (req: any, res) => {
    try {
      if (req.body.venue_id) {
        const vendor: any = await VendorModel.findById(req.body.venue_id).select('name').lean();
        req.body.venue_name = vendor?.name || '';
      }
      if (Array.isArray(req.body.genre) && req.body.genre.length > 0) {
        req.body.category = req.body.genre[0];
      }
      const event = await EventModel.findOneAndUpdate(
        { _id: req.params.id, is_deleted: false },
        { ...req.body }, { new: true }
      );
      if (!event) return res.status(404).json({ error: 'Event not found' });
      await logActivity(req.user.id, 'UPDATE', `EVENT: ${event.title}`);
      res.json(event);
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  app.delete('/api/events/:id', authenticateToken, async (req: any, res) => {
    try {
      const event = await EventModel.findOneAndUpdate(
        { _id: req.params.id },
        { is_deleted: true, is_active: false, status: 'INACTIVE' },
        { new: true }
      );
      if (!event) return res.status(404).json({ error: 'Event not found' });
      await logActivity(req.user.id, 'DELETE', `EVENT: ${event.title}`);
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  // ── Users ─────────────────────────────────────────────────────────────────

  app.get('/api/users', authenticateToken, async (_req, res) => {
    try {
      res.json(await UserModel.find({ is_deleted: false }).sort({ createdAt: -1 }).lean());
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  app.get('/api/users/:id', authenticateToken, async (req, res) => {
    try {
      const user = await UserModel.findOne({ _id: req.params.id, is_deleted: false }).lean();
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json(user);
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  // ── Cities ────────────────────────────────────────────────────────────────

  const cityRouteHandler = async (_req: any, res: any) => {
    try {
      const cities = await CityModel.find({ is_deleted: false, is_active: true }).sort({ city_name: 1 }).lean();
      res.json(cities.map(mapCity));
    } catch { res.status(500).json({ error: 'Failed to fetch cities' }); }
  };
  app.get('/api/cities',       authenticateToken, cityRouteHandler);
  app.get('/api/mongo/cities', authenticateToken, cityRouteHandler);

  app.post('/api/cities', authenticateToken, async (req, res) => {
    try {
      const city_name = String(req.body.name || '').trim();
      if (!city_name) return res.status(400).json({ error: 'Name is required' });
      const city = await CityModel.findOneAndUpdate(
        { city_name },
        { $set: { city_name, is_active: true, is_deleted: false } },
        { upsert: true, new: true }
      ).lean();
      res.status(201).json(mapCity(city));
    } catch { res.status(500).json({ error: 'Failed to add city' }); }
  });

  app.delete('/api/cities/:id', authenticateToken, async (req, res) => {
    try {
      await CityModel.findByIdAndUpdate(req.params.id, { is_active: false, is_deleted: true });
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Failed to delete city' }); }
  });

  // ── Filter options (genres / eventTypes / venueTypes) ─────────────────────

  const filterRoutes = (routePath: string, Model: any, label: string) => {
    app.get(`/api/${routePath}`, authenticateToken, async (_req, res) => {
      try {
        res.json((await Model.find({ is_deleted: false, is_active: true }).sort({ name: 1 }).lean()).map(mapFilterOption));
      } catch { res.status(500).json({ error: `Failed to fetch ${label}` }); }
    });
    app.post(`/api/${routePath}`, authenticateToken, async (req, res) => {
      try {
        const name = String(req.body.name || '').trim();
        if (!name) return res.status(400).json({ error: 'Name is required' });
        const item = await Model.findOneAndUpdate(
          { name },
          { $set: { name, status: 'ACTIVE', is_active: true, is_deleted: false } },
          { upsert: true, new: true }
        ).lean();
        res.status(201).json(mapFilterOption(item));
      } catch { res.status(500).json({ error: `Failed to add ${label}` }); }
    });
    app.delete(`/api/${routePath}/:id`, authenticateToken, async (req, res) => {
      try {
        await Model.findByIdAndUpdate(req.params.id, { status: 'INACTIVE', is_active: false, is_deleted: true });
        res.json({ success: true });
      } catch { res.status(500).json({ error: `Failed to delete ${label}` }); }
    });
  };

  filterRoutes('genres',     GenreModel,     'genres');
  filterRoutes('eventTypes', EventTypeModel, 'event types');
  filterRoutes('venueTypes', VenueTypeModel, 'venue types');

  // ── Admins ────────────────────────────────────────────────────────────────

  app.get('/api/admins', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (_req, res) => {
    try {
      res.json(await AdminModel.find({ is_deleted: false }).select('-password').lean());
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  app.post('/api/admins', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req: any, res) => {
    try {
      const { name, email, password, role, organisation } = req.body;
      const admin = await AdminModel.create({
        name, email, role, organisation,
        password: bcrypt.hashSync(password, bcrypt.genSaltSync(10)),
      });
      await logActivity(req.user.id, 'CREATE', `ADMIN: ${name}`);
      res.status(201).json({ id: admin._id, name, email, role });
    } catch (err: any) {
      if (err.code === 11000) return res.status(409).json({ error: 'Email already exists' });
      res.status(500).json({ error: 'Internal server error' });
    }
  });

  // ── Ads ───────────────────────────────────────────────────────────────────

  app.get('/api/ads', authenticateToken, async (_req, res) => {
    try {
      res.json(await AdModel.find({ is_deleted: false }).sort({ createdAt: -1 }).lean());
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });
  app.post('/api/ads', authenticateToken, async (req: any, res) => {
    try {
      const ad = await AdModel.create({ manager_id: req.user.id, ...req.body });
      await logActivity(req.user.id, 'CREATE', `AD: ${req.body.title}`);
      res.status(201).json(ad);
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  // ── Broadcasts ────────────────────────────────────────────────────────────

  app.post('/api/broadcasts', authenticateToken, async (req: any, res) => {
    try {
      const broadcast = await BroadcastModel.create(req.body);
      await logActivity(req.user.id, 'SEND', `BROADCAST: ${req.body.type}`);
      res.status(201).json(broadcast);
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  // ── Polls ─────────────────────────────────────────────────────────────────

  app.get('/api/polls', authenticateToken, async (_req, res) => {
    try {
      res.json(await PollModel.find({ is_deleted: false }).sort({ createdAt: -1 }).lean());
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });
  app.post('/api/polls', authenticateToken, async (req: any, res) => {
    try {
      const { title, city, options, endDate } = req.body;
      const poll = await PollModel.create({ title, city, options, end_date: endDate, status: 'PENDING', votes: 0 });
      await logActivity(req.user.id, 'CREATE', `POLL: ${title}`);
      res.status(201).json(poll);
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });
  app.patch('/api/polls/:id/status', authenticateToken, async (req: any, res) => {
    try {
      await PollModel.findByIdAndUpdate(req.params.id, { status: req.body.status });
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  // ── Contests ──────────────────────────────────────────────────────────────

  app.get('/api/contests', authenticateToken, async (_req, res) => {
    try {
      res.json(await ContestModel.find({ is_deleted: false }).sort({ createdAt: -1 }).lean());
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });
  app.post('/api/contests', authenticateToken, async (req: any, res) => {
    try {
      const { title, city, rules, reward, deadline } = req.body;
      const contest = await ContestModel.create({ title, city, rules, reward, deadline, status: 'PENDING', participants: 0 });
      await logActivity(req.user.id, 'CREATE', `CONTEST: ${title}`);
      res.status(201).json(contest);
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });
  app.patch('/api/contests/:id/status', authenticateToken, async (req: any, res) => {
    try {
      await ContestModel.findByIdAndUpdate(req.params.id, { status: req.body.status });
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  // ── Complaints ────────────────────────────────────────────────────────────

  app.get('/api/complaints', authenticateToken, async (_req, res) => {
    try {
      res.json(await ComplaintModel.find({ is_deleted: false }).sort({ createdAt: -1 }).lean());
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });
  app.patch('/api/complaints/:id', authenticateToken, async (req: any, res) => {
    try {
      await ComplaintModel.findByIdAndUpdate(req.params.id, { status: req.body.status });
      await logActivity(req.user.id, 'UPDATE', `COMPLAINT: ${req.params.id}`);
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  // ── Requests ──────────────────────────────────────────────────────────────

  app.get('/api/requests', authenticateToken, async (_req, res) => {
    try {
      res.json(await RequestModel.find({ is_deleted: false }).sort({ createdAt: -1 }).lean());
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });
  app.patch('/api/requests/:id', authenticateToken, async (req: any, res) => {
    try {
      await RequestModel.findByIdAndUpdate(req.params.id, { status: req.body.status });
      await logActivity(req.user.id, 'UPDATE', `REQUEST: ${req.params.id}`);
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  // ── Activity Logs ─────────────────────────────────────────────────────────

  app.get('/api/activity-logs', authenticateToken, async (_req, res) => {
    try {
      const logs = await ActivityLogModel.find()
        .populate('admin_id', 'name')
        .sort({ createdAt: -1 }).limit(200).lean();
      res.json(logs.map((l: any) => ({ ...l, admin_name: l.admin_id?.name || 'Unknown' })));
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  // ── Search ────────────────────────────────────────────────────────────────

  app.get('/api/search', authenticateToken, async (req, res) => {
    const { q } = req.query;
    if (!q) return res.json([]);
    const regex = { $regex: q as string, $options: 'i' };
    try {
      const [users, vendors, events] = await Promise.all([
        UserModel.find({ name: regex, is_deleted: false }).select('_id name').limit(3).lean(),
        VendorModel.find({ name: regex, is_deleted: false }).select('_id name').limit(3).lean(),
        EventModel.find({ title: regex, is_deleted: false }).select('_id title').limit(3).lean(),
      ]);
      res.json([
        ...users.map((u: any)  => ({ id: u._id, title: u.name,  type: 'User',  link: '/users'  })),
        ...vendors.map((v: any) => ({ id: v._id, title: v.name,  type: 'Club',  link: '/clubs'  })),
        ...events.map((e: any)  => ({ id: e._id, title: e.title, type: 'Event', link: '/events' })),
      ]);
    } catch { res.status(500).json({ error: 'Internal server error' }); }
  });

  // ── Recommendations ───────────────────────────────────────────────────────

  // GET /api/recommendations — list (filterable by type, city, active)
  app.get('/api/recommendations', authenticateToken, async (req, res) => {
    try {
      const filter: any = { is_deleted: false };
      const allowedTypes = ['event', 'club'];
      const typeParam = String(req.query.type || '');
      if (typeParam && allowedTypes.includes(typeParam)) filter.type = typeParam;
      if (req.query.city) filter.target_city = String(req.query.city).slice(0, 100);
      if (req.query.active) filter.active = req.query.active === 'true';
      const recs = await RecommendationModel.find(filter)
        .populate('resource_id')
        .populate('created_by', 'name')
        .sort({ priority: 1, createdAt: -1 })
        .lean();
      res.json(recs);
    } catch { res.status(500).json({ error: 'Failed to fetch recommendations' }); }
  });

  // GET /api/recommendations/preview — ordered active list as mobile app sees it
  app.get('/api/recommendations/preview', authenticateToken, async (_req, res) => {
    try {
      const now = new Date();
      const recs = await RecommendationModel.find({
        is_deleted: false,
        active: true,
        $or: [
          { starts_at: null, ends_at: null },
          { starts_at: { $lte: now }, ends_at: { $gte: now } },
          { starts_at: null, ends_at: { $gte: now } },
          { starts_at: { $lte: now }, ends_at: null },
        ],
      })
        .populate('resource_id')
        .populate('created_by', 'name')
        .sort({ priority: 1, createdAt: -1 })
        .lean();
      res.json(recs);
    } catch { res.status(500).json({ error: 'Failed to fetch preview' }); }
  });

  // POST /api/recommendations — create (SUPER_ADMIN only)
  app.post('/api/recommendations', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req: any, res) => {
    try {
      const {
        type, resource_id, title, priority,
        target_city, target_gender, target_crowd_type,
        active, starts_at, ends_at,
      } = req.body;
      if (!type || !resource_id) return res.status(400).json({ error: 'type and resource_id are required' });
      const resource_model = type === 'event' ? 'Event' : 'Vendor';
      const rec = await RecommendationModel.create({
        type, resource_id, resource_model,
        title: title || '',
        priority: priority ?? 0,
        target_city: target_city || null,
        target_gender: target_gender || null,
        target_crowd_type: target_crowd_type || null,
        active: active !== undefined ? active : true,
        starts_at: starts_at || null,
        ends_at: ends_at || null,
        created_by: req.user.id,
        is_deleted: false,
      });
      await logActivity(req.user.id, 'CREATE', `RECOMMENDATION: ${type}/${resource_id}`);
      const populated = await RecommendationModel.findById(rec._id)
        .populate('resource_id')
        .populate('created_by', 'name')
        .lean();
      res.status(201).json(populated);
    } catch (err) { res.status(500).json({ error: 'Failed to create recommendation', details: String(err) }); }
  });

  // PATCH /api/recommendations/:id — update priority / active / targeting
  app.patch('/api/recommendations/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req: any, res) => {
    try {
      const allowed = ['title', 'priority', 'active', 'target_city', 'target_gender', 'target_crowd_type', 'starts_at', 'ends_at'];
      const update: any = {};
      for (const key of allowed) {
        if (req.body[key] !== undefined) update[key] = req.body[key];
      }
      const rec = await RecommendationModel.findOneAndUpdate(
        { _id: req.params.id, is_deleted: false },
        { $set: update },
        { new: true }
      ).populate('resource_id').populate('created_by', 'name').lean();
      if (!rec) return res.status(404).json({ error: 'Recommendation not found' });
      await logActivity(req.user.id, 'UPDATE', `RECOMMENDATION: ${req.params.id}`);
      res.json(rec);
    } catch { res.status(500).json({ error: 'Failed to update recommendation' }); }
  });

  // DELETE /api/recommendations/:id — soft delete
  app.delete('/api/recommendations/:id', authenticateToken, authorizeRoles('SUPER_ADMIN'), async (req: any, res) => {
    try {
      const rec = await RecommendationModel.findOneAndUpdate(
        { _id: req.params.id },
        { is_deleted: true, active: false },
        { new: true }
      );
      if (!rec) return res.status(404).json({ error: 'Recommendation not found' });
      await logActivity(req.user.id, 'DELETE', `RECOMMENDATION: ${req.params.id}`);
      res.json({ success: true });
    } catch { res.status(500).json({ error: 'Failed to delete recommendation' }); }
  });

  // ── Vite / Static ─────────────────────────────────────────────────────────

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'build');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html')));
  }

  app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server on http://localhost:${PORT}`));
}

startServer().catch(err => {
  console.error('Fatal:', err);
  process.exit(1);
});