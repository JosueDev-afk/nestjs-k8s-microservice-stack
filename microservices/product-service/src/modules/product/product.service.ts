import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { AddReviewDto } from './dto/add-review.dto';
import { Product, ProductDocument } from './schemas/product.schema';
import { CategoryService } from '../category/category.service';

interface FindAllOptions {
  page: number;
  limit: number;
  search?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  featured?: boolean;
  active?: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

@Injectable()
export class ProductService {
  constructor(
    @InjectModel(Product.name)
    private productModel: Model<ProductDocument>,
    private categoryService: CategoryService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    // Verificar si el SKU ya existe
    const existingSku = await this.productModel.findOne({
      sku: createProductDto.sku,
    });

    if (existingSku) {
      throw new ConflictException('Ya existe un producto con ese SKU');
    }

    // Verificar que la categoría existe
    await this.categoryService.findOne(createProductDto.categoryId);

    const product = new this.productModel({
      ...createProductDto,
      categoryId: new Types.ObjectId(createProductDto.categoryId),
    });

    return product.save();
  }

  async findAll(options: FindAllOptions) {
    const {
      page,
      limit,
      search,
      category,
      minPrice,
      maxPrice,
      featured,
      active,
      sortBy,
      sortOrder,
    } = options;

    const skip = (page - 1) * limit;
    const filter: any = {};

    // Filtro de búsqueda por texto
    if (search) {
      filter.$text = { $search: search };
    }

    // Filtro por categoría
    if (category) {
      filter.categoryId = new Types.ObjectId(category);
    }

    // Filtro por rango de precios
    if (minPrice !== undefined || maxPrice !== undefined) {
      filter.price = {};
      if (minPrice !== undefined) filter.price.$gte = minPrice;
      if (maxPrice !== undefined) filter.price.$lte = maxPrice;
    }

    // Filtro por productos destacados
    if (featured !== undefined) {
      filter.isFeatured = featured;
    }

    // Filtro por productos activos
    if (active !== undefined) {
      filter.isActive = active;
    }

    // Configurar ordenamiento
    const sortOptions: any = {};
    sortOptions[sortBy] = sortOrder === 'asc' ? 1 : -1;

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('categoryId', 'name slug')
        .skip(skip)
        .limit(limit)
        .sort(sortOptions)
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Product> {
    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('ID de producto inválido');
    }

    const product = await this.productModel
      .findById(id)
      .populate('categoryId', 'name slug')
      .exec();

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  async findBySku(sku: string): Promise<Product> {
    const product = await this.productModel
      .findOne({ sku })
      .populate('categoryId', 'name slug')
      .exec();

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  async findByCategory(categoryId: string, page: number = 1, limit: number = 10) {
    if (!Types.ObjectId.isValid(categoryId)) {
      throw new BadRequestException('ID de categoría inválido');
    }

    // Verificar que la categoría existe
    await this.categoryService.findOne(categoryId);

    const skip = (page - 1) * limit;
    const filter = {
      categoryId: new Types.ObjectId(categoryId),
      isActive: true,
    };

    const [products, total] = await Promise.all([
      this.productModel
        .find(filter)
        .populate('categoryId', 'name slug')
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.productModel.countDocuments(filter),
    ]);

    return {
      data: products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    // Si se está actualizando el SKU, verificar que no exista
    if (updateProductDto.sku && updateProductDto.sku !== product.sku) {
      const existingSku = await this.productModel.findOne({
        sku: updateProductDto.sku,
        _id: { $ne: id },
      });

      if (existingSku) {
        throw new ConflictException('Ya existe un producto con ese SKU');
      }
    }

    // Si se está actualizando la categoría, verificar que existe
    if (updateProductDto.categoryId) {
      await this.categoryService.findOne(updateProductDto.categoryId);
      updateProductDto.categoryId = new Types.ObjectId(updateProductDto.categoryId) as any;
    }

    const updatedProduct = await this.productModel
      .findByIdAndUpdate(id, updateProductDto, { new: true })
      .populate('categoryId', 'name slug')
      .exec();

    if (!updatedProduct) {
      throw new NotFoundException('Producto no encontrado');
    }

    return updatedProduct;
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productModel.findByIdAndDelete(id).exec();
  }

  async addReview(id: string, addReviewDto: AddReviewDto): Promise<Product> {
    const product = await this.productModel.findById(id).exec();
    
    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    // Verificar si el usuario ya ha dejado una reseña
    const existingReview = product.reviews.find(
      (review) => review.userId === addReviewDto.userId,
    );

    if (existingReview) {
      throw new ConflictException('El usuario ya ha dejado una reseña para este producto');
    }

    // Agregar la nueva reseña
    const newReview = {
      ...addReviewDto,
      createdAt: new Date(),
    };

    product.reviews.push(newReview as any);

    // Recalcular la calificación promedio
    const totalRating = product.reviews.reduce((sum, review) => sum + review.rating, 0);
    product.averageRating = Math.round((totalRating / product.reviews.length) * 10) / 10;
    product.totalReviews = product.reviews.length;

    return await product.save();
  }

  async updateStock(id: string, quantity: number): Promise<Product> {
    if (quantity < 0) {
      throw new BadRequestException('La cantidad no puede ser negativa');
    }

    const product = await this.productModel
      .findByIdAndUpdate(id, { stock: quantity }, { new: true })
      .populate('categoryId', 'name slug')
      .exec();

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  async incrementViews(id: string): Promise<Product> {
    const product = await this.productModel
      .findByIdAndUpdate(id, { $inc: { views: 1 } }, { new: true })
      .populate('categoryId', 'name slug')
      .exec();

    if (!product) {
      throw new NotFoundException('Producto no encontrado');
    }

    return product;
  }

  async getFeatured(limit: number = 10): Promise<Product[]> {
    return this.productModel
      .find({ isFeatured: true, isActive: true })
      .populate('categoryId', 'name slug')
      .limit(limit)
      .sort({ createdAt: -1 })
      .exec();
  }

  async getPopular(limit: number = 10): Promise<Product[]> {
    return this.productModel
      .find({ isActive: true })
      .populate('categoryId', 'name slug')
      .limit(limit)
      .sort({ totalSales: -1, views: -1 })
      .exec();
  }
}
