"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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

type PopupPosition = {
  x: number;
  y: number;
};

type DragState = {
  blockId: string;
  pointerOffsetY: number;
};

type UseScheduleBlocksParams = {
  tasks: CalendarTask[];
  numberOfDays: number;
  visibleStartDate: Date;
  overlayRef: React.RefObject<HTMLDivElement | null>;
  minuteHeight: number;
  timeLabelWidth: number;
};

function getLocalStartOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function getDayDifference(startDate: Date, endDate: Date) {
  const start = getLocalStartOfDay(startDate).getTime();
  const end = getLocalStartOfDay(endDate).getTime();
  return Math.round((end - start) / (1000 * 60 * 60 * 24));
}

function getVisibleDayOffset(blockDate: string, visibleStartDate: Date) {
  const blockDateObj = parseLocalDate(blockDate);
  if (!blockDateObj) return null;
  return getDayDifference(visibleStartDate, blockDateObj);
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

export function useScheduleBlocks({
  tasks,
  numberOfDays,
  visibleStartDate,
  overlayRef,
  minuteHeight,
  timeLabelWidth,
}: UseScheduleBlocksParams) {
  const [scheduleBlocks, setScheduleBlocks] = useState<ScheduleBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [popupPosition, setPopupPosition] = useState<PopupPosition | null>(null);
  const [dragState, setDragState] = useState<DragState | null>(null);
  const [pendingConflict, setPendingConflict] = useState<PendingConflict | null>(
    null
  );

  const popupRef = useRef<HTMLDivElement | null>(null);

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
      const usableWidth = overlayRect.width - timeLabelWidth;
      const dayColumnWidth = usableWidth / numberOfDays;

      const pointerXInside = event.clientX - overlayRect.left - timeLabelWidth;
      const pointerYInside = event.clientY - overlayRect.top - dragState.pointerOffsetY;

      let columnIndex = Math.floor(pointerXInside / dayColumnWidth);
      columnIndex = clamp(columnIndex, 0, numberOfDays - 1);

      const snappedMinutes = snapMinutesToThirty(
        clamp(Math.round(pointerYInside / minuteHeight), 0, 24 * 60)
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
  }, [
    dragState,
    numberOfDays,
    visibleStartDate,
    scheduleBlocks,
    overlayRef,
    minuteHeight,
    timeLabelWidth,
  ]);

  const selectedBlock = useMemo(
    () => scheduleBlocks.find((block) => block.id === selectedBlockId) || null,
    [scheduleBlocks, selectedBlockId]
  );

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

  function clearMenus() {
    setSelectedBlockId(null);
    setPopupPosition(null);
    setPendingConflict(null);
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

  return {
    popupRef,
    scheduleBlocks,
    selectedBlockId,
    popupPosition,
    dragState,
    pendingConflict,
    selectedBlock,
    visibleBlocks,
    clearMenus,
    setSelectedBlockId,
    setPopupPosition,
    handleSelectBlock,
    handleBlockMouseDown,
    handleSplitChunk,
    handleCancelConflict,
    handleForcePlace,
    handleFitAtEnd,
  };
}