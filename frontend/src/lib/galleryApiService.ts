import api from './api';

export interface GalleryItem {
  id: number;
  title: string;
  description: string;
  image_path: string;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CreateGalleryItem {
  title: string;
  description?: string;
  image_path: string;
  status?: string;
  sort_order?: number;
}

export const galleryApiService = {
  // Get all gallery items
  async getAll(): Promise<GalleryItem[]> {
    const response = await api.get('/gallery');
    return response.data;
  },

  // Get gallery item by ID
  async getById(id: number): Promise<GalleryItem> {
    const response = await api.get(`/gallery/${id}`);
    return response.data;
  },

  // Create gallery item
  async create(data: CreateGalleryItem): Promise<GalleryItem> {
    const response = await api.post('/gallery', data);
    return response.data;
  },

  // Update gallery item
  async update(id: number, data: Partial<CreateGalleryItem>): Promise<GalleryItem> {
    const response = await api.patch(`/gallery/${id}`, data);
    return response.data;
  },

  // Delete gallery item
  async delete(id: number): Promise<void> {
    await api.delete(`/gallery/${id}`);
  },

  // Upload gallery image
  async uploadImage(file: File, title: string, description?: string): Promise<GalleryItem> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('title', title);
    if (description) {
      formData.append('description', description);
    }

    const response = await api.post('/gallery/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },
};

