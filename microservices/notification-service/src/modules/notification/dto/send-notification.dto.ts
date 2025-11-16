import {
  IsNotEmpty,
  IsString,
  IsOptional,
  IsArray,
  IsBoolean,
  IsEnum,
  IsObject,
} from 'class-validator';
import { NotificationType } from '../interfaces/notification.interface';

export class SendNotificationDto {
  @IsOptional()
  @IsString({ message: 'El ID de usuario debe ser una cadena de texto' })
  userId?: string;

  @IsOptional()
  @IsArray({ message: 'Los IDs de usuarios deben ser un array' })
  userIds?: string[];

  @IsNotEmpty({ message: 'El título es requerido' })
  @IsString({ message: 'El título debe ser una cadena de texto' })
  title: string;

  @IsNotEmpty({ message: 'El mensaje es requerido' })
  @IsString({ message: 'El mensaje debe ser una cadena de texto' })
  message: string;

  @IsNotEmpty({ message: 'El tipo es requerido' })
  @IsEnum(NotificationType, { message: 'El tipo debe ser un valor válido' })
  type: NotificationType;

  @IsOptional()
  @IsObject({ message: 'Los datos adicionales deben ser un objeto' })
  data?: Record<string, any>;

  @IsOptional()
  @IsBoolean({ message: 'broadcast debe ser un valor booleano' })
  broadcast?: boolean;
}
