import { Injectable } from '@angular/core';
import { NewsItem } from '../models/blog.models';

@Injectable({ providedIn: 'root' })
export class NewsService {
  async list(): Promise<NewsItem[]> {
    const response = await fetch('http://localhost:3000/api/news');
    if (!response.ok) throw new Error('Notícias indisponíveis no momento.');
    return response.json() as Promise<NewsItem[]>;
  }
}
