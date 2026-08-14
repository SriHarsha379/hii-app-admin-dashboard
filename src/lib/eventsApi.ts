/**
 * eventsApi.ts
 *
 * Adapter between the admin dashboard's event form and the real backend
 * contract in routes/admin/eventRoute.js + controller/admin/eventController.js.
 *
 * ─── WHY THIS FILE EXISTS ────────────────────────────────────────────────────
 * The dashboard was written against an API that does not exist. Three
 * separate mismatches, all producing 404s or validation failures:
 *
 *   1. PATHS. Dashboard called `POST /events` and `PUT /events/:id`.
 *      Backend only registers `POST /events/create_event` and
 *      `PUT /events/update_event/:id`. The `/events` prefix itself is fine -
 *      routes/admin/index.js aliases `/event` and `/events` to the same
 *      router - but there is no handler at the router root, so it 404s.
 *
 *   2. BODY FORMAT. Dashboard sent JSON. The backend routes are wrapped in
 *      multer `upload.fields([...])` and the controller reads files from
 *      `req.files` and nested data from JSON-*strings* in `req.body`, which
 *      it then JSON.parse()s. JSON bodies leave req.files undefined, so
 *      `venue_image` comes back "" and the controller rejects with
 *      "Please fill all required fields".
 *
 *   3. NO UPLOAD ENDPOINT. Dashboard pre-uploaded each image to
 *      `POST /admin/upload` and expected a URL back. No such route exists
 *      anywhere in the backend. Uploads are attached directly to the
 *      create/update multipart request. This is why the review step showed
 *      "Poster: ✗ Missing" - all three upload calls 404'd.
 *
 * Plus a field-name mismatch throughout:
 *
 *   dashboard        backend (Event model)
 *   ─────────        ─────────────────────
 *   title       ->   venue_name
 *   description ->   about
 *   date        ->   start_date (+ end_date, string "YYYY-MM-DD")
 *   city_id     ->   city_id            (same)
 *   venue_id    ->   vendor_id
 *   genre       ->   (no direct field - see note below)
 *   event_type  ->   category_ids       (JSON string of ObjectIds)
 *   poster_url  ->   venue_image        (FILE, not URL)
 *   landscape_urls -> gallery_images    (FILES, not URLs)
 *
 * NOTE ON GENRES: the Event model has no genre field at all. Genres exist on
 * User (music_genre) and as a standalone Genre collection, but events are
 * categorised via category_ids only. The dashboard's genre picker currently
 * has nowhere to write to. This adapter drops it rather than silently
 * inventing a field. Adding `genre_ids` to eventModel.js is a backend change
 * - flagged, not done here.
 *
 * ─── DATE FORMAT WARNING ─────────────────────────────────────────────────────
 * Event.start_date / end_date are plain Strings, and feedController.js filters
 * with `e.end_date >= today` - a STRING comparison against a "YYYY-MM-DD"
 * value. Dates MUST be zero-padded YYYY-MM-DD or events silently vanish from
 * the app feed. toYMD() below enforces this.
 */

import { API_BASE } from './apiConfig';

/* ============================================================
 * TYPES
 * ============================================================ */

export interface EventFormPayload {
  id?: string;
  _id?: string;
  title: string;
  description: string;
  date: string;
  end_date?: string;
  is_multi_day?: boolean;
  start_time: string;
  end_time: string;
  city_id: string;
  venue_id: string;              // this is really the vendor id
  event_type: string[];          // category ids
  address?: string;
  latitude?: number | string;
  longitude?: number | string;
  artists?: { name: string; title?: string; subtitle?: string }[];
  faqs?: { question: string; answer: string }[];
  terms_and_conditions?: string[];
  prohibited_items?: string[];
  // Files, not URLs - collected by the upload zones
  poster_file?: File | null;         // -> venue_image
  gallery_files?: File[];            // -> gallery_images (max 10)
  artist_files?: File[];             // -> artist_images (index-matched to artists)
  layout_files?: File[];             // -> event_layout_images
  // Existing remote paths, preserved on edit when no new file is chosen
  existing_gallery_images?: string[];
  existing_event_layout_images?: { image_url: string }[];
}

/* ============================================================
 * HELPERS
 * ============================================================ */

