import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export default function WakeUpBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      if (!cancelled) setVisible(true);
    }, 2000);

    fetch(`${API_URL}/health`)
      .finally(() => {
        if (!cancelled) {
          clearTimeout(timer);
          setVisible(false);
        }
      });

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 px-4 py-2.5 bg-surface-800 border border-surface-600 rounded-full shadow-lg text-sm text-slate-300 whitespace-nowrap">
      <Loader2 className="w-4 h-4 animate-spin text-brand-400 shrink-0" />
      Server is waking up, please wait a moment…
    </div>
  );
}
