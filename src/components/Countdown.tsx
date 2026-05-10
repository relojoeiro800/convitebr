import { useEffect, useState } from "react";

function diff(target: number) {
  const ms = Math.max(0, target - Date.now());
  const days = Math.floor(ms / 86400000);
  const hours = Math.floor((ms % 86400000) / 3600000);
  const minutes = Math.floor((ms % 3600000) / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  return { days, hours, minutes, seconds, ended: ms === 0 };
}

export function Countdown({ date }: { date: string }) {
  const target = new Date(date).getTime();
  const [t, setT] = useState(() => diff(target));

  useEffect(() => {
    const id = setInterval(() => setT(diff(target)), 1000);
    return () => clearInterval(id);
  }, [target]);

  if (t.ended) {
    return (
      <div className="glass rounded-2xl p-6 text-center">
        <p className="font-display text-2xl text-gradient">É hoje! 🎉</p>
      </div>
    );
  }

  const items = [
    { v: t.days, l: "dias" },
    { v: t.hours, l: "horas" },
    { v: t.minutes, l: "min" },
    { v: t.seconds, l: "seg" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 sm:gap-3">
      {items.map((i) => (
        <div key={i.l} className="glass rounded-2xl p-3 text-center">
          <div className="font-display text-2xl font-semibold tabular-nums sm:text-4xl">
            {String(i.v).padStart(2, "0")}
          </div>
          <div className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground sm:text-xs">
            {i.l}
          </div>
        </div>
      ))}
    </div>
  );
}