/** Zero-padded YYYY-MM-DD. Accepts a Date, an ISO string, or "YYYY-MM-DD". */
export function toYMD(value: string | Date): string {
  if (!value) return '';
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/**
 * Builds the multipart body the backend actually expects.
 *
 * Scalars go in as plain strings. Nested structures go in as JSON *strings*
 * because the controller calls JSON.parse() on each of category_ids, artists,
 * faqs, prohibited_items and terms_and_conditions.
 */
export function buildEventFormData(p: EventFormPayload): FormData {
  const fd = new FormData();

  const startDate = toYMD(p.date);
  const isMulti = Boolean(p.is_multi_day && p.end_date);
  const endDate = isMulti ? toYMD(p.end_date!) : startDate;

  fd.append('venue_name', p.title ?? '');
  fd.append('about', p.description ?? '');
  fd.append('start_date', startDate);
  fd.append('end_date', endDate);
  fd.append('is_multi_day', String(isMulti));
  fd.append('start_time', p.start_time ?? '');
  fd.append('end_time', p.end_time ?? '');
  fd.append('address', p.address ?? '');

  if (p.city_id) fd.append('city_id', p.city_id);

  // Controller reads latitude/longitude and stores them as Numbers.
  // It checks `latitude === undefined`, so send "" rather than omitting
  // only if you want it to fail loudly; here we send 0 as a safe default.
  fd.append('latitude', String(p.latitude ?? 0));
  fd.append('longitude', String(p.longitude ?? 0));

  // ── JSON-encoded nested fields ──
  fd.append('category_ids', JSON.stringify(p.event_type ?? []));
  fd.append('artists', JSON.stringify(p.artists ?? []));
  fd.append('faqs', JSON.stringify(p.faqs ?? []));
  fd.append('prohibited_items', JSON.stringify((p.prohibited_items ?? []).map((item) => ({ item }))));
  fd.append('terms_and_conditions', JSON.stringify((p.terms_and_conditions ?? []).map((item) => ({ item }))));

  // ── Files ──
  // Field names must match upload.fields() in eventRoute.js exactly, or
  // multer rejects the request with "Unexpected field".
  if (p.poster_file) fd.append('venue_image', p.poster_file);

  (p.gallery_files ?? []).slice(0, 10).forEach((f) => fd.append('gallery_images', f));

  // artists[i].image is matched to artist_images[i] BY ARRAY INDEX in the
  // controller. Order matters, and a missing file shifts every later artist's
  // image. Upload one file per artist, in the same order as the artists array.
  (p.artist_files ?? []).slice(0, 20).forEach((f) => fd.append('artist_images', f));

  // NOTE: eventRoute.js declares event_layout_images with maxCount: 1 even
  // though the model stores an array. Only the first file will survive until
  // that route is widened.
  (p.layout_files ?? []).forEach((f) => fd.append('event_layout_images', f));

  // On update, the controller preserves existing images only if you echo them
  // back as JSON strings.
  if (p.existing_gallery_images) {
    fd.append('existing_gallery_images', JSON.stringify(p.existing_gallery_images));
  }
  if (p.existing_event_layout_images) {
    fd.append('existing_event_layout_images', JSON.stringify(p.existing_event_layout_images));
  }

  return fd;
}

/* ============================================================
 * REQUESTS
 * ============================================================ */

async function send(url: string, method: 'POST' | 'PUT', fd: FormData, token: string) {
  const res = await fetch(url, {
    method,
    // Do NOT set Content-Type. The browser must set it itself so it can add
    // the multipart boundary; setting it manually breaks multer parsing.
    headers: { Authorization: `Bearer ${token}` },
    body: fd,
  });
  const json = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(json.message || `Request failed (${res.status})`);
  return json;
}

export function createEvent(payload: EventFormPayload, token: string) {
  return send(`${API_BASE}/events/create_event`, 'POST', buildEventFormData(payload), token);
}

export function updateEvent(payload: EventFormPayload, token: string) {
  const id = payload._id || payload.id;
  if (!id) throw new Error('Missing event id');
  return send(`${API_BASE}/events/update_event/${id}`, 'PUT', buildEventFormData(payload), token);
}

export async function deleteEvent(id: string, token: string) {
  const res = await fetch(`${API_BASE}/events/delete_event/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  const json = await res.json().catch(() => ({} as any));
  if (!res.ok) throw new Error(json.message || 'Failed to delete event');
  return json;
}

/* ============================================================
 * VENDORS (CLUBS)
 * ============================================================
 * Backend contract - routes/admin/vendorRoute.js:
 *   POST /vendor/add_vendor          upload.single("business_image")
 *   PUT  /vendor/update_vendor/:id   upload.single("business_image")
 *
 * The dashboard was calling POST/PUT /mongo/vendors with JSON - that prefix
 * is not mounted anywhere in routes/admin/index.js, hence 404.
 *
 * createVendor() in vendorController.js hard-requires ALL of:
 *   name, email, phone_number, city, state, address, password, vendor_type
 * and rejects vendor_type outside ['owner', 'event_organizer'].
 *
 * NOTE: `city` and `state` must be ObjectIds (Vendor schema refs City/State),
 * not display names. `state` is easy to miss because the club form has no
 * state picker - derive it from the selected city's state_id.
 */

export interface VendorFormPayload {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  phone_number: string;
  city: string;                  // City ObjectId
  state: string;                 // State ObjectId
  address: string;
  landmark?: string;
  password?: string;             // required on create only
  vendor_type: 'owner' | 'event_organizer';
  business_image_file?: File | null;
}

export function buildVendorFormData(p: VendorFormPayload): FormData {
  const fd = new FormData();
  fd.append('name', p.name ?? '');
  fd.append('email', p.email ?? '');
  fd.append('phone_number', p.phone_number ?? '');
  fd.append('city', p.city ?? '');
  fd.append('state', p.state ?? '');
  fd.append('address', p.address ?? '');
  fd.append('landmark', p.landmark ?? '');
  fd.append('vendor_type', p.vendor_type ?? 'owner');
  // Only send a password when one was actually entered - on update, an empty
  // string would overwrite the stored hash.
  if (p.password) fd.append('password', p.password);
  if (p.business_image_file) fd.append('business_image', p.business_image_file);
  return fd;
}

export function createVendor(payload: VendorFormPayload, token: string) {
  return send(`${API_BASE}/vendor/add_vendor`, 'POST', buildVendorFormData(payload), token);
}

export function updateVendor(payload: VendorFormPayload, token: string) {
  const id = payload._id || payload.id;
  if (!id) throw new Error('Missing vendor id');
  return send(`${API_BASE}/vendor/update_vendor/${id}`, 'PUT', buildVendorFormData(payload), token);
}