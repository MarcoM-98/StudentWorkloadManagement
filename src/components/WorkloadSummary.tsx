"use client";

type Task = {
  _id: string;
  title: string;
  dueDate: string;
  duration: number;
  priority?: string;
  customPercentage?: number | null;
};

type WorkloadSummaryProps = {
  tasks: Task[];
  dailyCapacityMinutes?: number;
  startDate?: Date;
  numberOfDays?: number;
};

type PriorityBucket = "High" | "Medium" | "Low";

type DayBucket = {
  date: Date;
  label: string;
  shortDate: string;
  minutes: number;
  priorityMinutes: Record<PriorityBucket, number>;
};

function getLocalStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseLocalDate(dateString: string) {
  if (!dateString) return null;

  const trimmed = String(dateString).trim();

  if (trimmed.includes("T")) {
    const datePart = trimmed.split("T")[0];
    const [year, month, day] = datePart.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const [year, month, day] = trimmed.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
    const [month, day, year] = trimmed.split("/").map(Number);
    return new Date(year, month - 1, day);
  }

  return null;
}

function formatHours(minutes: number) {
  return (minutes / 60).toFixed(1);
}

function getPriorityBucket(task: Task): PriorityBucket {
  const priority = String(task.priority || "").toLowerCase();
  const custom = task.customPercentage;

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
  tasks,
  dailyCapacityMinutes = 360,
  startDate = new Date(),
  numberOfDays = 7,
}: WorkloadSummaryProps) {
  const visibleStart = getLocalStartOfDay(startDate);
  const visibleEnd = new Date(visibleStart);
  visibleEnd.setDate(visibleStart.getDate() + numberOfDays - 1);

  const dayBuckets = buildDayBuckets(visibleStart, numberOfDays);

  for (const task of tasks) {
    const due = parseLocalDate(task.dueDate);
    if (!due) continue;

    const normalizedDue = getLocalStartOfDay(due);
    const diffDays = Math.round(
      (normalizedDue.getTime() - visibleStart.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays >= 0 && diffDays < numberOfDays) {
      const minutes = Math.max(task.duration || 0, 0);
      const bucket = getPriorityBucket(task);

      dayBuckets[diffDays].minutes += minutes;
      dayBuckets[diffDays].priorityMinutes[bucket] += minutes;
    }
  }

  const totalMinutes = dayBuckets.reduce((sum, day) => sum + day.minutes, 0);

  const dueThisWeekCount = tasks.filter((task) => {
    const due = parseLocalDate(task.dueDate);
    if (!due) return false;

    const normalizedDue = getLocalStartOfDay(due);
    return normalizedDue >= visibleStart && normalizedDue <= visibleEnd;
  }).length;

  const overloadedDays = dayBuckets.filter(
    (day) => day.minutes > dailyCapacityMinutes + 60
  ).length;

  const averageMinutes = numberOfDays > 0 ? totalMinutes / numberOfDays : 0;

  const maxMinutes = Math.max(
    ...dayBuckets.map((day) => day.minutes),
    dailyCapacityMinutes
  );

  const priorityTotals = tasks.reduce(
    (acc, task) => {
      const bucket = getPriorityBucket(task);
      acc[bucket] += Math.max(task.duration || 0, 0);
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
          <p className="text-sm text-zinc-400">Due This Week</p>
          <p className="mt-2 text-2xl font-bold text-white">{dueThisWeekCount}</p>
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
                day.minutes > 0
                  ? (day.priorityMinutes.High / day.minutes) * 100
                  : 0;

              const mediumPercent =
                day.minutes > 0
                  ? (day.priorityMinutes.Medium / day.minutes) * 100
                  : 0;

              const lowPercent =
                day.minutes > 0
                  ? (day.priorityMinutes.Low / day.minutes) * 100
                  : 0;

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
                        height: `${Math.max(
                          heightPercent,
                          day.minutes > 0 ? 8 : 0
                        )}%`,
                      }}
                    >
                      {lowPercent > 0 && (
                        <div
                          className="bg-blue-500"
                          style={{ height: `${lowPercent}%` }}
                          title={`Low: ${formatHours(day.priorityMinutes.Low)}h`}
                        />
                      )}

                      {mediumPercent > 0 && (
                        <div
                          className="bg-amber-500"
                          style={{ height: `${mediumPercent}%` }}
                          title={`Medium: ${formatHours(
                            day.priorityMinutes.Medium
                          )}h`}
                        />
                      )}

                      {highPercent > 0 && (
                        <div
                          className="bg-rose-500"
                          style={{ height: `${highPercent}%` }}
                          title={`High: ${formatHours(
                            day.priorityMinutes.High
                          )}h`}
                        />
                      )}
                    </div>
                  </div>

                  <div className="mt-2 text-xs font-medium text-zinc-300">
                    {day.label}
                  </div>
                  <div className="text-[10px] text-zinc-500">
                    {day.shortDate}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-zinc-400">
            <div className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-rose-500" />
              High
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-amber-500" />
              Medium
            </div>
            <div className="flex items-center gap-1">
              <span className="h-2.5 w-2.5 rounded-full bg-blue-500" />
              Low
            </div>
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
              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-rose-500" />
                  <span className="text-sm text-zinc-300">High</span>
                </div>
                <span className="text-sm font-semibold text-white">
                  {formatHours(priorityTotals.High)}h
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-amber-500" />
                  <span className="text-sm text-zinc-300">Medium</span>
                </div>
                <span className="text-sm font-semibold text-white">
                  {formatHours(priorityTotals.Medium)}h
                </span>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-zinc-800 bg-zinc-950/80 px-3 py-2">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-blue-500" />
                  <span className="text-sm text-zinc-300">Low</span>
                </div>
                <span className="text-sm font-semibold text-white">
                  {formatHours(priorityTotals.Low)}h
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}