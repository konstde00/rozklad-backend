import { Controller, Post, Body, Put, UnauthorizedException, NotFoundException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginUserDto } from './dto/login-user.dto';

@Controller('/v1/auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  async signup(@Body() createUserDto: CreateUserDto) {
    return await this.authService.signup(createUserDto);
  }

  @Post('login')
  async login(@Body() loginUserDto: LoginUserDto) {
    return this.authService.login(loginUserDto.email, loginUserDto.password);
  }

  @Post('confirm')
  async confirmSignup(@Body() body: { email: string; code: string }) {
    return await this.authService.confirmSignup(body.email, body.code);
  }

  @Put('change-password')
  async changePassword(@Body() body: { id: number; old_password: string; password: string }) {
    return await this.authService.changePassword(body.id, body.old_password, body.password);
  }

  @Post('logout')
  async logout() {
    return await this.authService.logout();
  }
}
