export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  statusCode?: number;
  timestamp?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ServiceHealth {
  status: 'ok' | 'error';
  service: string;
  timestamp: string;
  uptime: number;
  database?: string;
  websockets?: string;
  redis?: string;
}
