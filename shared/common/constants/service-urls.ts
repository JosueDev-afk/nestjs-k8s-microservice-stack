export const SERVICE_URLS = {
  API_GATEWAY: process.env.API_GATEWAY_URL || 'http://localhost:3000',
  USER_SERVICE: process.env.USER_SERVICE_URL || 'http://localhost:3001',
  PRODUCT_SERVICE: process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002',
  NOTIFICATION_SERVICE: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3003',
} as const;

export const SERVICE_PORTS = {
  API_GATEWAY: 3000,
  USER_SERVICE: 3001,
  PRODUCT_SERVICE: 3002,
  NOTIFICATION_SERVICE: 3003,
} as const;
