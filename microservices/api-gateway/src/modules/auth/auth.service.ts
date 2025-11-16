import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { JwtService } from '@nestjs/jwt';
import { firstValueFrom } from 'rxjs';

@Injectable()
export class AuthService {
  private readonly userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3001';

  constructor(
    private readonly httpService: HttpService,
    private readonly jwtService: JwtService,
  ) {}

  async login(loginDto: { email: string; password: string }) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.userServiceUrl}/auth/login`, loginDto)
      );
      
      const user = response.data.user;
      const payload = { email: user.email, sub: user.id, roles: user.roles };
      
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
        },
      };
    } catch (error) {
      if (error.response?.status === 401) {
        throw new HttpException('Credenciales inválidas', HttpStatus.UNAUTHORIZED);
      }
      throw new HttpException(
        'Error en el servicio de autenticación',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async register(registerDto: any) {
    try {
      const response = await firstValueFrom(
        this.httpService.post(`${this.userServiceUrl}/auth/register`, registerDto)
      );
      
      const user = response.data.user;
      const payload = { email: user.email, sub: user.id, roles: user.roles };
      
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
        },
      };
    } catch (error) {
      if (error.response?.status === 400) {
        throw new HttpException(error.response.data.message, HttpStatus.BAD_REQUEST);
      }
      throw new HttpException(
        'Error al registrar usuario',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async getProfile(userId: string) {
    try {
      const response = await firstValueFrom(
        this.httpService.get(`${this.userServiceUrl}/users/${userId}`)
      );
      return response.data;
    } catch (error) {
      throw new HttpException(
        'Error al obtener perfil de usuario',
        HttpStatus.SERVICE_UNAVAILABLE
      );
    }
  }

  async refreshToken(user: any) {
    const payload = { email: user.email, sub: user.id, roles: user.roles };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }
}
