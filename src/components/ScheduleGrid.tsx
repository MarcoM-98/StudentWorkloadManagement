"use client";

import { useMemo, useState } from "react";

type ScheduleGridProps = {
  numberOfDays?: number;
};

function getLocalStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function formatHeaderDate(date: Date) {
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function formatHeaderDay(date: Date) {
  return date.toLocaleDateString("en-US", { weekday: "short" });
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

function isSameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
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
      <div className="flex h-16 items-start justify-end border-b border-r border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-400">
        {formatHourLabel(hour)}
      </div>

      {Array.from({ length: numberOfDays }, (_, index) => (
        <div
          key={`${hour}-${index}`}
          className="relative h-16 border-b border-r border-zinc-800 bg-zinc-900/40"
        >
          <div className="absolute left-0 right-0 top-1/2 border-t border-dashed border-zinc-800/70" />
        </div>
      ))}
    </>
  );
}

export default function ScheduleGrid({
  numberOfDays = 7,
}: ScheduleGridProps) {
  const today = useMemo(() => getLocalStartOfDay(new Date()), []);
  const [dayOffset, setDayOffset] = useState(0);

  const visibleStartDate = useMemo(() => {
    const date = new Date(today);
    date.setDate(today.getDate() + dayOffset);
    return date;
  }, [today, dayOffset]);

  const days = useMemo(
    () => buildDays(visibleStartDate, numberOfDays),
    [visibleStartDate, numberOfDays]
  );

  const hours = Array.from({ length: 24 }, (_, index) => index);

  function handlePrevious() {
    setDayOffset((prev) => prev - 1);
  }

  function handleNext() {
    setDayOffset((prev) => prev + 1);
  }

  function handleToday() {
    setDayOffset(0);
  }

  return (
    <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="flex items-center justify-between border-b border-zinc-800 px-4 py-3">
        <div>
          <p className="text-sm font-medium text-zinc-400">Showing</p>
          <p className="text-base font-semibold text-white">
            {formatHeaderDate(days[0])} - {formatHeaderDate(days[days.length - 1])}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handlePrevious}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800"
          >
            ←
          </button>

          <button
            type="button"
            onClick={handleToday}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800"
          >
            Today
          </button>

          <button
            type="button"
            onClick={handleNext}
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800"
          >
            →
          </button>
        </div>
      </div>

      <div className="w-full overflow-x-auto rounded-b-2xl">
        <div
          className="grid min-w-[900px]"
          style={{
            gridTemplateColumns: `80px repeat(${numberOfDays}, minmax(140px, 1fr))`,
          }}
        >
          <div className="sticky top-0 z-20 border-b border-r border-zinc-800 bg-zinc-950" />

          {days.map((day) => {
            const isToday = isSameDay(day, today);

            return (
              <div
                key={day.toISOString()}
                className={`sticky top-0 z-10 border-b border-r border-zinc-800 px-4 py-3 text-center ${
                  isToday ? "bg-zinc-900" : "bg-zinc-950"
                }`}
              >
                <div
                  className={`text-xs font-medium ${
                    isToday ? "text-blue-400" : "text-zinc-400"
                  }`}
                >
                  {formatHeaderDay(day)}
                </div>
                <div className="text-sm font-semibold text-white">
                  {formatHeaderDate(day)}
                </div>
              </div>
            );
          })}

          {hours.map((hour) => (
            <HourRow
              key={hour}
              hour={hour}
              numberOfDays={numberOfDays}
            />
          ))}
        </div>
      </div>
    </div>
  );
}