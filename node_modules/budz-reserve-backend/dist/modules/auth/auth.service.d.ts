import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { MailerService } from '@nestjs-modules/mailer';
import { UsersService } from '../users/users.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
export declare class AuthService {
    private usersService;
    private jwtService;
    private configService;
    private mailerService;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, mailerService: MailerService);
    validateUser(username: string, password: string): Promise<any>;
    login(loginDto: LoginDto): Promise<{
        access_token: string;
        user: {
            id: any;
            username: any;
            email: any;
            name: any;
            age: any;
            sex: any;
            contact_number: any;
            profile_picture: any;
            role: any;
        };
    }>;
    register(registerDto: RegisterDto): Promise<{
        access_token: string;
        user: {
            id: number;
            username: string;
            email: string;
            name: string;
            age: number;
            sex: import("../users/entities/user.entity").Gender;
            contact_number: string;
            profile_picture: string;
        };
    }>;
    refreshToken(user: any): Promise<{
        access_token: string;
    }>;
    getProfile(userId: number): Promise<import("../users/entities/user.entity").User>;
    private otpStore;
    forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<{
        message: string;
    }>;
    resetPassword(resetPasswordDto: ResetPasswordDto): Promise<{
        message: string;
        access_token: string;
        user: {
            id: number;
            username: string;
            email: string;
            name: string;
            age: number;
            sex: import("../users/entities/user.entity").Gender;
            contact_number: string;
            profile_picture: string;
            role: string;
        };
    }>;
}
