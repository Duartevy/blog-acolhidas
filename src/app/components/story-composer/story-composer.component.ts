import { Component, EventEmitter, Output } from '@angular/core';
import { Post } from '../../models/blog.models';
import { PostsService } from '../../services/posts.service';

@Component({
  selector: 'app-story-composer',
  standalone: true,
  templateUrl: './story-composer.component.html',
  styleUrl: './story-composer.component.css'
})
export class StoryComposerComponent {
  @Output() published = new EventEmitter<Post>();
  characterCount = 0;
  isPublishing = false;
  message = '';
  constructor(private readonly postsService: PostsService) {}

  async publish(event: SubmitEvent, content: string, topic: string, form: HTMLFormElement): Promise<void> {
    event.preventDefault(); this.message = '';
    if (!content.trim() || topic === 'Escolha um tema') { this.message = 'Escreva seu relato e escolha um tema antes de publicar.'; return; }
    this.isPublishing = true;
    try { const post = await this.postsService.create(content, topic); form.reset(); this.characterCount = 0; this.message = 'Seu relato foi publicado com acolhimento.'; this.published.emit(post); }
    catch (error) { this.message = error instanceof Error ? error.message : 'Não foi possível publicar agora.'; }
    finally { this.isPublishing = false; }
  }
}
