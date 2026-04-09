import { User } from 'lucide-react';

interface UserAvatarProps {
  name: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-14 w-14 text-lg',
};

export function UserAvatar({ name, size = 'md', className = '' }: UserAvatarProps) {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className={`flex items-center justify-center rounded-full gradient-primary text-primary-foreground font-semibold ${sizes[size]} ${className}`}>
      {initials || <User className="h-4 w-4" />}
    </div>
  );
}
