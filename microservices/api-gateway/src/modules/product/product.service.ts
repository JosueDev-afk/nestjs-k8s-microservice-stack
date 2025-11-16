import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class ProductService {
  private readonly productServiceUrl = process.env.PRODUCT_SERVICE_URL || 'http://localhost:3002';

  constructor(private readonly httpService: HttpService) {}

  async findAll(query: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.productServiceUrl}/products`, { params: query })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Error al obtener productos del microservicio',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async findOne(id: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.productServiceUrl}/products/${id}`)
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException('Producto no encontrado', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Error al obtener producto del microservicio',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async create(createProductDto: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.productServiceUrl}/products`, createProductDto)
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 400) {
        throw new HttpException(error.response.data.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        'Error al crear producto en el microservicio',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async update(id: string, updateProductDto: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.put(`${this.productServiceUrl}/products/${id}`, updateProductDto)
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException('Producto no encontrado', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Error al actualizar producto en el microservicio',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async remove(id: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.delete(`${this.productServiceUrl}/products/${id}`)
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException('Producto no encontrado', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Error al eliminar producto del microservicio',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async findByCategory(category: string, query: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.productServiceUrl}/products/category/${category}`, { params: query })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Error al obtener productos por categoría del microservicio',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async addReview(id: string, reviewDto: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.productServiceUrl}/products/${id}/reviews`, reviewDto)
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException('Producto no encontrado', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Error al agregar reseña en el microservicio',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }
}
