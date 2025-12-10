import { Card } from "@/components/ui/card";

export function LoadingGrid() {
  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {Array.from({ length: 6 }).map((_, idx) => (
        <Card key={idx} className="animate-pulse bg-white/60">
          <div className="h-24 rounded-xl bg-slate-100 mx-6 mt-4" />
          <div className="px-6 py-4 space-y-3">
            <div className="h-4 w-2/3 bg-slate-100 rounded" />
            <div className="h-3 w-full bg-slate-100 rounded" />
            <div className="h-3 w-1/2 bg-slate-100 rounded" />
          </div>
        </Card>
      ))}
    </div>
  );
}
