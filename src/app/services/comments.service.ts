import { Injectable } from '@angular/core';
import { Comment } from '../models/blog.models';

@Injectable({ providedIn: 'root' })
export class CommentsService {
  private readonly apiUrl = '/api';

  async list(postId: number): Promise<Comment[]> {
    const response = await fetch(`${this.apiUrl}/posts/${postId}/comments`);
    if (!response.ok) throw new Error('Não foi possível carregar os comentários.');
    return response.json() as Promise<Comment[]>;
  }

  async create(postId: number, content: string, parentId: number | null = null): Promise<Comment> {
    const response = await fetch(`${this.apiUrl}/posts/${postId}/comments`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, parentId })
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result.error || 'Não foi possível salvar o comentário.');
    return result as Comment;
  }

  async react(targetType: 'post' | 'comment', targetId: number, reactionType = 'heart'): Promise<{ reactionCount: number }> {
    const response = await fetch(`${this.apiUrl}/reactions`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType, targetId, reactionType })
    });
    if (!response.ok) throw new Error('Não foi possível salvar a reação.');
    return response.json() as Promise<{ reactionCount: number }>;
  }
}
