import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {
    // Check if user already exists
    const existingUser = await this.usersRepository.findOne({
      where: [
        { email: createUserDto.email },
        { username: createUserDto.username },
      ],
    });

    if (existingUser) {
      throw new ConflictException('User with this email or username already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(createUserDto.password, 12);

    // Create user
    const user = this.usersRepository.create({
      ...createUserDto,
      password: hashedPassword,
    });

    return this.usersRepository.save(user);
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find({
      select: ['id', 'name', 'username', 'email', 'age', 'sex', 'contact_number', 'profile_picture', 'is_active', 'created_at'],
    });
  }

  async getUserCount(): Promise<number> {
    return this.usersRepository.count();
  }

  async getActiveUserCount(): Promise<number> {
    return this.usersRepository.count({ where: { is_active: true } });
  }

  async findOne(id: number): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      select: ['id', 'name', 'username', 'email', 'age', 'sex', 'contact_number', 'profile_picture', 'is_active', 'role', 'created_at'],
    });

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { email },
    });
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.usersRepository.findOne({
      where: { username },
    });
  }

  async update(id: number, updateUserDto: UpdateUserDto): Promise<User> {
    const user = await this.findOne(id);

    // Check if email or username is being changed and if it already exists
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.usersRepository.findOne({
        where: { email: updateUserDto.email },
      });
      if (existingUser) {
        throw new ConflictException('User with this email already exists');
      }
    }

    if (updateUserDto.username && updateUserDto.username !== user.username) {
      const existingUser = await this.usersRepository.findOne({
        where: { username: updateUserDto.username },
      });
      if (existingUser) {
        throw new ConflictException('User with this username already exists');
      }
    }

    // Hash password if it's being updated
    if (updateUserDto.password) {
      updateUserDto.password = await bcrypt.hash(updateUserDto.password, 12);
    }

    await this.usersRepository.update(id, updateUserDto);
    return this.findOne(id);
  }

  async remove(id: number): Promise<void> {
    const user = await this.findOne(id);
    
    // Delete user's profile picture if it exists
    if (user.profile_picture && !user.profile_picture.startsWith('http')) {
      try {
        const { UploadService } = await import('../upload/upload.service');
        const { ConfigService } = await import('@nestjs/config');
        const configService = new ConfigService();
        const uploadService = new UploadService(configService);
        await uploadService.deleteFile(user.profile_picture);
      } catch (error) {
        console.error('Error deleting user profile picture:', error);
        // Don't fail user deletion if file deletion fails
      }
    }
    
    await this.usersRepository.remove(user);
  }

  async updateProfilePicture(id: number, profilePicture: string): Promise<User> {
    await this.usersRepository.update(id, { profile_picture: profilePicture });
    return this.findOne(id);
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    // Find user with password field included (bypass @Exclude decorator)
    const user = await this.usersRepository.findOne({ 
      where: { id: userId },
      select: ['id', 'username', 'email', 'password', 'name', 'age', 'sex', 'contact_number', 'profile_picture', 'is_active', 'created_at']
    });
    
    if (!user) {
      throw new NotFoundException('User not found');
    }
    
    // Verify current password
    const isCurrentPasswordValid = await this.verifyPassword(user, currentPassword);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Check if new password is different from current password
    const isSamePassword = await this.verifyPassword(user, newPassword);
    if (isSamePassword) {
      throw new BadRequestException('New password must be different from current password');
    }

    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await this.usersRepository.update(userId, { password: hashedNewPassword });
  }

  async updatePassword(userId: number, newPassword: string): Promise<void> {
    // Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    
    // Update password
    await this.usersRepository.update(userId, { password: hashedNewPassword });
  }
}
