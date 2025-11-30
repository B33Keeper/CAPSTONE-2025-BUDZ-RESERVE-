import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
  ) {}

  async create(notificationData: {
    type: NotificationType;
    title: string;
    message: string;
    equipment_rental_item_id?: number;
    user_id?: number;
  }): Promise<Notification> {
    const notification = this.notificationsRepository.create(notificationData);
    return await this.notificationsRepository.save(notification);
  }

  async findAllUnread(): Promise<Notification[]> {
    return await this.notificationsRepository.find({
      where: { is_read: false },
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async findAll(): Promise<Notification[]> {
    return await this.notificationsRepository.find({
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async markAsRead(id: number): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id },
    });

    if (!notification) {
      throw new Error(`Notification with ID ${id} not found`);
    }

    notification.is_read = true;
    return await this.notificationsRepository.save(notification);
  }

  async markAllAsRead(): Promise<void> {
    await this.notificationsRepository.update({ is_read: false }, { is_read: true });
  }

  async getUnreadCount(): Promise<number> {
    return await this.notificationsRepository.count({
      where: { is_read: false },
    });
  }

  async delete(id: number): Promise<void> {
    await this.notificationsRepository.delete(id);
  }
}

