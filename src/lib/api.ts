// ISSUE 11 FIX: centralised API route strings — single source of truth.
// Every fetch() must import from here, never hardcode a path string.

export const ROUTES = {
  auth: {
    login:             '/auth/login',
    verify2fa:         '/auth/verify-2fa',
    forgotPassword:    '/auth/forget_password',
    resetPassword:     '/auth/forget_new_password',
    registerOrganiser: '/auth/register-organiser',
  },
  users: {
    list:         '/user/get_all_user',
    changeStatus: (id: string) => '/users/change_Status/' + id,
  },
  events: {
    list:      '/events/list',
    create:    '/events/create_event',
    update:    (id: string) => '/events/update_event/' + id,
    delete:    (id: string) => '/events/delete_event/' + id,
    feature:   (id: string) => '/events/feature/' + id,
    unfeature: (id: string) => '/events/unfeature/' + id,
    featured:  '/events/featured',
  },
  vendors: {
    list:     '/vendor/get_all_vendors',
    myStatus: '/vendor/my-status',
  },
  venues: {
    list:      '/venue/get_all_venues',
    create:    '/venue/create_venue',
    update:    (id: string) => '/venue/update_venue/' + id,
    feature:   (id: string) => '/venue/feature/' + id,
    unfeature: (id: string) => '/venue/unfeature/' + id,
    featured:  '/venue/featured',
  },
  cities:     { list: '/city/get_all_cities' },
  genres:     { list: '/genre/get_all_genres' },
  categories: { list: '/category/get_category' },
  ads: {
    list:   '/ads/get_all',
    stats:  '/ads/stats',
    create: '/ads/create',
    update: (id: string) => '/ads/update/' + id,
    delete: (id: string) => '/ads/delete/' + id,
  },
  broadcast: {
    send:    '/broadcast/send_user_notification',
    history: '/broadcast/history',
  },
} as const;
