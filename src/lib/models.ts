import mongoose, { Schema, Document, Model } from 'mongoose';

// ─── Helper ──────────────────────────────────────────────────────────────────

function model<T extends Document>(name: string, schema: Schema): Model<T> {
  return mongoose.models[name]
    ? (mongoose.model<T>(name) as Model<T>)
    : mongoose.model<T>(name, schema);
}

// ─── User ─────────────────────────────────────────────────────────────────────

export interface IUser extends Document {
  name: string;
  email: string;
  mobile?: string;
  gender?: string;
  level: string;
  status: string;
  createdAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    mobile: String,
    gender: String,
    level: { type: String, default: 'BRONZE' },
    status: { type: String, default: 'ACTIVE' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export const User = model<IUser>('User', UserSchema);

// ─── Admin ────────────────────────────────────────────────────────────────────

export interface IAdmin extends Document {
  name: string;
  email: string;
  password: string;
  role: string;
  organisation?: string;
  status: string;
  createdAt: Date;
}

const AdminSchema = new Schema<IAdmin>(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: { type: String, required: true },
    organisation: String,
    status: { type: String, default: 'ACTIVE' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export const Admin = model<IAdmin>('Admin', AdminSchema);

// ─── Club ─────────────────────────────────────────────────────────────────────

export interface IClub extends Document {
  name: string;
  city: string;
  address?: string;
  contactInfo?: string;
  media?: object;
  status: string;
  createdAt: Date;
}

const ClubSchema = new Schema<IClub>(
  {
    name: { type: String, required: true },
    city: { type: String, required: true },
    address: String,
    contactInfo: String,
    media: Schema.Types.Mixed,
    status: { type: String, default: 'ACTIVE' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export const Club = model<IClub>('Club', ClubSchema);

// ─── Event ────────────────────────────────────────────────────────────────────

export interface IEvent extends Document {
  title: string;
  venueId?: string;
  dateTime: Date;
  hideEndTime: boolean;
  city: string;
  posterUrl?: string;
  landscapeUrl?: string;
  synopsis?: string;
  email?: string;
  phone?: string;
  ticketLink?: string;
  mediaGallery?: string[];
  musicGenre?: string;
  crowdType?: string;
  advertise: boolean;
  status: string;
  createdAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true },
    venueId: String,
    dateTime: { type: Date, required: true },
    hideEndTime: { type: Boolean, default: false },
    city: { type: String, required: true },
    posterUrl: String,
    landscapeUrl: String,
    synopsis: String,
    email: String,
    phone: String,
    ticketLink: String,
    mediaGallery: [String],
    musicGenre: String,
    crowdType: String,
    advertise: { type: Boolean, default: false },
    status: { type: String, default: 'UPCOMING' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export const Event = model<IEvent>('Event', EventSchema);

// ─── Ad ───────────────────────────────────────────────────────────────────────

export interface IAd extends Document {
  managerId?: string;
  title: string;
  date: Date;
  amount: number;
  status: string;
  createdAt: Date;
}

const AdSchema = new Schema<IAd>(
  {
    managerId: String,
    title: { type: String, required: true },
    date: { type: Date, default: Date.now },
    amount: { type: Number, default: 0 },
    status: { type: String, default: 'PENDING' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export const Ad = model<IAd>('Ad', AdSchema);

// ─── Broadcast ────────────────────────────────────────────────────────────────

export interface IBroadcast extends Document {
  type: string;
  message: string;
  audience?: object;
  createdAt: Date;
}

const BroadcastSchema = new Schema<IBroadcast>(
  {
    type: { type: String, required: true },
    message: { type: String, required: true },
    audience: Schema.Types.Mixed,
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export const Broadcast = model<IBroadcast>('Broadcast', BroadcastSchema);

// ─── Poll ─────────────────────────────────────────────────────────────────────

export interface IPoll extends Document {
  title: string;
  city: string;
  options: string[];
  endDate?: Date;
  status: string;
  votes: number;
  createdAt: Date;
}

const PollSchema = new Schema<IPoll>(
  {
    title: { type: String, required: true },
    city: { type: String, default: 'ALL' },
    options: [String],
    endDate: Date,
    status: { type: String, default: 'PENDING' },
    votes: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export const Poll = model<IPoll>('Poll', PollSchema);

// ─── Contest ──────────────────────────────────────────────────────────────────

export interface IContest extends Document {
  title: string;
  city?: string;
  rules?: string;
  reward?: string;
  deadline?: Date;
  status: string;
  participants: number;
  createdAt: Date;
}

const ContestSchema = new Schema<IContest>(
  {
    title: { type: String, required: true },
    city: String,
    rules: String,
    reward: String,
    deadline: Date,
    status: { type: String, default: 'PENDING' },
    participants: { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export const Contest = model<IContest>('Contest', ContestSchema);

// ─── Contest Participant ──────────────────────────────────────────────────────

export interface IContestParticipant extends Document {
  contestId: string;
  userId: string;
  submissionUrl?: string;
  status: string;
  createdAt: Date;
}

const ContestParticipantSchema = new Schema<IContestParticipant>(
  {
    contestId: { type: String, required: true },
    userId: { type: String, required: true },
    submissionUrl: String,
    status: { type: String, default: 'PENDING' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export const ContestParticipant = model<IContestParticipant>('ContestParticipant', ContestParticipantSchema);

// ─── Complaint ────────────────────────────────────────────────────────────────

export interface IComplaint extends Document {
  userId?: string;
  username?: string;
  subject?: string;
  message?: string;
  priority: string;
  status: string;
  createdAt: Date;
}

const ComplaintSchema = new Schema<IComplaint>(
  {
    userId: String,
    username: String,
    subject: String,
    message: String,
    priority: { type: String, default: 'MEDIUM' },
    status: { type: String, default: 'OPEN' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export const Complaint = model<IComplaint>('Complaint', ComplaintSchema);

// ─── Request ──────────────────────────────────────────────────────────────────

export interface IRequest extends Document {
  userId?: string;
  username?: string;
  subject?: string;
  message?: string;
  priority: string;
  status: string;
  createdAt: Date;
}

const RequestSchema = new Schema<IRequest>(
  {
    userId: String,
    username: String,
    subject: String,
    message: String,
    priority: { type: String, default: 'LOW' },
    status: { type: String, default: 'OPEN' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export const Request = model<IRequest>('Request', RequestSchema);

// ─── Activity Log ─────────────────────────────────────────────────────────────

export interface IActivityLog extends Document {
  adminId?: string;
  action: string;
  resource: string;
  details?: string;
  createdAt: Date;
}

const ActivityLogSchema = new Schema<IActivityLog>(
  {
    adminId: String,
    action: { type: String, required: true },
    resource: { type: String, required: true },
    details: String,
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export const ActivityLog = model<IActivityLog>('ActivityLog', ActivityLogSchema);

// ─── City ─────────────────────────────────────────────────────────────────────

export interface ICity extends Document {
  name: string;
  status: string;
  createdAt: Date;
}

const CitySchema = new Schema<ICity>(
  {
    name: { type: String, required: true, unique: true },
    status: { type: String, default: 'ACTIVE' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export const City = model<ICity>('City', CitySchema);

// ─── Genre ────────────────────────────────────────────────────────────────────

export interface IGenre extends Document {
  name: string;
  status: string;
  createdAt: Date;
}

const GenreSchema = new Schema<IGenre>(
  {
    name: { type: String, required: true, unique: true },
    status: { type: String, default: 'ACTIVE' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export const Genre = model<IGenre>('Genre', GenreSchema);

// ─── Event Type ───────────────────────────────────────────────────────────────

export interface IEventType extends Document {
  name: string;
  status: string;
  createdAt: Date;
}

const EventTypeSchema = new Schema<IEventType>(
  {
    name: { type: String, required: true, unique: true },
    status: { type: String, default: 'ACTIVE' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export const EventType = model<IEventType>('EventType', EventTypeSchema);

// ─── Venue Type ───────────────────────────────────────────────────────────────

export interface IVenueType extends Document {
  name: string;
  status: string;
  createdAt: Date;
}

const VenueTypeSchema = new Schema<IVenueType>(
  {
    name: { type: String, required: true, unique: true },
    status: { type: String, default: 'ACTIVE' },
  },
  { timestamps: { createdAt: 'createdAt', updatedAt: 'updatedAt' } }
);

export const VenueType = model<IVenueType>('VenueType', VenueTypeSchema);
