export interface Post {
  id: number;
  content: string;
  topic: string;
  createdAt: string;
  commentsCount: number;
  reactionCount: number;
}

export interface Comment {
  id: number;
  postId: number;
  parentId: number | null;
  content: string;
  createdAt: string;
  reactionCount: number;
  replies: Comment[];
  depth?: number;
}

export interface NewsItem {
  id: string;
  title: string;
  link: string;
  publishedAt: string | null;
  source: string;
}
