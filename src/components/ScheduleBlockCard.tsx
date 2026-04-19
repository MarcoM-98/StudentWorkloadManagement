"use client";

import type { ScheduleBlock } from "@/lib/scheduleCollision";

type ScheduleBlockCardProps = {
  block: ScheduleBlock;
  isSelected: boolean;
  isDragging: boolean;
  top: number;
  height: number;
  timeLabel: string;
  onSelect: (event: React.MouseEvent<HTMLDivElement>) => void;
  onDragStart: (event: React.MouseEvent<HTMLDivElement>) => void;
};

export default function ScheduleBlockCard({
  block,
  isSelected,
  isDragging,
  top,
  height,
  timeLabel,
  onSelect,
  onDragStart,
}: ScheduleBlockCardProps) {
  const isCompact = height < 52;
  const isTiny = height < 34;

  return (
    <div
      className={`pointer-events-auto absolute left-2 right-2 cursor-grab overflow-hidden rounded-xl border px-3 py-2 text-white shadow-lg ${block.colorClass} ${
        isSelected ? "ring-2 ring-white" : ""
      } ${isDragging ? "cursor-grabbing opacity-90" : ""}`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
      }}
      onClick={onSelect}
      onMouseDown={onDragStart}
    >
      <div
        className={`overflow-hidden text-ellipsis whitespace-nowrap text-xs font-medium text-white/90 ${
          isTiny ? "leading-tight" : ""
        }`}
      >
        {timeLabel}
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
}