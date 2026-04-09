import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Lightbulb, Sparkles, Bug, Megaphone, ArrowRight, Users } from 'lucide-react';
import { communityCategories } from '@/data/mockData';
import type { ReactNode } from 'react';

const iconMap: Record<string, ReactNode> = {
  Lightbulb: <Lightbulb className="h-6 w-6" />,
  Sparkles: <Sparkles className="h-6 w-6" />,
  Bug: <Bug className="h-6 w-6" />,
  Megaphone: <Megaphone className="h-6 w-6" />,
};

export default function Community() {
  return (
    <div className="container mx-auto px-4 py-12">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <h1 className="font-display text-3xl font-bold text-foreground">Community</h1>
        <p className="mt-2 text-muted-foreground">Explore categories and engage with Samsung Members worldwide</p>
      </motion.div>

      <div className="grid gap-5 sm:grid-cols-2">
        {communityCategories.map((cat, i) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
          >
            <Link to={`/forum?category=${encodeURIComponent(cat.title)}`}>
              <div className="group glass-card rounded-xl p-6 transition-all hover:shadow-md hover:border-primary/20">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {iconMap[cat.icon]}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                      {cat.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">{cat.description}</p>
                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        {cat.count} topics
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
