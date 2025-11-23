"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const mailer_1 = require("@nestjs-modules/mailer");
const users_service_1 = require("../users/users.service");
let AuthService = class AuthService {
    constructor(usersService, jwtService, configService, mailerService) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.mailerService = mailerService;
        this.otpStore = new Map();
    }
    async validateUser(username, password) {
        const user = await this.usersService.findByUsername(username);
        if (user && await this.usersService.verifyPassword(user, password)) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }
    async login(loginDto) {
        const user = await this.validateUser(loginDto.username, loginDto.password);
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid credentials');
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
    async register(registerDto) {
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
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            throw new common_1.ConflictException('Registration failed');
        }
    }
    async refreshToken(user) {
        const payload = { username: user.username, sub: user.id };
        return {
            access_token: this.jwtService.sign(payload),
        };
    }
    async getProfile(userId) {
        return this.usersService.findOne(userId);
    }
    async forgotPassword(forgotPasswordDto) {
        const { email } = forgotPasswordDto;
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.NotFoundException('User with this email does not exist');
        }
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        this.otpStore.set(email, { otp, expiresAt });
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
        }
        catch (error) {
            console.error('❌ Email sending failed:', error);
            console.log('=== DEVELOPMENT FALLBACK ===');
            console.log('Email:', email);
            console.log('User:', user.name || user.username);
            console.log('OTP Code:', otp);
            console.log('Expires at:', expiresAt);
            console.log('=============================');
            return { message: 'OTP generated successfully. Check console for OTP: ' + otp };
        }
    }
    async verifyOtp(verifyOtpDto) {
        const { email, otp } = verifyOtpDto;
        const storedOtp = this.otpStore.get(email);
        if (!storedOtp) {
            throw new common_1.BadRequestException('OTP not found or expired');
        }
        if (new Date() > storedOtp.expiresAt) {
            this.otpStore.delete(email);
            throw new common_1.BadRequestException('OTP has expired');
        }
        if (storedOtp.otp !== otp) {
            throw new common_1.BadRequestException('Invalid OTP');
        }
        return { message: 'OTP verified successfully' };
    }
    async resetPassword(resetPasswordDto) {
        const { email, otp, newPassword } = resetPasswordDto;
        await this.verifyOtp({ email, otp });
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        await this.usersService.updatePassword(user.id, newPassword);
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
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        mailer_1.MailerService])
], AuthService);
//# sourceMappingURL=auth.service.js.map