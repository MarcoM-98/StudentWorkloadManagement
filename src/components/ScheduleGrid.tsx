"use client";

import { useMemo, useRef, useState } from "react";
import ScheduleBlockCard from "@/components/ScheduleBlockCard";
import ScheduleConflictPopup from "@/components/ScheduleConflictPopup";
import ScheduleDayHeaderRow from "@/components/ScheduleDayHeaderRow";
import ScheduleGridHeader from "@/components/ScheduleGridHeader";
import ScheduleHourRows from "@/components/ScheduleHourRows";
import { useScheduleBlocks } from "@/lib/useScheduleBlocks";
import WorkloadSummary from "@/components/WorkloadSummary";
import {
  buildDays,
  DAILY_CAPACITY_MINUTES,
  formatBlockTime,
  getBlockHeight,
  getBlockTop,
  getDayLoadStatus,
  getLocalStartOfDay,
  isSameDay,
  MINUTE_HEIGHT,
  TIME_LABEL_WIDTH,
  TOTAL_DAY_HEIGHT,
} from "@/lib/scheduleGridUtils";

type CalendarTask = {
  _id: string;
  title: string;
  dueDate: string;
  duration: number;
  priority?: string;
  customPercentage?: number | null;
};

type ScheduleGridProps = {
  tasks: CalendarTask[];
  numberOfDays?: number;
};

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

  const hours = useMemo(
    () => Array.from({ length: 24 }, (_, index) => index),
    []
  );

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

  const dayLoads = useMemo(
    () =>
      days.map((_, index) =>
        visibleBlocks
          .filter((block) => block.visibleDayOffset === index)
          .reduce((sum, block) => sum + block.durationMinutes, 0)
      ),
    [days, visibleBlocks]
  );

  const dayStatuses = useMemo(
    () => dayLoads.map((minutes) => getDayLoadStatus(minutes)),
    [dayLoads]
  );

  const startLabel = `${days[0].getMonth() + 1}/${days[0].getDate()}`;
  const endLabel = `${days[days.length - 1].getMonth() + 1}/${days[days.length - 1].getDate()}`;

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
      <>
    <WorkloadSummary
      blocks={visibleBlocks}
      startDate={visibleStartDate}
      numberOfDays={numberOfDays}
    />
    <div className="w-full rounded-2xl border border-zinc-800 bg-zinc-950">
      <ScheduleGridHeader
        startLabel={startLabel}
        endLabel={endLabel}
        dailyCapacityHours={DAILY_CAPACITY_MINUTES / 60}
        onPrevious={handlePrevious}
        onToday={handleToday}
        onNext={handleNext}
      />

      <div className="w-full overflow-x-auto rounded-b-2xl">
        <div
          className="grid min-w-[900px]"
          style={{
            gridTemplateColumns: `80px repeat(${numberOfDays}, minmax(140px, 1fr))`,
          }}
        >
          <ScheduleDayHeaderRow
            days={days}
            today={today}
            dayStatuses={dayStatuses}
          />

          <ScheduleHourRows
            hours={hours}
            days={days}
            today={today}
            dayStatuses={dayStatuses}
          />
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

          {selectedBlock &&
            popupPosition &&
            !dragState &&
            !pendingConflict &&
            !pendingCombine && (
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
    </>
  );
}