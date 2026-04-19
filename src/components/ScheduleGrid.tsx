"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import ScheduleConflictPopup from "@/components/ScheduleConflictPopup";
import {
  formatDateKey,
  getConflictingBlocks,
  parseLocalDate,
  resolveFitAtEnd,
  resolveForcePlace,
  type PendingConflict,
  type ScheduleBlock,
} from "@/lib/scheduleCollision";

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

type PopupPosition = {
  x: number;
  y: number;
};

type DragState = {
  blockId: string;
  pointerOffsetY: number;
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

function getBlockStartMinutes(block: ScheduleBlock) {
  return block.startHour * 60 + block.startMinute;
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

function mapTasksToScheduleBlocks(tasks: CalendarTask[]): ScheduleBlock[] {
  return tasks
    .map((task, index) => {
      const taskDate = parseLocalDate(task.dueDate);
      if (!taskDate) return null;

      return {
        id: task._id,
        assignmentId: task._id,
        title: task.title,
        blockDate: formatDateKey(taskDate),
        startHour: 18,
        startMinute: 0,
        durationMinutes: Math.max(task.duration || 0, 30),
        colorClass: getColorClass(index),
        chunkIndex: 0,
        isManuallyPlaced: false,
      } satisfies ScheduleBlock;
    })
    .filter((block): block is ScheduleBlock => block !== null);
}

function getVisibleDayOffset(blockDate: string, visibleStartDate: Date) {
  const blockDateObj = parseLocalDate(blockDate);
  if (!blockDateObj) return null;
  return getDayDifference(visibleStartDate, blockDateObj);
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
  splitMinutes: number
) {
  const remainingMinutes = block.durationMinutes - splitMinutes;
  const blockStartTotal = block.startHour * 60 + block.startMinute;
  const splitStartTotal = blockStartTotal + remainingMinutes;

  const extraDays = Math.floor(splitStartTotal / (24 * 60));
  const newStartTotal = splitStartTotal % (24 * 60);

  const baseDate = parseLocalDate(block.blockDate);
  if (!baseDate) return null;

  const newDate = new Date(baseDate);
  newDate.setDate(newDate.getDate() + extraDays);

  const updatedOriginal: ScheduleBlock = {
    ...block,
    durationMinutes: remainingMinutes,
    isManuallyPlaced: true,
  };

  const newBlock: ScheduleBlock = {
    ...block,
    id: newBlockId,
    blockDate: formatDateKey(newDate),
    startHour: Math.floor(newStartTotal / 60),
    startMinute: newStartTotal % 60,
    durationMinutes: splitMinutes,
    chunkIndex: block.chunkIndex + 1,
    isManuallyPlaced: true,
  };

  return { updatedOriginal, newBlock };
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

function snapMinutesToThirty(totalMinutes: number) {
  return Math.round(totalMinutes / 30) * 30;
}

export default function ScheduleGrid({
  tasks,
  numberOfDays = 7,
}: ScheduleGridProps) {
  const today = useMemo(() => getLocalStartOfDay(new Date()), []);
  const [dayOffset, setDayOffset] = useState(0);
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [pendingConflict, setPendingConflict] = useState<PendingConflict | null>(
    null
  );

  const popupRef = useRef<HTMLDivElement | null>(null);
  const overlayRef = useRef<HTMLDivElement | null>(null);

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
      const generatedBlocks = mapTasksToScheduleBlocks(tasks);

      const manualBlocks = prevBlocks.filter((block) => block.isManuallyPlaced);
      const manualAssignmentIds = new Set(
        manualBlocks.map((block) => block.assignmentId)
      );

      const generatedForUneditedAssignments = generatedBlocks.filter(
        (block) => !manualAssignmentIds.has(block.assignmentId)
      );

      return [...generatedForUneditedAssignments, ...manualBlocks];
    });
  }, [tasks]);

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      const target = event.target as Node;
      if (popupRef.current?.contains(target)) return;
      if (pendingConflict) return;

      setSelectedBlockId(null);
      setPopupPosition(null);
    }

    if (selectedBlockId && !dragState) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [selectedBlockId, dragState, pendingConflict]);

  useEffect(() => {
    function handlePointerMove(event: MouseEvent) {
      if (!dragState || !overlayRef.current) return;

      const overlayRect = overlayRef.current.getBoundingClientRect();
      const usableWidth = overlayRect.width - TIME_LABEL_WIDTH;
      const dayColumnWidth = usableWidth / numberOfDays;

      const pointerXInside = event.clientX - overlayRect.left - TIME_LABEL_WIDTH;
      const pointerYInside = event.clientY - overlayRect.top - dragState.pointerOffsetY;

      let columnIndex = Math.floor(pointerXInside / dayColumnWidth);
      columnIndex = clamp(columnIndex, 0, numberOfDays - 1);

      const snappedMinutes = snapMinutesToThirty(
        clamp(Math.round(pointerYInside / MINUTE_HEIGHT), 0, 24 * 60)
      );

      const startMinutesCapped = clamp(snappedMinutes, 0, 24 * 60 - 30);

      const newDate = new Date(visibleStartDate);
      newDate.setDate(visibleStartDate.getDate() + columnIndex);

      setScheduleBlocks((prev) =>
        prev.map((block) =>
          block.id === dragState.blockId
            ? {
                ...block,
                blockDate: formatDateKey(newDate),
                startHour: Math.floor(startMinutesCapped / 60),
                startMinute: startMinutesCapped % 60,
                isManuallyPlaced: true,
              }
            : block
        )
      );
    }

    function handlePointerUp(event: MouseEvent) {
      if (!dragState || !overlayRef.current) return;

      const proposedBlock = scheduleBlocks.find(
        (block) => block.id === dragState.blockId
      );
      if (!proposedBlock) {
        setDragState(null);
        return;
      }

      const startingBlock =
        scheduleBlocks.find((block) => block.id === dragState.blockId) || proposedBlock;

      const allOtherBlocks = scheduleBlocks.filter(
        (block) => block.id !== dragState.blockId
      );

      const conflicts = getConflictingBlocks(allOtherBlocks, proposedBlock);

      const overlayRect = overlayRef.current.getBoundingClientRect();
      let popupX = event.clientX - overlayRect.left + 8;
      let popupY = event.clientY - overlayRect.top + 8;

      popupX = clamp(popupX, 8, overlayRect.width - 190);
      popupY = clamp(popupY, 8, overlayRect.height - 150);

      if (conflicts.length > 0) {
        setPendingConflict({
          blockId: proposedBlock.id,
          originalBlock: { ...startingBlock },
          proposedBlock: { ...proposedBlock },
          conflictBlockIds: conflicts.map((block) => block.id),
          popupPosition: { x: popupX, y: popupY },
        });
        setSelectedBlockId(null);
        setPopupPosition(null);
      } else {
        setPendingConflict(null);
      }

      setDragState(null);
    }

    if (dragState) {
      window.addEventListener("mousemove", handlePointerMove);
      window.addEventListener("mouseup", handlePointerUp);
    }

    return () => {
      window.removeEventListener("mousemove", handlePointerMove);
      window.removeEventListener("mouseup", handlePointerUp);
    };
  }, [dragState, numberOfDays, visibleStartDate, scheduleBlocks]);

  const selectedBlock = useMemo(
    () => scheduleBlocks.find((block) => block.id === selectedBlockId) || null,
    [scheduleBlocks, selectedBlockId]
  );

  function handlePrevious() {
    setSelectedBlockId(null);
    setPopupPosition(null);
    setPendingConflict(null);
    setDayOffset((prev) => prev - 1);
  }

  function handleNext() {
    setSelectedBlockId(null);
    setPopupPosition(null);
    setPendingConflict(null);
    setDayOffset((prev) => prev + 1);
  }

  function handleToday() {
    setSelectedBlockId(null);
    setPopupPosition(null);
    setPendingConflict(null);
    setDayOffset(0);
  }

  function handleSelectBlock(
    event: React.MouseEvent<HTMLDivElement>,
    blockId: string
  ) {
    event.stopPropagation();

    if (!overlayRef.current) {
      setSelectedBlockId(blockId);
      setPopupPosition({ x: 16, y: 16 });
      return;
    }

    const overlayRect = overlayRef.current.getBoundingClientRect();
    const menuWidth = 170;
    const menuHeight = 92;

    let x = event.clientX - overlayRect.left + 8;
    let y = event.clientY - overlayRect.top + 8;

    const maxX = overlayRect.width - menuWidth - 8;
    const maxY = overlayRect.height - menuHeight - 8;

    x = Math.max(8, Math.min(x, maxX));
    y = Math.max(8, Math.min(y, maxY));

    setPendingConflict(null);
    setSelectedBlockId(blockId);
    setPopupPosition({ x, y });
  }

  function handleBlockMouseDown(
    event: React.MouseEvent<HTMLDivElement>,
    block: ScheduleBlock
  ) {
    event.preventDefault();
    event.stopPropagation();

    const blockRect = event.currentTarget.getBoundingClientRect();
    const pointerOffsetY = event.clientY - blockRect.top;

    setPendingConflict(null);
    setSelectedBlockId(block.id);
    setPopupPosition(null);
    setDragState({
      blockId: block.id,
      pointerOffsetY,
    });
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
      splitMinutes
    );

    if (!splitResult) {
      window.alert("Unable to split this block.");
      return;
    }

    setScheduleBlocks((prev) => {
      const withoutOld = prev.filter((block) => block.id !== selectedBlock.id);
      return [...withoutOld, splitResult.updatedOriginal, splitResult.newBlock];
    });

    setSelectedBlockId(splitResult.newBlock.id);
    setPopupPosition(null);
  }

  function handleCancelConflict() {
    if (!pendingConflict) return;

    setScheduleBlocks((prev) =>
      prev.map((block) =>
        block.id === pendingConflict.blockId ? pendingConflict.originalBlock : block
      )
    );

    setPendingConflict(null);
  }

  function handleForcePlace() {
    if (!pendingConflict) return;

    setScheduleBlocks((prev) =>
      resolveForcePlace(prev, pendingConflict.proposedBlock)
    );

    setPendingConflict(null);
  }

  function handleFitAtEnd() {
    if (!pendingConflict) return;

    setScheduleBlocks((prev) =>
      resolveFitAtEnd(prev, pendingConflict.proposedBlock)
    );

    setPendingConflict(null);
  }

  const visibleBlocks = useMemo(() => {
    return scheduleBlocks
      .map((block) => {
        const visibleDayOffset = getVisibleDayOffset(
          block.blockDate,
          visibleStartDate
        );

        return {
          ...block,
          visibleDayOffset,
        };
      })
      .filter(
        (
          block
        ): block is ScheduleBlock & {
          visibleDayOffset: number;
        } =>
          block.visibleDayOffset !== null &&
          block.visibleDayOffset >= 0 &&
          block.visibleDayOffset < numberOfDays
      );
  }, [scheduleBlocks, visibleStartDate, numberOfDays]);

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
                {dayBlocks.map((block) => {
                  const isSelected = block.id === selectedBlockId;
                  const blockHeight = getBlockHeight(block);
                  const isCompact = blockHeight < 52;
                  const isTiny = blockHeight < 34;

                  return (
                    <div
                      key={block.id}
                      className={`pointer-events-auto absolute left-2 right-2 cursor-grab overflow-hidden rounded-xl border px-3 py-2 text-white shadow-lg ${block.colorClass} ${
                        isSelected ? "ring-2 ring-white" : ""
                      } ${dragState?.blockId === block.id ? "cursor-grabbing opacity-90" : ""}`}
                      style={{
                        top: `${getBlockTop(block)}px`,
                        height: `${blockHeight}px`,
                      }}
                      onClick={(e) => handleSelectBlock(e, block.id)}
                      onMouseDown={(e) => handleBlockMouseDown(e, block)}
                    >
                      <div
                        className={`overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium text-white/90 ${
                          isTiny ? "leading-tight" : ""
                        }`}
                      >
                        {formatBlockTime(block)}
                      </div>

                      {!isTiny && (
                        <div
                          className={`mt-1 overflow-hidden text-ellipsis font-semibold leading-tight ${
                            isCompact ? "whitespace-nowrap text-xs" : "text-sm"
                          }`}
                        >
                          {block.title}
                        </div>
                      )}
                    </div>
                  );
                })}
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
                onClick={() => {
                  setSelectedBlockId(null);
                  setPopupPosition(null);
                }}
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