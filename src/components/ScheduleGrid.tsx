"use client";

import { useEffect, useMemo, useState } from "react";

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

type ScheduleBlock = {
  id: string;
  assignmentId: string;
  title: string;
  dayOffset: number;
  startHour: number;
  startMinute: number;
  durationMinutes: number;
  colorClass: string;
  chunkIndex: number;
  isManuallyPlaced: boolean;
};

const HOUR_HEIGHT = 64;
const MINUTE_HEIGHT = HOUR_HEIGHT / 60;
const TOTAL_DAY_HEIGHT = 24 * HOUR_HEIGHT;

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

function getColorClass(index: number) {
  const colors = [
    "bg-blue-500/90 border-blue-300",
    "bg-emerald-500/90 border-emerald-300",
    "bg-violet-500/90 border-violet-300",
    "bg-amber-500/90 border-amber-300",
    "bg-rose-500/90 border-rose-300",
    "bg-cyan-500/90 border-cyan-300",
  ];

  return colors[index % colors.length];
}

function mapTasksToScheduleBlocks(
  tasks: CalendarTask[],
  visibleStartDate: Date,
  numberOfDays: number
): ScheduleBlock[] {
  const visibleEndDate = new Date(visibleStartDate);
  visibleEndDate.setDate(visibleStartDate.getDate() + numberOfDays - 1);

  const blocks: ScheduleBlock[] = [];
  const blocksPerDay: Record<number, number> = {};

  tasks.forEach((task, index) => {
    const taskDate = parseLocalDate(task.dueDate);
    if (!taskDate) return;

    if (taskDate < visibleStartDate || taskDate > visibleEndDate) {
      return;
    }

    const dayOffset = getDayDifference(visibleStartDate, taskDate);

    if (dayOffset < 0 || dayOffset >= numberOfDays) {
      return;
    }

    const existingCountForDay = blocksPerDay[dayOffset] || 0;

    const startHour = 18 + existingCountForDay;
    const startMinute = 0;

    blocks.push({
      id: task._id,
      assignmentId: task._id,
      title: task.title,
      dayOffset,
      startHour,
      startMinute,
      durationMinutes: Math.max(task.duration || 0, 30),
      colorClass: getColorClass(index),
      chunkIndex: 0,
      isManuallyPlaced: false,
    });

    blocksPerDay[dayOffset] = existingCountForDay + 1;
  });

  return blocks;
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

function splitMinutesAcrossDays(
  block: ScheduleBlock,
  newBlockId: string,
  splitMinutes: number,
  numberOfDays: number
) {
  const remainingMinutes = block.durationMinutes - splitMinutes;
  const blockStartTotal = block.startHour * 60 + block.startMinute;
  const splitStartTotal = blockStartTotal + remainingMinutes;

  let newDayOffset = block.dayOffset;
  let newStartTotal = splitStartTotal;

  while (newStartTotal >= 24 * 60) {
    newStartTotal -= 24 * 60;
    newDayOffset += 1;
  }

  if (newDayOffset >= numberOfDays) {
    return null;
  }

  const updatedOriginal: ScheduleBlock = {
    ...block,
    durationMinutes: remainingMinutes,
    isManuallyPlaced: true,
  };

  const newBlock: ScheduleBlock = {
    ...block,
    id: newBlockId,
    dayOffset: newDayOffset,
    startHour: Math.floor(newStartTotal / 60),
    startMinute: newStartTotal % 60,
    durationMinutes: splitMinutes,
    chunkIndex: block.chunkIndex + 1,
    isManuallyPlaced: true,
  };

  return { updatedOriginal, newBlock };
}

export default function ScheduleGrid({
  tasks,
  numberOfDays = 7,
}: ScheduleGridProps) {
  const today = useMemo(() => getLocalStartOfDay(new Date()), []);
  const [dayOffset, setDayOffset] = useState(0);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

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

  useEffect(() => {
    setScheduleBlocks((prevBlocks) => {
      const generatedBlocks = mapTasksToScheduleBlocks(
        tasks,
        visibleStartDate,
        numberOfDays
      );

      const manualBlocks = prevBlocks.filter((block) => block.isManuallyPlaced);
      const manualAssignmentIds = new Set(
        manualBlocks.map((block) => block.assignmentId)
      );

      const generatedForUneditedAssignments = generatedBlocks.filter(
        (block) => !manualAssignmentIds.has(block.assignmentId)
      );

      return [...generatedForUneditedAssignments, ...manualBlocks];
    });
  }, [tasks, visibleStartDate, numberOfDays]);

  const selectedBlock = useMemo(
    () => scheduleBlocks.find((block) => block.id === selectedBlockId) || null,
    [scheduleBlocks, selectedBlockId]
  );

  function handlePrevious() {
    setSelectedBlockId(null);
    setDayOffset((prev) => prev - 1);
  }

  function handleNext() {
    setSelectedBlockId(null);
    setDayOffset((prev) => prev + 1);
  }

  function handleToday() {
    setSelectedBlockId(null);
    setDayOffset(0);
  }

  function handleSelectBlock(blockId: string) {
    setSelectedBlockId((prev) => (prev === blockId ? null : blockId));
  }

  function handleSplitChunk() {
    if (!selectedBlock) return;

    const input = window.prompt(
      `Split how many minutes from "${selectedBlock.title}"?`,
      "30"
    );

    if (!input) return;

    const splitMinutes = Number(input);

    if (
      Number.isNaN(splitMinutes) ||
      splitMinutes <= 0 ||
      splitMinutes >= selectedBlock.durationMinutes
    ) {
      window.alert("Enter a number greater than 0 and less than the block duration.");
      return;
    }

    const newBlockId = `${selectedBlock.assignmentId}-chunk-${Date.now()}`;

    const splitResult = splitMinutesAcrossDays(
      selectedBlock,
      newBlockId,
      splitMinutes,
      numberOfDays
    );

    if (!splitResult) {
      window.alert("That split would push the new chunk outside the current visible window.");
      return;
    }

    setScheduleBlocks((prev) => {
      const withoutOld = prev.filter((block) => block.id !== selectedBlock.id);
      return [...withoutOld, splitResult.updatedOriginal, splitResult.newBlock];
    });

    setSelectedBlockId(splitResult.newBlock.id);
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
          className="pointer-events-none relative -mt-[1536px] grid min-w-[900px]"
          style={{
            gridTemplateColumns: `80px repeat(${numberOfDays}, minmax(140px, 1fr))`,
            height: `${TOTAL_DAY_HEIGHT}px`,
          }}
        >
          <div />

          {days.map((day, columnIndex) => {
            const dayBlocks = scheduleBlocks.filter(
              (block) => block.dayOffset === columnIndex
            );
            const isTodayColumn = isSameDay(day, today);

            return (
              <div
                key={`${day.toISOString()}-overlay`}
                className={`relative border-r border-zinc-800 ${
                  isTodayColumn ? "bg-blue-500/5" : ""
                }`}
              >
                {dayBlocks.map((block) => {
                  const isSelected = block.id === selectedBlockId;

                  return (
                    <div
                      key={block.id}
                      className={`pointer-events-auto absolute left-2 right-2 rounded-xl border px-3 py-2 text-white shadow-lg cursor-pointer ${block.colorClass} ${
                        isSelected ? "ring-2 ring-white" : ""
                      }`}
                      style={{
                        top: `${getBlockTop(block)}px`,
                        height: `${getBlockHeight(block)}px`,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectBlock(block.id);
                      }}
                    >
                      <div className="text-xs font-medium text-white/90">
                        {formatBlockTime(block)}
                      </div>
                      <div className="mt-1 text-sm font-semibold leading-tight">
                        {block.title}
                      </div>

                      {isSelected && (
                        <div className="absolute left-1/2 top-full z-30 mt-2 w-36 -translate-x-1/2 rounded-lg border border-zinc-700 bg-zinc-950 p-2 shadow-xl">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleSplitChunk();
                            }}
                            className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800"
                          >
                            Split Chunk
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}