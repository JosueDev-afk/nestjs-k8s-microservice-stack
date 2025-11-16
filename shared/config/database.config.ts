export interface DatabaseConfig {
  type: 'postgres' | 'mongodb' | 'redis';
  host: string;
  port: number;
  username?: string;
  password?: string;
  database: string;
  uri?: string;
}

export const databaseConfigs = {
  postgres: {
    type: 'postgres' as const,
    host: process.env.DATABASE_HOST || 'localhost',
    port: parseInt(process.env.DATABASE_PORT) || 5432,
    username: process.env.DATABASE_USER || 'postgres',
    password: process.env.DATABASE_PASSWORD || 'postgres123',
    database: process.env.DATABASE_NAME || 'userdb',
  },
  
  mongodb: {
    type: 'mongodb' as const,
    uri: process.env.MONGODB_URI || 'mongodb://mongo:mongo123@localhost:27017/productdb?authSource=admin',
  },
  
  redis: {
    type: 'redis' as const,
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT) || 6379,
    password: process.env.REDIS_PASSWORD || 'redis123',
  },
};
