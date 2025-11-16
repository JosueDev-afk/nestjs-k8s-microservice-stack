import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ProductService } from './product.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('products')
export class ProductController {
  constructor(private readonly productService: ProductService) {}

  @Get()
  async findAll(@Query() query: any) {
    return this.productService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.productService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() createProductDto: any) {
    return this.productService.create(createProductDto);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() updateProductDto: any) {
    return this.productService.update(id, updateProductDto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  async remove(@Param('id') id: string) {
    return this.productService.remove(id);
  }

  @Get('category/:category')
  async findByCategory(@Param('category') category: string, @Query() query: any) {
    return this.productService.findByCategory(category, query);
  }

  @Post(':id/reviews')
  @UseGuards(JwtAuthGuard)
  async addReview(@Param('id') id: string, @Body() reviewDto: any) {
    return this.productService.addReview(id, reviewDto);
  }
}
