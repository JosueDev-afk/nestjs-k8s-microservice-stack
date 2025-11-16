import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginDto } from '../user/dto/login.dto';
import { User } from '../user/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    try {
      const user = await this.userService.create(createUserDto);
      const payload = { email: user.email, sub: user.id, roles: user.roles };
      
      return {
        message: 'Usuario registrado exitosamente',
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          lastName: user.lastName,
          roles: user.roles,
          isActive: user.isActive,
          createdAt: user.createdAt,
        },
        access_token: this.jwtService.sign(payload),
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Error al registrar usuario');
    }
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    if (!user.isActive) {
      throw new UnauthorizedException('Usuario desactivado');
    }

    // Actualizar último login
    await this.userService.updateLastLogin(user.id);

    const payload = { email: user.email, sub: user.id, roles: user.roles };
    
    return {
      message: 'Login exitoso',
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        lastName: user.lastName,
        roles: user.roles,
        isActive: user.isActive,
        lastLogin: new Date(),
      },
      access_token: this.jwtService.sign(payload),
    };
  }

  async validateUser(email: string, password: string): Promise<User> {
    try {
      const user = await this.userService.findByEmail(email);
      
      if (user && (await user.validatePassword(password))) {
        return user;
      }
      
      throw new UnauthorizedException('Credenciales inválidas');
    } catch (error) {
      throw new UnauthorizedException('Credenciales inválidas');
    }
  }

  async validateToken(token: string) {
    try {
      const payload = this.jwtService.verify(token);
      const user = await this.userService.findOne(payload.sub);
      
      return {
        valid: true,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          roles: user.roles,
          isActive: user.isActive,
        },
      };
    } catch (error) {
      return {
        valid: false,
        message: 'Token inválido o expirado',
      };
    }
  }
}
