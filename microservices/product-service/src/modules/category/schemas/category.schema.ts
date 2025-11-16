import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
  @Prop({ required: true, unique: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, unique: true })
  slug: string;

  @Prop({ default: true })
  isActive: boolean;

  @Prop()
  image?: string;

  @Prop({ type: Object })
  metadata?: Record<string, any>;
}

export const CategorySchema = SchemaFactory.createForClass(Category);
