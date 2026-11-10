import { Injectable } from '@angular/core';
import { Post } from '../models/blog.models';

@Injectable({ providedIn: 'root' })
export class PostsService {
  private readonly apiUrl = '/api/posts';

  async list(): Promise<Post[]> {
    const response = await fetch(this.apiUrl);
    if (!response.ok) throw new Error('Não foi possível carregar os relatos.');
    return response.json() as Promise<Post[]>;
  }

  async create(content: string, topic: string): Promise<Post> {
    const response = await fetch(this.apiUrl, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, topic })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Não foi possível publicar agora.');
    return result as Post;
  }
}
