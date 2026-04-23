"use client";

import {
  formatHeaderDate,
  formatHeaderDay,
  isSameDay,
} from "@/lib/scheduleGridUtils";

type DayStatus = {
  label: string;
  badgeClass: string;
  columnClass: string;
  borderClass: string;
};

type ScheduleDayHeaderRowProps = {
  days: Date[];
  today: Date;
  dayStatuses: DayStatus[];
};

export default function ScheduleDayHeaderRow({
  days,
  today,
  dayStatuses,
}: ScheduleDayHeaderRowProps) {
  return (
    <>
      <div className="sticky top-0 z-20 border-b border-r border-zinc-800 bg-zinc-950" />

      {days.map((day, index) => {
        const isTodayColumn = isSameDay(day, today);
        const dayStatus = dayStatuses[index];

        return (
          <div
            key={day.toISOString()}
            className={`sticky top-0 z-10 border-b border-r px-4 py-3 text-center ${
              isTodayColumn ? "bg-zinc-900" : "bg-zinc-950"
            } ${dayStatus.borderClass} ${dayStatus.columnClass}`}
          >
            <div
              className={`text-xs font-medium ${
                isTodayColumn ? "text-blue-400" : "text-zinc-400"
              }`}
            >
              {formatHeaderDay(day)}
            </div>

            <div className="text-sm font-semibold text-white">
              {formatHeaderDate(day)}
            </div>

            <div
              className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold ${dayStatus.badgeClass}`}
            >
              {dayStatus.label}
            </div>
          </div>
        );
      })}
    </>
  );
}