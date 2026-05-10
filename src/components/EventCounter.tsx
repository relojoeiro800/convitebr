import { useEffect, useRef, useState } from "react";

function useCountUp(target: number, duration = 1800) {
  const [val, setVal] = useState(0);
  const started = useRef(false);
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(Math.floor(eased * target));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return val;
}

export function EventCounter() {
  const events = useCountUp(12480);
  const rsvps = useCountUp(89342);
  const cities = useCountUp(642);
  const stats = [
    { label: "Convites criados", value: events },
    { label: "Confirmações recebidas", value: rsvps },
    { label: "Cidades alcançadas", value: cities },
  ];
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
      {stats.map((s) => (
        <div key={s.label} className="glass rounded-3xl p-6 text-center">
          <div className="font-display text-4xl font-semibold text-gradient sm:text-5xl tabular-nums">
            {s.value.toLocaleString("pt-BR")}+
          </div>
          <div className="mt-2 text-sm text-muted-foreground">{s.label}</div>
        </div>
      ))}
    </div>
  );
}
