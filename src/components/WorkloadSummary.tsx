"use client";

type PriorityBucket = "High" | "Medium" | "Low";

type ScheduleSummaryBlock = {
  id: string;
  title: string;
  blockDate: string;
  durationMinutes: number;
  priority?: string;
  customPercentage?: number | null;
};

type WorkloadSummaryProps = {
  blocks: ScheduleSummaryBlock[];
  dailyCapacityMinutes?: number;
  startDate?: Date;
  numberOfDays?: number;
};

type DayBucket = {
  date: Date;
  label: string;
  shortDate: string;
  minutes: number;
  priorityMinutes: Record<PriorityBucket, number>;
};

function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatHours(minutes: number) {
  return (minutes / 60).toFixed(1);
}

function getPriorityBucket(block: ScheduleSummaryBlock): PriorityBucket {
  const priority = String(block.priority || "").toLowerCase();
  const custom = block.customPercentage;

  if (custom !== null && custom !== undefined) {
    if (custom >= 80) return "High";
    if (custom >= 40) return "Medium";
    return "Low";
  }

  if (priority === "immediate" || priority === "high") return "High";
  if (priority === "medium") return "Medium";
  return "Low";
}

function buildDayBuckets(startDate: Date, numberOfDays: number): DayBucket[] {
  return Array.from({ length: numberOfDays }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);

    return {
      date,
      label: date.toLocaleDateString("en-US", { weekday: "short" }),
      shortDate: `${date.getMonth() + 1}/${date.getDate()}`,
      minutes: 0,
      priorityMinutes: {
        High: 0,
        Medium: 0,
        Low: 0,
      },
    };
  });
}

