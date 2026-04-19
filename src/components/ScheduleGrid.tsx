"use client";

import { useMemo, useRef } from "react";
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

function getLocalStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDayDifference(startDate: Date, endDate: Date) {
  const start = getLocalStartOfDay(startDate).getTime();
  const end = getLocalStartOfDay(endDate).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
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

function HourRow({
  hour,
  days,
  today,
}: {
  hour: number;
  days: Date[];
  today: Date;
}) {
  return (
    <>
      <div className="flex h-16 items-start justify-end border-b border-r border-zinc-800 bg-zinc-950 px-3 py-2 text-xs text-zinc-400">
        {formatHourLabel(hour)}
      </div>

      {days.map((day) => {
        const isTodayColumn = isSameDay(day, today);

        return (
          <div
            key={`${day.toISOString()}-${hour}`}
            className={`relative h-16 border-b border-r border-zinc-800 ${
              isTodayColumn ? "bg-zinc-900/70" : "bg-zinc-900/40"
            }`}
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
  const [dayOffset, setDayOffset] = useMemo(() => {
    return [0, () => {}] as const;
  }, []);

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
    selectedBlock,
    visibleBlocks,
    clearMenus,
    handleSelectBlock,
    handleBlockMouseDown,
    handleSplitChunk,
    handleCancelConflict,
    handleForcePlace,
    handleFitAtEnd,
  } = useScheduleBlocks({
    tasks,
    numberOfDays,
    visibleStartDate,
    overlayRef,
    minuteHeight: MINUTE_HEIGHT,
    timeLabelWidth: TIME_LABEL_WIDTH,
  });

  function handlePrevious() {
    clearMenus();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
  }

  function handleNext() {
    clearMenus();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
  }

  function handleToday() {
    clearMenus();
    // eslint-disable-next-line @typescript-eslint/no-empty-function
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
            const isTodayColumn = isSameDay(day, today);

            return (
              <div
                key={day.toISOString()}
                className={`sticky top-0 z-10 border-b border-r border-zinc-800 px-4 py-3 text-center ${
                  isTodayColumn ? "bg-zinc-900" : "bg-zinc-950"
                }`}
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
              </div>
            );
          })}

          {hours.map((hour) => (
            <HourRow key={hour} hour={hour} days={days} today={today} />
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

            return (
              <div
                key={`${day.toISOString()}-overlay`}
                className={`relative border-r border-zinc-800 ${
                  isTodayColumn ? "bg-blue-500/5" : ""
                }`}
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

          {selectedBlock && popupPosition && !dragState && !pendingConflict && (
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
        </div>
      </div>
    </div>
  );
}