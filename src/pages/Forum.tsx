import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ForumPostCard } from '@/components/ForumPostCard';
import { CreatePostModal } from '@/components/CreatePostModal';
import { useForumStore } from '@/stores/useForumStore';
import { useRequireWallet } from '@/hooks/useRequireWallet';

const categories = ['All', 'Product Ideas', 'Feature Requests', 'Bug Reports', 'Announcements'];

export default function Forum() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const posts = useForumStore(state => state.posts);
  const { requireWallet } = useRequireWallet();

  const handleCreatePost = () => {
    requireWallet(() => setModalOpen(true));
  };

  const filtered = posts.filter((p) => {
    const matchesCat = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="container mx-auto px-4 py-12">
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="font-display text-3xl font-bold text-foreground">Forum</h1>
          <p className="mt-1 text-muted-foreground">Discuss ideas, report issues, and collaborate</p>
        </motion.div>
        <Button onClick={handleCreatePost} className="gradient-primary border-0 text-primary-foreground gap-2">
          <Plus className="h-4 w-4" /> Create Post
        </Button>
      </div>

      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search topics..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:text-foreground'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <AnimatePresence>
          {filtered.map((post) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              layout
            >
              <ForumPostCard post={post} />
            </motion.div>
          ))}
        </AnimatePresence>
        {filtered.length === 0 && (
          <div className="py-16 text-center text-muted-foreground">No topics found</div>
        )}
      </div>

      <CreatePostModal open={modalOpen} onOpenChange={setModalOpen} />
    </div>
  );
}
