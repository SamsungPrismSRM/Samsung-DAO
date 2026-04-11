import { Pencil } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';

interface ConfigRowProps {
  label: string;
  subtitle?: string;
  value: string;
  unit?: string;
  editable?: boolean;
  onSave?: (value: string) => void;
}

export function ConfigRow({ label, subtitle, value, unit, editable = false, onSave }: ConfigRowProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = () => {
    setEditing(false);
    if (draft !== value) onSave?.(draft);
  };

  return (
    <div className="flex items-center justify-between border-b border-border/60 py-4 last:border-0">
      <div>
        <p className="text-sm font-medium text-foreground">{label}</p>
        {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {editing ? (
          <Input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={handleSave}
            onKeyDown={(e) => e.key === 'Enter' && handleSave()}
            className="h-8 w-24 text-right font-mono text-sm text-primary"
          />
        ) : (
          <span className="font-mono text-sm font-semibold text-primary">
            {value} {unit}
          </span>
        )}
        {editable && !editing && (
          <button onClick={() => { setDraft(value); setEditing(true); }} className="text-muted-foreground hover:text-primary transition-colors">
            <Pencil className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
}
