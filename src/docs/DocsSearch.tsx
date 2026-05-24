import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/shared/components/ui/command';

interface SearchEntry {
  title: string;
  description: string;
  url: string;
  headings: Array<{ id: string; text: string; level: number }>;
}

export function DocsSearch({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const navigate = useNavigate();
  const [entries, setEntries] = useState<SearchEntry[]>([]);
  const [query, setQuery] = useState('');

  useEffect(() => {
    if (!open || entries.length > 0) return;
    void import('./search-index.json').then((module) => setEntries(module.default as SearchEntry[]));
  }, [entries.length, open]);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return entries.slice(0, 10);
    return entries
      .map((entry) => {
        const haystack = `${entry.title} ${entry.description} ${entry.headings.map((heading) => heading.text).join(' ')}`.toLowerCase();
        return { entry, score: haystack.includes(normalized) ? haystack.indexOf(normalized) : -1 };
      })
      .filter((item) => item.score >= 0)
      .sort((a, b) => a.score - b.score)
      .slice(0, 10)
      .map((item) => item.entry);
  }, [entries, query]);

  const handleSelect = useCallback(
    (url: string) => {
      navigate(url);
      onOpenChange(false);
    },
    [navigate, onOpenChange],
  );

  return (
    <CommandDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Search Documentation"
      description="Find docs pages and headings."
    >
      <CommandInput value={query} onValueChange={setQuery} placeholder="Search documentation..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Docs">
          {results.map((entry) => (
            <CommandItem
              key={entry.url}
              value={`${entry.title} ${entry.description}`}
              onSelect={() => handleSelect(entry.url)}
              className="cursor-pointer"
            >
              <span className="flex flex-col">
                <span>{entry.title}</span>
                <span className="text-xs text-n-8">{entry.description}</span>
              </span>
            </CommandItem>
          ))}
        </CommandGroup>
      </CommandList>
    </CommandDialog>
  );
}
