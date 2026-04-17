"use client";

type ScheduleGridProps = {
  startDate?: Date;
  numberOfDays?: number;
};

function formatHeaderDate(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatHourLabel(hour: number) {
  if (hour === 0) return "12 AM";
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return "12 PM";
  return `${hour - 12} PM`;
}

function buildDays(startDate: Date, numberOfDays: number) {
  return Array.from({ length: numberOfDays }, (_, index) => {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + index);
    return date;
  });
}

function HourRow({
  hour,
  numberOfDays,
}: {
  hour: number;
  numberOfDays: number;
}) {
  return (
    <>
      {/* Hour label */}
      <div className="flex h-16 items-start justify-end border-b border-r border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-400">
        {formatHourLabel(hour)}
      </div>

      {/* Day cells */}
      {Array.from({ length: numberOfDays }, (_, index) => (
        <div
          key={`${hour}-${index}`}
          className="relative h-16 border-b border-r border-zinc-800 bg-zinc-900/40"
        >
          {/* Half-hour guide line */}
          <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-zinc-800/70" />
        </div>
      ))}
    </>
  );
}

export default function ScheduleGrid({
  startDate = new Date(),
  numberOfDays = 7,
}: ScheduleGridProps) {
  const days = buildDays(startDate, numberOfDays);
  const hours = Array.from({ length: 24 }, (_, index) => index);

  return (
    <div className="w-full overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950">
      <div
        className="grid min-w-[900px]"
        style={{
          gridTemplateColumns: `80px repeat(${numberOfDays}, minmax(140px, 1fr))`,
        }}
      >
        {/* Top-left corner */}
        <div className="sticky top-0 z-20 border-b border-r border-zinc-800 bg-zinc-950" />

        {/* Date headers */}
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className="sticky top-0 z-10 border-b border-r border-zinc-800 bg-zinc-950 px-4 py-3 text-center text-sm font-semibold text-white"
          >
            {formatHeaderDate(day)}
          </div>
        ))}

        {/* Rows */}
        {hours.map((hour) => (
          <HourRow
            key={hour}
            hour={hour}
            numberOfDays={numberOfDays}
          />
        ))}
      </div>
    </div>
  );
}