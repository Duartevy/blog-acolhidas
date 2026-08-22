import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

interface Post {
  id: number;
  content: string;
  topic: string;
  createdAt: string;
  commentsCount: number;
  reactionCount: number;
}

interface Comment {
  id: number;
  postId: number;
  parentId: number | null;
  content: string;
  createdAt: string;
  reactionCount: number;
  replies: Comment[];
  depth: number;
}

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit {
  title = 'blog-acolhidas';
  characterCount = 0;
  posts: Post[] = [];
  currentPage = 0;
  readonly pageSize = 10;
  isPublishing = false;
  publishMessage = '';
  commentsByPost: Record<number, Comment[]> = {};
  commentMessage = '';
  replyTo: number | null = null;
  readonly actorId = this.getActorId();

  ngOnInit(): void {
    void this.loadPosts();
  }

  get visiblePosts(): Post[] {
    const start = this.currentPage * this.pageSize;
    return this.posts.slice(start, start + this.pageSize);
  }

  get hasPreviousPage(): boolean {
    return this.currentPage > 0;
  }

  get totalPages(): number {
    return this.posts.length ? Math.ceil(this.posts.length / this.pageSize) : 0;
  }

  get hasNextPage(): boolean {
    return (this.currentPage + 1) * this.pageSize < this.posts.length;
  }

  previousPage(): void {
    if (this.hasPreviousPage) {
      this.currentPage -= 1;
    }
  }

  nextPage(): void {
    if (this.hasNextPage) {
      this.currentPage += 1;
    }
  }

  async publishStory(event: SubmitEvent, content: string, topic: string, form: HTMLFormElement): Promise<void> {
    event.preventDefault();
    this.publishMessage = '';

    if (!content.trim() || topic === 'Escolha um tema') {
      this.publishMessage = 'Escreva seu relato e escolha um tema antes de publicar.';
      return;
    }

    this.isPublishing = true;

    try {
      const response = await fetch('http://localhost:3000/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content, topic })
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Não foi possível publicar agora.');
      }

      const post = await response.json() as Post;
      this.posts = [post, ...this.posts];
      this.currentPage = 0;
      form.reset();
      this.characterCount = 0;
      this.publishMessage = 'Seu relato foi publicado com acolhimento.';
    } catch (error) {
      this.publishMessage = error instanceof Error
        ? error.message
        : 'Não foi possível conectar ao servidor.';
    } finally {
      this.isPublishing = false;
    }
  }

  private async loadPosts(): Promise<void> {
    try {
      const response = await fetch('http://localhost:3000/api/posts');
      if (response.ok) {
        this.posts = await response.json() as Post[];
        await Promise.all(this.posts.map((post) => this.loadComments(post.id)));
      }
    } catch {
      this.publishMessage = 'O servidor está offline. Inicie a API para publicar relatos.';
    }
  }

  commentsForPost(postId: number): Comment[] {
    const comments: Comment[] = [];
    const flatten = (items: Comment[], depth: number): void => {
      for (const comment of items) {
        comments.push({ ...comment, depth });
        flatten(comment.replies, depth + 1);
      }
    };
    flatten(this.commentsByPost[postId] || [], 0);
    return comments;
  }

  async publishComment(event: SubmitEvent, postId: number, content: string, form: HTMLFormElement, parentId: number | null = null): Promise<void> {
    event.preventDefault();
    const cleanContent = content.trim();
    if (!cleanContent) return;

    try {
      const response = await fetch(`http://localhost:3000/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: cleanContent, parentId })
      });
      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Não foi possível salvar o comentário.');
      }
      await this.loadComments(postId);
      const post = this.posts.find((item) => item.id === postId);
      if (post) post.commentsCount += 1;
      form.reset();
      this.replyTo = null;
      this.commentMessage = 'Comentário publicado anonimamente.';
    } catch (error) {
      this.commentMessage = error instanceof Error ? error.message : 'Não foi possível salvar o comentário.';
    }
  }

  async react(targetType: 'post' | 'comment', targetId: number, reactionType: 'heart' | 'support' | 'hug'): Promise<void> {
    const response = await fetch('http://localhost:3000/api/reactions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetType, targetId, reactionType, actorId: this.actorId })
    });
    if (!response.ok) return;
    const result = await response.json() as { reactionCount: number };
    if (targetType === 'post') {
      const post = this.posts.find((item) => item.id === targetId);
      if (post) post.reactionCount = result.reactionCount;
    } else {
      for (const comments of Object.values(this.commentsByPost)) {
        const comment = this.findComment(comments, targetId);
        if (comment) comment.reactionCount = result.reactionCount;
      }
    }
  }

  private async loadComments(postId: number): Promise<void> {
    const response = await fetch(`http://localhost:3000/api/posts/${postId}/comments`);
    if (response.ok) this.commentsByPost[postId] = await response.json() as Comment[];
  }

  private findComment(comments: Comment[], id: number): Comment | undefined {
    for (const comment of comments) {
      if (comment.id === id) return comment;
      const match = this.findComment(comment.replies, id);
      if (match) return match;
    }
    return undefined;
  }

  private getActorId(): string {
    const key = 'acolhidas-actor-id';
    const existing = localStorage.getItem(key);
    if (existing) return existing;
    const created = crypto.randomUUID();
    localStorage.setItem(key, created);
    return created;
  }
}
