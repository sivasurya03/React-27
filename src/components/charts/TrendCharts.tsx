import { useId } from 'react';
import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '@/hooks/useTheme';
import { chartTheme } from '@/utils/chartTheme';

interface ChartProps<T> {
  data: T[];
  xKey: keyof T & string;
  yKey: keyof T & string;
  height?: number;
  format?: (value: number) => string;
  label: string;
}

function useChartStyle() {
  const { mode } = useTheme();
  const c = chartTheme(mode);
  return {
    c,
    tick: { fill: c.text, fontSize: 12 },
    tooltip: {
      contentStyle: { background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 12, color: c.tooltipText, fontSize: 13 },
      labelStyle: { color: c.tooltipText },
      cursor: { stroke: c.grid },
    },
  };
}

export function AreaTrendChart<T extends object>({ data, xKey, yKey, height = 260, format = String, label }: ChartProps<T>) {
  const { c, tick, tooltip } = useChartStyle();
  const gradientId = useId().replace(/:/g, '');
  return (
    <div role="img" aria-label={label} style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={c.brand} stopOpacity={0.35} />
              <stop offset="100%" stopColor={c.brand} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tick={tick} axisLine={false} tickLine={false} />
          <YAxis tick={tick} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => format(Number(v))} />
          <Tooltip {...tooltip} formatter={(v) => format(Number(v))} />
          <Area type="monotone" dataKey={yKey} stroke={c.brand} strokeWidth={2.5} fill={`url(#${gradientId})`} animationDuration={700} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function BarTrendChart<T extends object>({ data, xKey, yKey, height = 260, format = String, label }: ChartProps<T>) {
  const { c, tick, tooltip } = useChartStyle();
  return (
    <div role="img" aria-label={label} style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tick={tick} axisLine={false} tickLine={false} />
          <YAxis tick={tick} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => format(Number(v))} />
          <Tooltip {...tooltip} cursor={{ fill: c.grid, opacity: 0.4 }} formatter={(v) => format(Number(v))} />
          <Bar dataKey={yKey} fill={c.brand} radius={[6, 6, 0, 0]} animationDuration={700} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
