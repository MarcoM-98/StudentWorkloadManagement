"use client";

import { useMemo, useRef, useState } from "react";
import ScheduleBlockCard from "@/components/ScheduleBlockCard";
import ScheduleConflictPopup from "@/components/ScheduleConflictPopup";
import { type ScheduleBlock } from "@/lib/scheduleCollision";
import { useScheduleBlocks } from "@/lib/useScheduleBlocks";

type CalendarTask = {
  _id: string;
  title: string;
  dueDate: string;
  duration: number;
};

type ScheduleGridProps = {
  tasks: CalendarTask[];
  numberOfDays?: number;
};

const HOUR_HEIGHT = 64;
const MINUTE_HEIGHT = HOUR_HEIGHT / 60;
const TOTAL_DAY_HEIGHT = 24 * HOUR_HEIGHT;
const TIME_LABEL_WIDTH = 80;

// Mocked user daily capacity for now
const DAILY_CAPACITY_MINUTES = 360; // 6 hours
const WARNING_BUFFER_MINUTES = 60; // 1 hour over = yellow

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

function getBlockTop(block: ScheduleBlock) {
  return (block.startHour * 60 + block.startMinute) * MINUTE_HEIGHT;
}

function getBlockHeight(block: ScheduleBlock) {
  return Math.max(block.durationMinutes * MINUTE_HEIGHT, 24);
}

function formatSingleTime(hour24: number, minutes: number) {
  const normalizedHour = hour24 % 24;
  const suffix = normalizedHour >= 12 ? "PM" : "AM";
  const hour12 =
    normalizedHour === 0 ? 12 : normalizedHour > 12 ? normalizedHour - 12 : normalizedHour;

  if (minutes === 0) {
    return `${hour12} ${suffix}`;
  }

  return `${hour12}:${String(minutes).padStart(2, "0")} ${suffix}`;
}

function formatBlockTime(block: ScheduleBlock) {
  const startTotalMinutes = block.startHour * 60 + block.startMinute;
  const endTotalMinutes = startTotalMinutes + block.durationMinutes;

  const startHour = Math.floor(startTotalMinutes / 60);
  const startMinutes = startTotalMinutes % 60;
  const endHour = Math.floor(endTotalMinutes / 60);
  const endMinutes = endTotalMinutes % 60;

  return `${formatSingleTime(startHour, startMinutes)} - ${formatSingleTime(
    endHour,
    endMinutes
  )}`;
}

function formatHoursOver(minutesOver: number) {
  return `+${(minutesOver / 60).toFixed(1)}h`;
}

