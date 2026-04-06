"use client";

interface SaveBarProps {
  message: string;
  saved: boolean;
  successMessage?: string;
  onSave: () => void;
  onDiscard: () => void;
}

export function SaveBar({ message, saved, successMessage, onSave, onDiscard }: SaveBarProps) {
  return (
    <div className="sticky bottom-0 bg-white border-t border-gray-200 px-4 sm:px-5 py-3 flex flex-col sm:flex-row justify-between items-center gap-2">
      <span className="text-xs text-gray-400 text-center sm:text-left">
        {successMessage ? (
          <span className="text-success font-medium">{successMessage}</span>
        ) : (
          message
        )}
      </span>
      <div className="flex gap-2 w-full sm:w-auto">
        <button onClick={onDiscard} className="btn-secondary text-sm flex-1 sm:flex-none" disabled={saved}>
          Discard
        </button>
        <button onClick={onSave} className="btn-primary text-sm flex-1 sm:flex-none" disabled={saved}>
          Save &amp; publish
        </button>
      </div>
    </div>
  );
}