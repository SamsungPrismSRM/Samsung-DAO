import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useRequireWallet } from '@/hooks/useRequireWallet';

interface CreatePostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreatePostModal({ open, onOpenChange }: CreatePostModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const { requireWallet } = useRequireWallet();

  const handleSubmit = () => {
    requireWallet(() => {
      onOpenChange(false);
      setTitle('');
      setCategory('');
      setTags('');
      setContent('');
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-display">Create New Post</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 pt-2">
          <Input placeholder="Post title" value={title} onChange={(e) => setTitle(e.target.value)} />
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Product Ideas">Product Ideas</SelectItem>
              <SelectItem value="Feature Requests">Feature Requests</SelectItem>
              <SelectItem value="Bug Reports">Bug Reports</SelectItem>
              <SelectItem value="Announcements">Announcements</SelectItem>
            </SelectContent>
          </Select>
          <Input placeholder="Tags (comma-separated)" value={tags} onChange={(e) => setTags(e.target.value)} />
          <Textarea placeholder="Write your post content..." rows={6} value={content} onChange={(e) => setContent(e.target.value)} />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} className="gradient-primary border-0 text-primary-foreground">Publish</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