export default function WorkloadSummary({
  blocks,
  dailyCapacityMinutes = 360,
  startDate = new Date(),
  numberOfDays = 7,
}: WorkloadSummaryProps) {
  const visibleStart = new Date(
    startDate.getFullYear(),
    startDate.getMonth(),
    startDate.getDate()
  );

  const visibleEnd = new Date(visibleStart);
  visibleEnd.setDate(visibleStart.getDate() + numberOfDays - 1);

  const dayBuckets = buildDayBuckets(visibleStart, numberOfDays);

  for (const block of blocks) {
    const day = dayBuckets.find((bucket) => formatDateKey(bucket.date) === block.blockDate);
    if (!day) continue;

    const minutes = Math.max(block.durationMinutes || 0, 0);
    const bucket = getPriorityBucket(block);

    day.minutes += minutes;
    day.priorityMinutes[bucket] += minutes;
  }

  const totalMinutes = dayBuckets.reduce((sum, day) => sum + day.minutes, 0);
  const overloadedDays = dayBuckets.filter(
    (day) => day.minutes > dailyCapacityMinutes + 60
  ).length;
  const averageMinutes = numberOfDays > 0 ? totalMinutes / numberOfDays : 0;

  const maxMinutes = Math.max(
    ...dayBuckets.map((day) => day.minutes),
    dailyCapacityMinutes
  );

  const priorityTotals = blocks.reduce(
    (acc, block) => {
      const bucket = getPriorityBucket(block);
      acc[bucket] += Math.max(block.durationMinutes || 0, 0);
      return acc;
    },
    { High: 0, Medium: 0, Low: 0 } as Record<PriorityBucket, number>
  );

  const donutTotal =
    priorityTotals.High + priorityTotals.Medium + priorityTotals.Low || 1;

  const highDeg = (priorityTotals.High / donutTotal) * 360;
  const medDeg = (priorityTotals.Medium / donutTotal) * 360;
  const lowDeg = (priorityTotals.Low / donutTotal) * 360;

  const donutStyle = {
    background: `conic-gradient(
      rgb(244 63 94) 0deg ${highDeg}deg,
      rgb(245 158 11) ${highDeg}deg ${highDeg + medDeg}deg,
      rgb(59 130 246) ${highDeg + medDeg}deg ${highDeg + medDeg + lowDeg}deg
    )`,
  };

  return (
    <div className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-white">Workload Summary</h2>
        <p className="mt-1 text-sm text-zinc-400">
          {`${visibleStart.getMonth() + 1}/${visibleStart.getDate()} - ${
            visibleEnd.getMonth() + 1
          }/${visibleEnd.getDate()}`}
        </p>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
          <p className="text-sm text-zinc-400">Total Hours</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatHours(totalMinutes)}h
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
          <p className="text-sm text-zinc-400">Scheduled Blocks</p>
          <p className="mt-2 text-2xl font-bold text-white">{blocks.length}</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
          <p className="text-sm text-zinc-400">Overloaded Days</p>
          <p className="mt-2 text-2xl font-bold text-white">{overloadedDays}</p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
          <p className="text-sm text-zinc-400">Average / Day</p>
          <p className="mt-2 text-2xl font-bold text-white">
            {formatHours(averageMinutes)}h
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h3 className="mb-4 text-base font-semibold text-white">
            Daily Workload
          </h3>

          <div className="flex h-56 items-end gap-3">
            {dayBuckets.map((day) => {
              const heightPercent =
                maxMinutes > 0 ? (day.minutes / maxMinutes) * 100 : 0;

              const highPercent =
                day.minutes > 0 ? (day.priorityMinutes.High / day.minutes) * 100 : 0;
              const mediumPercent =
                day.minutes > 0 ? (day.priorityMinutes.Medium / day.minutes) * 100 : 0;
              const lowPercent =
                day.minutes > 0 ? (day.priorityMinutes.Low / day.minutes) * 100 : 0;

              return (
                <div
                  key={day.shortDate}
                  className="flex flex-1 flex-col items-center justify-end"
                >
                  <div className="mb-2 text-xs text-zinc-400">
                    {formatHours(day.minutes)}h
                  </div>

                  <div className="flex h-40 w-full items-end rounded-md bg-zinc-800/60 p-1">
                    <div
                      className="flex w-full flex-col-reverse overflow-hidden rounded-md"
                      style={{
                        height: `${Math.max(heightPercent, day.minutes > 0 ? 8 : 0)}%`,
                      }}
                    >
                      {lowPercent > 0 && (
                        <div className="bg-blue-500" style={{ height: `${lowPercent}%` }} />
                      )}
                      {mediumPercent > 0 && (
                        <div className="bg-amber-500" style={{ height: `${mediumPercent}%` }} />
                      )}
                      {highPercent > 0 && (
                        <div className="bg-rose-500" style={{ height: `${highPercent}%` }} />
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-xs font-medium text-zinc-300">
                    {day.label}
                  </div>
                  <div className="text-[10px] text-zinc-500">{day.shortDate}</div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
          <h3 className="mb-4 text-base font-semibold text-white">
            Workload by Priority
          </h3>

          <div className="flex flex-col items-center gap-4 md:flex-row md:items-center md:justify-between">
            <div className="relative h-48 w-48 rounded-full" style={donutStyle}>
              <div className="absolute inset-8 rounded-full bg-zinc-950" />
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-xs text-zinc-400">Total</p>
                <p className="text-xl font-bold text-white">
                  {formatHours(totalMinutes)}h
                </p>
              </div>
            </div>

            <div className="w-full max-w-xs space-y-3">
              <PriorityRow color="bg-rose-500" label="High" minutes={priorityTotals.High} />
              <PriorityRow color="bg-amber-500" label="Medium" minutes={priorityTotals.Medium} />
              <PriorityRow color="bg-blue-500" label="Low" minutes={priorityTotals.Low} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PriorityRow({
  color,
  label,
  minutes,
}: {
  color: string;
  label: string;
  minutes: number;
}) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2">
      <div className="flex items-center gap-2">
        <span className={`h-3 w-3 rounded-full ${color}`} />
        <span className="text-sm text-zinc-300">{label}</span>
      </div>
      <span className="text-sm font-semibold text-white">
        {formatHours(minutes)}h
      </span>
    </div>
  );
}