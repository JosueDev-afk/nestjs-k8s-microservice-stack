import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsOptional,
  IsArray,
  IsBoolean,
  IsObject,
  Min,
  IsMongoId,
} from 'class-validator';

export class CreateProductDto {
  @IsNotEmpty({ message: 'El nombre es requerido' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  name: string;

  @IsNotEmpty({ message: 'La descripción es requerida' })
  @IsString({ message: 'La descripción debe ser una cadena de texto' })
  description: string;

  @IsNotEmpty({ message: 'El SKU es requerido' })
  @IsString({ message: 'El SKU debe ser una cadena de texto' })
  sku: string;

  @IsNotEmpty({ message: 'El precio es requerido' })
  @IsNumber({}, { message: 'El precio debe ser un número' })
  @Min(0, { message: 'El precio debe ser mayor o igual a 0' })
  price: number;

  @IsOptional()
  @IsNumber({}, { message: 'El precio de comparación debe ser un número' })
  @Min(0, { message: 'El precio de comparación debe ser mayor o igual a 0' })
  comparePrice?: number;

  @IsNotEmpty({ message: 'El stock es requerido' })
  @IsNumber({}, { message: 'El stock debe ser un número' })
  @Min(0, { message: 'El stock debe ser mayor o igual a 0' })
  stock: number;

  @IsNotEmpty({ message: 'El ID de categoría es requerido' })
  @IsMongoId({ message: 'El ID de categoría debe ser un ObjectId válido' })
  categoryId: string;

  @IsOptional()
  @IsArray({ message: 'Las imágenes deben ser un array' })
  images?: string[];

  @IsOptional()
  @IsArray({ message: 'Las etiquetas deben ser un array' })
  tags?: string[];

  @IsOptional()
  @IsBoolean({ message: 'isActive debe ser un valor booleano' })
  isActive?: boolean;

  @IsOptional()
  @IsBoolean({ message: 'isFeatured debe ser un valor booleano' })
  isFeatured?: boolean;

  @IsOptional()
  @IsObject({ message: 'Las especificaciones deben ser un objeto' })
  specifications?: Record<string, any>;

  @IsOptional()
  @IsObject({ message: 'Los datos SEO deben ser un objeto' })
  seoData?: {
    title?: string;
    description?: string;
    keywords?: string[];
  };
}
