import { DatePipe } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NewsItem } from '../../models/blog.models';
import { NewsService } from '../../services/news.service';

@Component({
  selector: 'app-news-carousel',
  standalone: true,
  imports: [DatePipe],
  templateUrl: './news-carousel.component.html',
  styleUrl: './news-carousel.component.css'
})
export class NewsCarouselComponent implements OnDestroy, OnInit {
  news: NewsItem[] = [];
  newsIndex = 0;
  isPlaying = true;
  message = '';
  private timer?: ReturnType<typeof setInterval>;

  constructor(private readonly newsService: NewsService) {}

  ngOnInit(): void {
    void this.load();
    this.timer = setInterval(() => this.next(), 5000);
  }

  ngOnDestroy(): void { if (this.timer) clearInterval(this.timer); }

  get current(): NewsItem | undefined { return this.news[this.newsIndex]; }

  previous(): void { this.isPlaying = false; if (this.news.length > 1) this.newsIndex = (this.newsIndex - 1 + this.news.length) % this.news.length; }
  next(): void { if (this.isPlaying && this.news.length > 1) this.newsIndex = (this.newsIndex + 1) % this.news.length; }
  advance(): void { this.isPlaying = false; if (this.news.length > 1) this.newsIndex = (this.newsIndex + 1) % this.news.length; }
  toggle(): void { this.isPlaying = !this.isPlaying; }

  private async load(): Promise<void> { try { this.news = await this.newsService.list(); } catch { this.message = 'Notícias indisponíveis no momento.'; } }
}
