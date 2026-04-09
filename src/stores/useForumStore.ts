import { create } from 'zustand';

export interface ForumPost {
  id: string;
  title: string;
  category: string;
  tags: string[];
  author: string;
  authorAvatar: string;
  repliesCount: number;
  lastActivity: string;
  createdAt: string;
  content: string;
}

export interface ForumCategoryType {
  id: string;
  title: string;
  description: string;
  icon: string;
  count: number;
}

interface ForumState {
  posts: ForumPost[];
  categories: ForumCategoryType[];
  setPosts: (posts: ForumPost[]) => void;
  setCategories: (categories: ForumCategoryType[]) => void;
  addPost: (post: ForumPost) => void;
}

export const useForumStore = create<ForumState>((set) => ({
  posts: [],
  categories: [],
  setPosts: (posts) => set({ posts }),
  setCategories: (categories) => set({ categories }),
  addPost: (post) => set((state) => ({ posts: [post, ...state.posts] })),
}));
