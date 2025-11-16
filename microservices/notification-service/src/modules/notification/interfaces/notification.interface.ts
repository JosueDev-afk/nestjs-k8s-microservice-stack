export interface INotification {
  id?: string;
  userId: string;
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, any>;
  read?: boolean;
  timestamp?: string;
}

export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  USER_ACTION = 'user_action',
  SYSTEM = 'system',
  PRODUCT_UPDATE = 'product_update',
  ORDER_STATUS = 'order_status',
}

export interface ISendNotificationDto {
  userId?: string;
  userIds?: string[];
  title: string;
  message: string;
  type: NotificationType;
  data?: Record<string, any>;
  broadcast?: boolean;
}
