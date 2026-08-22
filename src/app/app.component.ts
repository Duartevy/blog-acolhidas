import { Component, ViewChild } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommunityWallComponent } from './components/community-wall/community-wall.component';
import { FooterComponent } from './components/footer/footer.component';
import { HeroComponent } from './components/hero/hero.component';
import { NavbarComponent } from './components/navbar/navbar.component';
import { NewsCarouselComponent } from './components/news-carousel/news-carousel.component';
import { NewsletterComponent } from './components/newsletter/newsletter.component';
import { StoryComposerComponent } from './components/story-composer/story-composer.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommunityWallComponent, FooterComponent, HeroComponent, NavbarComponent, NewsCarouselComponent, NewsletterComponent, RouterOutlet, StoryComposerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  @ViewChild(CommunityWallComponent) communityWall?: CommunityWallComponent;

  refreshCommunity(): void {
    void this.communityWall?.refresh();
  }
}
