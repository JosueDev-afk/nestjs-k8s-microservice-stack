import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class UserService {
  private readonly userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';

  constructor(private readonly httpService: HttpService) {}

  async findAll(query: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.userServiceUrl}/users`, { params: query })
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Error al obtener usuarios del microservicio',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async findOne(id: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.userServiceUrl}/users/${id}`)
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Error al obtener usuario del microservicio',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async create(createUserDto: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.userServiceUrl}/users`, createUserDto)
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 400) {
        throw new HttpException(error.response.data.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        'Error al crear usuario en el microservicio',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async update(id: string, updateUserDto: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.put(`${this.userServiceUrl}/users/${id}`, updateUserDto)
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Error al actualizar usuario en el microservicio',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async remove(id: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.delete(`${this.userServiceUrl}/users/${id}`)
      );
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new HttpException('Usuario no encontrado', HttpStatus.NOT_FOUND);
      }
      throw new HttpException(
        'Error al eliminar usuario del microservicio',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }
}
