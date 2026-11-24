import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Legend, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { useTheme } from '@/hooks/useTheme';
import { chartTheme } from '@/utils/chartTheme';

function useStyle() {
  const { mode } = useTheme();
  const c = chartTheme(mode);
  return {
    c,
    tick: { fill: c.text, fontSize: 12 },
    tooltip: { contentStyle: { background: c.tooltipBg, border: `1px solid ${c.tooltipBorder}`, borderRadius: 12, color: c.tooltipText, fontSize: 13 }, labelStyle: { color: c.tooltipText } },
  };
}

interface LineProps<T> {
  data: T[];
  xKey: keyof T & string;
  yKey: keyof T & string;
  label: string;
  height?: number;
  domain?: [number, number];
  format?: (value: number) => string;
}

/** Single-series line chart (used for trends such as student growth and ratings). */
export function LineTrendChart<T extends object>({ data, xKey, yKey, label, height = 260, domain, format = String }: LineProps<T>) {
  const { c, tick, tooltip } = useStyle();
  return (
    <div role="img" aria-label={label} style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <LineChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tick={tick} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
          <YAxis tick={tick} axisLine={false} tickLine={false} width={44} domain={domain} tickFormatter={(v) => format(Number(v))} />
          <Tooltip {...tooltip} formatter={(v) => format(Number(v))} />
          <Line type="monotone" dataKey={yKey} stroke={c.accent} strokeWidth={2.5} dot={false} animationDuration={700} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

interface PerformanceRow {
  name: string;
  enrollments: number;
  completionRate: number;
}

/** Enrollments (bars, left axis) against completion rate (line, right axis) per course. */
export function CoursePerformanceChart({ data, height = 280 }: { data: PerformanceRow[]; height?: number }) {
  const { c, tick, tooltip } = useStyle();
  return (
    <div role="img" aria-label="Enrollments and completion rate by course" style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <ComposedChart data={data} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="name" tick={tick} axisLine={false} tickLine={false} interval={0} height={36} tickFormatter={(v: string) => (v.length > 10 ? `${v.slice(0, 9)}…` : v)} />
          <YAxis yAxisId="left" tick={tick} axisLine={false} tickLine={false} width={40} />
          <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={tick} axisLine={false} tickLine={false} width={36} tickFormatter={(v) => `${v}%`} />
          <Tooltip {...tooltip} />
          <Legend wrapperStyle={{ fontSize: 12, color: c.text }} />
          <Bar yAxisId="left" dataKey="enrollments" name="Enrollments" fill={c.brand} radius={[6, 6, 0, 0]} animationDuration={700} />
          <Line yAxisId="right" type="monotone" dataKey="completionRate" name="Completion %" stroke={c.warn} strokeWidth={2.5} dot={{ r: 3 }} animationDuration={700} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

interface GroupedProps<T> {
  data: T[];
  xKey: keyof T & string;
  series: { key: keyof T & string; label: string }[];
  label: string;
  height?: number;
  format?: (value: number) => string;
}

/** Side-by-side bars for comparing metrics over the same categories. */
export function GroupedBarChart<T extends object>({ data, xKey, series, label, height = 280, format = String }: GroupedProps<T>) {
  const { c, tick, tooltip } = useStyle();
  return (
    <div role="img" aria-label={label} style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <CartesianGrid stroke={c.grid} strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey={xKey} tick={tick} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={16} />
          <YAxis tick={tick} axisLine={false} tickLine={false} width={48} tickFormatter={(v) => format(Number(v))} />
          <Tooltip {...tooltip} cursor={{ fill: c.grid, opacity: 0.4 }} formatter={(v) => format(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 12, color: c.text }} />
          {series.map((s, i) => <Bar key={s.key} dataKey={s.key} name={s.label} fill={c.palette[i % c.palette.length]} radius={[4, 4, 0, 0]} animationDuration={700} />)}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

/** Donut chart showing how a total is shared between named slices. */
export function PieShareChart({ data, label, height = 280, format = String }: { data: { name: string; value: number }[]; label: string; height?: number; format?: (value: number) => string }) {
  const { c, tooltip } = useStyle();
  return (
    <div role="img" aria-label={label} style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0}>
        <PieChart>
          <Tooltip {...tooltip} formatter={(v) => format(Number(v))} />
          <Legend wrapperStyle={{ fontSize: 12, color: c.text }} />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={2} stroke="none" animationDuration={700}>
            {data.map((d, i) => <Cell key={d.name} fill={c.palette[i % c.palette.length]} />)}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
