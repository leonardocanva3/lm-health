import { Card } from "@/components/ui/Card";

type EmptyStateProps = {
  emoji?: string;
  title: string;
  description: string;
};

export function EmptyState({ emoji = "📋", title, description }: EmptyStateProps) {
  return (
    <Card className="text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-100 text-2xl">
        {emoji}
      </div>
      <h2 className="mt-4 text-base font-semibold text-slate-950">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
    </Card>
  );
}
