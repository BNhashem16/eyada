export const ROLES_KEY = 'roles';
export const IS_PUBLIC_KEY = 'isPublic';

export const RATE_LIMITS = {
  LOGIN: {
    ttl: 3600000, // 1 hour in ms
    limit: 10,
  },
  BOOKING: {
    ttl: 86400000, // 1 day in ms
    limit: 10,
  },
  API: {
    ttl: 3600000, // 1 hour in ms
    limit: 1000,
  },
};

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

export const BOOKING_NUMBER_PREFIX = 'APT';
