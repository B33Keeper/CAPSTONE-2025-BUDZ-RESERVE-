import { Injectable, UnauthorizedException, ConflictException, NotFoundException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private mailerService: MailerService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (user && await this.usersService.verifyPassword(user, password)) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        name: user.name,
        age: user.age,
        sex: user.sex,
        contact_number: user.contact_number,
        profile_picture: user.profile_picture,
        role: user.role,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    try {
      const user = await this.usersService.create(registerDto);
      const { password, ...result } = user;
      
      const payload = { username: user.username, sub: user.id };
      return {
        access_token: this.jwtService.sign(payload),
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          name: user.name,
          age: user.age,
          sex: user.sex,
          contact_number: user.contact_number,
          profile_picture: user.profile_picture,
        },
      };
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      throw new ConflictException('Registration failed');
    }
  }

  async refreshToken(user: any) {
    const payload = { username: user.username, sub: user.id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async getProfile(userId: number) {
    return this.usersService.findOne(userId);
  }

  // Store OTPs temporarily (in production, use Redis or database)
  private otpStore = new Map<string, { otp: string; expiresAt: Date }>();

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto) {
    const { email } = forgotPasswordDto;
    
    // Check if user exists
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    // Check if SMTP is configured
    const smtpUser = this.configService.get('SMTP_USER');
    const smtpPass = this.configService.get('SMTP_PASS');
    const isDevelopment = this.configService.get('NODE_ENV') === 'development';
    
    if (!smtpUser || !smtpPass) {
      console.error('❌ SMTP credentials not configured. Cannot send email.');
      if (isDevelopment) {
        // In development, generate OTP and return it in response
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
        this.otpStore.set(email, { otp, expiresAt });
        
        console.log('=== DEVELOPMENT MODE - SMTP NOT CONFIGURED ===');
        console.log('Email:', email);
        console.log('OTP Code:', otp);
        console.log('Expires at:', expiresAt);
        console.log('==============================================');
        
        return { 
          message: 'SMTP not configured. OTP generated for development: ' + otp,
          otp: otp, // Include OTP in response for development
          development: true
        };
      } else {
        throw new BadRequestException('Email service is not configured. Please contact support.');
      }
    }

    // Generate 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Store OTP
    this.otpStore.set(email, { otp, expiresAt });

    // Send OTP via email
    try {
      await this.mailerService.sendMail({
        to: email,
        subject: 'Password Reset OTP - Budz Badminton',
        template: 'forgot-password',
        context: {
          otp,
          name: user.name || user.username,
        },
      });

      console.log('✅ Email sent successfully to:', email);
      return { message: 'OTP sent to your email address' };
    } catch (error: any) {
      // Log detailed error for debugging
      console.error('❌ Email sending failed:', error?.message || error);
      
      // Check if it's a connection timeout (Railway blocks SMTP)
      const isConnectionError = error?.code === 'ETIMEDOUT' || 
                                 error?.code === 'ECONNREFUSED' ||
                                 error?.message?.includes('timeout') ||
                                 error?.message?.includes('Connection timeout');
      
      if (isConnectionError) {
        console.warn('⚠️  SMTP connection blocked (likely Railway free plan). OTP will be returned in response.');
      }
      
      // In development or if connection fails, return OTP in response
      if (isDevelopment || isConnectionError) {
        console.log('=== DEVELOPMENT FALLBACK - EMAIL FAILED ===');
        console.log('Email:', email);
        console.log('User:', user.name || user.username);
        console.log('OTP Code:', otp);
        console.log('Expires at:', expiresAt);
        console.log('===========================================');
        
        return { 
          message: 'Email sending failed. OTP generated for development: ' + otp,
          otp: otp, // Include OTP in response for development
          development: true,
          error: error.message || 'Email service error'
        };
      } else {
        // In production, throw error
        throw new BadRequestException(
          'Failed to send OTP email. Please try again later or contact support.'
        );
      }
    }
  }

  async verifyOtp(verifyOtpDto: VerifyOtpDto) {
    const { email, otp } = verifyOtpDto;

    const storedOtp = this.otpStore.get(email);
    if (!storedOtp) {
      throw new BadRequestException('OTP not found or expired');
    }

    if (new Date() > storedOtp.expiresAt) {
      this.otpStore.delete(email);
      throw new BadRequestException('OTP has expired');
    }

    if (storedOtp.otp !== otp) {
      throw new BadRequestException('Invalid OTP');
    }

    return { message: 'OTP verified successfully' };
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto) {
    const { email, otp, newPassword } = resetPasswordDto;

    // Verify OTP first
    await this.verifyOtp({ email, otp });

    // Find user
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Update password
    await this.usersService.updatePassword(user.id, newPassword);

    // Remove OTP from store
    this.otpStore.delete(email);

    const updatedUser = await this.usersService.findOne(user.id);
    const payload = { username: updatedUser.username, sub: updatedUser.id };

    return {
      message: 'Password reset successfully',
      access_token: this.jwtService.sign(payload),
      user: {
        id: updatedUser.id,
        username: updatedUser.username,
        email: updatedUser.email,
        name: updatedUser.name,
        age: updatedUser.age,
        sex: updatedUser.sex,
        contact_number: updatedUser.contact_number,
        profile_picture: updatedUser.profile_picture,
        role: updatedUser.role,
      },
    };
  }
}
