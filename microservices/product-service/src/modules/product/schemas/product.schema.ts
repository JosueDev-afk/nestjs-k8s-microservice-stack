import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ timestamps: true })
export class Review {
  @Prop({ required: true })
  userId: string;

  @Prop({ required: true })
  userName: string;

  @Prop({ required: true, min: 1, max: 5 })
  rating: number;

  @Prop({ required: true })
  comment: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

@Schema({ timestamps: true })
export class Product {
  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true, unique: true })
  sku: string;

  @Prop({ required: true, min: 0 })
  price: number;

  @Prop({ min: 0, default: 0 })
  comparePrice?: number;

  @Prop({ required: true, min: 0 })
  stock: number;

  @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
  categoryId: Types.ObjectId;

  @Prop({ type: [String], default: [] })
  images: string[];

  @Prop({ type: [String], default: [] })
  tags: string[];

  @Prop({ default: true })
  isActive: boolean;

  @Prop({ default: false })
  isFeatured: boolean;

  @Prop({ type: Object })
  specifications?: Record<string, any>;

  @Prop({ type: Object })
  seoData?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };

  @Prop({ type: [Review], default: [] })
  reviews: Review[];

  @Prop({ default: 0, min: 0, max: 5 })
  averageRating: number;

  @Prop({ default: 0 })
  totalReviews: number;

  @Prop({ default: 0 })
  totalSales: number;

  @Prop({ default: 0 })
  views: number;
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Índices para optimización
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ categoryId: 1 });
ProductSchema.index({ sku: 1 });
ProductSchema.index({ price: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ isFeatured: 1 });
ProductSchema.index({ averageRating: -1 });
ProductSchema.index({ totalSales: -1 });
ProductSchema.index({ createdAt: -1 });
