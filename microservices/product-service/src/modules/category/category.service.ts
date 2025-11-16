import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { Category, CategoryDocument } from './schemas/category.schema';

@Injectable()
export class CategoryService {
  constructor(
    @InjectModel(Category.name)
    private categoryModel: Model<CategoryDocument>,
  ) {}

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    // Verificar si el nombre ya existe
    const existingByName = await this.categoryModel.findOne({
      name: createCategoryDto.name,
    });

    if (existingByName) {
      throw new ConflictException('Ya existe una categoría con ese nombre');
    }

    // Verificar si el slug ya existe
    const existingBySlug = await this.categoryModel.findOne({
      slug: createCategoryDto.slug,
    });

    if (existingBySlug) {
      throw new ConflictException('Ya existe una categoría con ese slug');
    }

    const category = new this.categoryModel(createCategoryDto);
    return category.save();
  }

  async findAll(page: number = 1, limit: number = 10, search?: string, active?: boolean) {
    const skip = (page - 1) * limit;
    const filter: any = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    if (active !== undefined) {
      filter.isActive = active;
    }

    const [categories, total] = await Promise.all([
      this.categoryModel
        .find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .exec(),
      this.categoryModel.countDocuments(filter),
    ]);

    return {
      data: categories,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoryModel.findById(id).exec();

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return category;
  }

  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryModel.findOne({ slug }).exec();

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return category;
  }

  async update(id: string, updateCategoryDto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    // Si se está actualizando el nombre, verificar que no exista
    if (updateCategoryDto.name && updateCategoryDto.name !== category.name) {
      const existingByName = await this.categoryModel.findOne({
        name: updateCategoryDto.name,
        _id: { $ne: id },
      });

      if (existingByName) {
        throw new ConflictException('Ya existe una categoría con ese nombre');
      }
    }

    // Si se está actualizando el slug, verificar que no exista
    if (updateCategoryDto.slug && updateCategoryDto.slug !== category.slug) {
      const existingBySlug = await this.categoryModel.findOne({
        slug: updateCategoryDto.slug,
        _id: { $ne: id },
      });

      if (existingBySlug) {
        throw new ConflictException('Ya existe una categoría con ese slug');
      }
    }

    const updatedCategory = await this.categoryModel
      .findByIdAndUpdate(id, updateCategoryDto, { new: true })
      .exec();

    if (!updatedCategory) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return updatedCategory;
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoryModel.findByIdAndDelete(id).exec();
  }

  async activate(id: string): Promise<Category> {
    const category = await this.categoryModel
      .findByIdAndUpdate(id, { isActive: true }, { new: true })
      .exec();

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return category;
  }

  async deactivate(id: string): Promise<Category> {
    const category = await this.categoryModel
      .findByIdAndUpdate(id, { isActive: false }, { new: true })
      .exec();

    if (!category) {
      throw new NotFoundException('Categoría no encontrada');
    }

    return category;
  }
}
