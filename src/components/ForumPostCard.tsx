import { Link } from 'react-router-dom';
import { MessageSquare, Clock } from 'lucide-react';
import { TagBadge } from '@/components/TagBadge';
import { UserAvatar } from '@/components/UserAvatar';
import type { ForumPost } from '@/stores/useForumStore';

export function ForumPostCard({ post }: { post: ForumPost }) {
  return (
    <Link to={`/forum/${post.id}`}>
      <div className="group flex items-center gap-4 rounded-xl border border-border/50 bg-card p-4 transition-all hover:border-primary/20 hover:shadow-sm">
        <UserAvatar name={post.author} size="sm" />
        <div className="flex-1 min-w-0">
          <h4 className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {post.title}
          </h4>
          <div className="mt-1 flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{post.author}</span>
            <span className="text-muted-foreground/30">·</span>
            <span className="text-xs text-muted-foreground">{post.category}</span>
            {post.tags.slice(0, 2).map((tag) => (
              <TagBadge key={tag} tag={tag} />
            ))}
          </div>
        </div>
        <div className="hidden items-center gap-4 text-xs text-muted-foreground sm:flex">
          <div className="flex items-center gap-1">
            <MessageSquare className="h-3 w-3" />
            {post.repliesCount}
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            {post.lastActivity}
          </div>
        </div>
      </div>
    </Link>
  );
}
