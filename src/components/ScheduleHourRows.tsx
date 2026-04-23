"use client";

import {
  formatHourLabel,
  getDayLoadStatus,
  isSameDay,
} from "@/lib/scheduleGridUtils";

type ScheduleHourRowsProps = {
  hours: number[];
  days: Date[];
  today: Date;
  dayStatuses: ReturnType<typeof getDayLoadStatus>[];
};

export default function ScheduleHourRows({
  hours,
  days,
  today,
  dayStatuses,
}: ScheduleHourRowsProps) {
  return (
    <>
      {hours.map((hour) => (
        <HourRow
          key={hour}
          hour={hour}
          days={days}
          today={today}
          dayStatuses={dayStatuses}
        />
      ))}
    </>
  );
}

function HourRow({
  hour,
  days,
  today,
  dayStatuses,
}: {
  hour: number;
  days: Date[];
  today: Date;
  dayStatuses: ReturnType<typeof getDayLoadStatus>[];
}) {
  return (
    <>
      <div className="flex h-16 items-start justify-end border-b border-r border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-400">
        {formatHourLabel(hour)}
      </div>

      {days.map((day, index) => {
        const isTodayColumn = isSameDay(day, today);
        const dayStatus = dayStatuses[index];

        return (
          <div
            key={`${day.toISOString()}-${hour}`}
            className={`relative h-16 border-b border-r ${dayStatus.borderClass} ${
              isTodayColumn ? "bg-zinc-900/70" : "bg-zinc-900/40"
            } ${dayStatus.columnClass}`}
          >
            <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-zinc-800/70" />
          </div>
        );
      })}
    </>
  );
}