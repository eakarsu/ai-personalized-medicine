import { RefreshCw } from 'lucide-react';
import AIReport from './AIReport';

interface AIResponseProps {
  content: unknown;
  title: string;
  isLoading: boolean;
  onRegenerate?: () => void;
}

export default function AIResponse({ content, title, isLoading, onRegenerate }: AIResponseProps) {
  if (!isLoading && (content === '' || content === null || content === undefined)) return null;

  return (
    <section className="space-y-3" aria-label={`${title} result`}>
      <AIReport response={isLoading ? undefined : content} title={title} loading={isLoading} />
      {onRegenerate && !isLoading && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onRegenerate}
            className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <RefreshCw className="h-4 w-4" /> Regenerate
          </button>
        </div>
      )}
    </section>
  );
}
