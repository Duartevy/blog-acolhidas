import { Component, OnInit } from '@angular/core';
import { Comment, Post } from '../../models/blog.models';
import { CommentsService } from '../../services/comments.service';
import { PostsService } from '../../services/posts.service';

@Component({ selector: 'app-community-wall', standalone: true, templateUrl: './community-wall.component.html', styleUrl: './community-wall.component.css' })
export class CommunityWallComponent implements OnInit {
  posts: Post[] = []; commentsByPost: Record<number, Comment[]> = {}; currentPage = 0; readonly pageSize = 10; readonly previewLimit = 4; expanded = new Set<number>(); replyTo: number | null = null; message = '';
  constructor(private readonly postsService: PostsService, private readonly commentsService: CommentsService) {}
  ngOnInit(): void { void this.refresh(); }
  get visiblePosts(): Post[] { return this.posts.slice(this.currentPage * this.pageSize, (this.currentPage + 1) * this.pageSize); }
  get totalPages(): number { return this.posts.length ? Math.ceil(this.posts.length / this.pageSize) : 0; }
  get hasNext(): boolean { return (this.currentPage + 1) * this.pageSize < this.posts.length; }
  previous(): void { if (this.currentPage) this.currentPage--; }
  next(): void { if (this.hasNext) this.currentPage++; }
  visibleComments(postId: number): Comment[] { const roots = this.commentsByPost[postId] || []; const selected = this.expanded.has(postId) ? roots : roots.slice(0, this.previewLimit); const result: Comment[] = []; const add = (items: Comment[], depth: number) => items.forEach((item) => { result.push({ ...item, depth }); add(item.replies, depth + 1); }); add(selected, 0); return result; }
  hasMore(postId: number): boolean { return (this.commentsByPost[postId] || []).length > this.previewLimit; }
  toggle(postId: number): void { this.expanded.has(postId) ? this.expanded.delete(postId) : this.expanded.add(postId); }
  async submitComment(event: SubmitEvent, postId: number, content: string, form: HTMLFormElement, parentId: number | null = null): Promise<void> { event.preventDefault(); if (!content.trim()) return; try { await this.commentsService.create(postId, content.trim(), parentId); await this.loadComments(postId); const post = this.posts.find((item) => item.id === postId); if (post) post.commentsCount++; form.reset(); this.replyTo = null; this.message = 'Comentário publicado anonimamente.'; } catch { this.message = 'Não foi possível salvar o comentário.'; } }
  async react(type: 'post' | 'comment', id: number): Promise<void> { try { const result = await this.commentsService.react(type, id); if (type === 'post') { const post = this.posts.find((item) => item.id === id); if (post) post.reactionCount = result.reactionCount; } else { Object.values(this.commentsByPost).forEach((items) => { const comment = this.find(items, id); if (comment) comment.reactionCount = result.reactionCount; }); } } catch { this.message = 'Não foi possível salvar a reação.'; } }
  async refresh(): Promise<void> { try { this.posts = await this.postsService.list(); await Promise.all(this.posts.map((post) => this.loadComments(post.id))); } catch { this.message = 'Não foi possível carregar os relatos.'; } }
  private async loadComments(postId: number): Promise<void> { this.commentsByPost[postId] = await this.commentsService.list(postId); }
  private find(items: Comment[], id: number): Comment | undefined { for (const item of items) { if (item.id === id) return item; const found = this.find(item.replies, id); if (found) return found; } return undefined; }
}