function getDayLoadStatus(totalMinutes: number) {
  if (totalMinutes <= DAILY_CAPACITY_MINUTES) {
    return {
      label: "OK",
      headerClass: "text-zinc-400",
      badgeClass: "bg-zinc-800 text-zinc-300 border-zinc-700",
      columnClass: "",
      borderClass: "border-zinc-800",
    };
  }

  if (totalMinutes <= DAILY_CAPACITY_MINUTES + WARNING_BUFFER_MINUTES) {
    return {
      label: formatHoursOver(totalMinutes - DAILY_CAPACITY_MINUTES),
      headerClass: "text-amber-300",
      badgeClass: "bg-amber-500/15 text-amber-300 border-amber-500/30",
      columnClass: "bg-amber-500/[0.05]",
      borderClass: "border-amber-500/30",
    };
  }

  return {
    label: formatHoursOver(totalMinutes - DAILY_CAPACITY_MINUTES),
    headerClass: "text-rose-300",
    badgeClass: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    columnClass: "bg-rose-500/[0.06]",
    borderClass: "border-rose-500/30",
  };
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

export default function ScheduleGrid({
  tasks,
  numberOfDays = 7,
}: ScheduleGridProps) {
  const today = useMemo(() => getLocalStartOfDay(new Date()), []);
  const overlayRef = useRef<HTMLDivElement | null>(null);
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

  const {
    popupRef,
    selectedBlockId,
    popupPosition,
    dragState,
    pendingConflict,
    pendingCombine,
    selectedBlock,
    visibleBlocks,
    clearMenus,
    handleSelectBlock,
    handleBlockMouseDown,
    handleSplitChunk,
    handleCancelConflict,
    handleForcePlace,
    handleFitAtEnd,
    handleCancelCombine,
    handleConfirmCombine,
  } = useScheduleBlocks({
    tasks,
    numberOfDays,
    visibleStartDate,
    overlayRef,
    minuteHeight: MINUTE_HEIGHT,
    timeLabelWidth: TIME_LABEL_WIDTH,
  });

  const dayLoads = useMemo(() => {
    return days.map((day, index) => {
      const dayBlocks = visibleBlocks.filter(
        (block) => block.visibleDayOffset === index
      );

      return dayBlocks.reduce((sum, block) => sum + block.durationMinutes, 0);
    });
  }, [days, visibleBlocks]);

  const dayStatuses = useMemo(() => {
    return dayLoads.map((minutes) => getDayLoadStatus(minutes));
  }, [dayLoads]);

  function handlePrevious() {
    clearMenus();
    setDayOffset((prev) => prev - 1);
  }

  function handleNext() {
    clearMenus();
    setDayOffset((prev) => prev + 1);
  }

  function handleToday() {
    clearMenus();
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
          <p className="mt-1 text-xs text-zinc-500">
            Daily capacity: {(DAILY_CAPACITY_MINUTES / 60).toFixed(0)}h
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

          {hours.map((hour) => (
            <HourRow
              key={hour}
              hour={hour}
              days={days}
              today={today}
              dayStatuses={dayStatuses}
            />
          ))}
        </div>

        <div
          ref={overlayRef}
          className="pointer-events-none relative -mt-[1536px] grid min-w-[900px]"
          style={{
            gridTemplateColumns: `80px repeat(${numberOfDays}, minmax(140px, 1fr))`,
            height: `${TOTAL_DAY_HEIGHT}px`,
          }}
        >
          <div />

          {days.map((day, columnIndex) => {
            const dayBlocks = visibleBlocks.filter(
              (block) => block.visibleDayOffset === columnIndex
            );
            const isTodayColumn = isSameDay(day, today);
            const dayStatus = dayStatuses[columnIndex];

            return (
              <div
                key={`${day.toISOString()}-overlay`}
                className={`relative border-r ${dayStatus.borderClass} ${
                  isTodayColumn ? "bg-blue-500/5" : ""
                } ${dayStatus.columnClass}`}
              >
                {dayBlocks.map((block) => (
                  <ScheduleBlockCard
                    key={block.id}
                    block={block}
                    isSelected={block.id === selectedBlockId}
                    isDragging={dragState?.blockId === block.id}
                    top={getBlockTop(block)}
                    height={getBlockHeight(block)}
                    timeLabel={formatBlockTime(block)}
                    onSelect={(e) => handleSelectBlock(e, block.id)}
                    onDragStart={(e) => handleBlockMouseDown(e, block)}
                  />
                ))}
              </div>
            );
          })}

          {selectedBlock && popupPosition && !dragState && !pendingConflict && !pendingCombine && (
            <div
              ref={popupRef}
              className="pointer-events-auto absolute z-40 w-40 rounded-lg border border-zinc-700 bg-zinc-950 p-2 shadow-xl"
              style={{
                left: `${popupPosition.x}px`,
                top: `${popupPosition.y}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 truncate text-xs font-medium text-zinc-400">
                {selectedBlock.title}
              </div>

              <button
                type="button"
                onClick={handleSplitChunk}
                className="mb-2 w-full rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800"
              >
                Split Chunk
              </button>

              <button
                type="button"
                onClick={clearMenus}
                className="w-full rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
              >
                Close
              </button>
            </div>
          )}

          {pendingConflict && (
            <div ref={popupRef}>
              <ScheduleConflictPopup
                pendingConflict={pendingConflict}
                onCancel={handleCancelConflict}
                onForcePlace={handleForcePlace}
                onFitAtEnd={handleFitAtEnd}
              />
            </div>
          )}

          {pendingCombine && (
            <div
              ref={popupRef}
              className="pointer-events-auto absolute z-50 w-56 rounded-lg border border-blue-500/40 bg-zinc-950 p-3 shadow-xl"
              style={{
                left: `${pendingCombine.popupPosition.x}px`,
                top: `${pendingCombine.popupPosition.y}px`,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="mb-2 text-sm font-semibold text-blue-300">
                Combine matching task chunks?
              </div>

              <div className="mb-3 text-xs text-zinc-400">
                These blocks belong to the same assignment. Merge them into one chunk.
              </div>

              <button
                type="button"
                onClick={handleCancelCombine}
                className="mb-2 w-full rounded-md border border-zinc-700 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-900"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirmCombine}
                className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500"
              >
                Combine Chunks
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}