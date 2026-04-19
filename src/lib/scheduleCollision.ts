export type ScheduleBlock = {
  id: string;
  assignmentId: string;
  title: string;
  blockDate: string;
  startHour: number;
  startMinute: number;
  durationMinutes: number;
  colorClass: string;
  chunkIndex: number;
  isManuallyPlaced: boolean;
};

export type PendingConflict = {
  blockId: string;
  originalBlock: ScheduleBlock;
  proposedBlock: ScheduleBlock;
  conflictBlockIds: string[];
  popupPosition: {
    x: number;
    y: number;
  };
};

export function parseLocalDate(dateString: string) {
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

export function formatDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getBlockStartMinutes(block: ScheduleBlock) {
  return block.startHour * 60 + block.startMinute;
}

export function getBlockEndMinutes(block: ScheduleBlock) {
  return getBlockStartMinutes(block) + block.durationMinutes;
}

export function blockOverlaps(a: ScheduleBlock, b: ScheduleBlock) {
  if (a.blockDate !== b.blockDate) return false;

  const aStart = getBlockStartMinutes(a);
  const aEnd = getBlockEndMinutes(a);
  const bStart = getBlockStartMinutes(b);
  const bEnd = getBlockEndMinutes(b);

  return aStart < bEnd && bStart < aEnd;
}

export function setBlockStartFromDateAndMinutes(
  block: ScheduleBlock,
  baseDate: Date,
  totalMinutes: number
) {
  const safeMinutes = Math.max(0, totalMinutes);
  const extraDays = Math.floor(safeMinutes / (24 * 60));
  const remainingMinutes = safeMinutes % (24 * 60);

  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + extraDays);

  return {
    ...block,
    blockDate: formatDateKey(nextDate),
    startHour: Math.floor(remainingMinutes / 60),
    startMinute: remainingMinutes % 60,
    isManuallyPlaced: true,
  };
}

export function getConflictingBlocks(
  blocks: ScheduleBlock[],
  proposedBlock: ScheduleBlock
) {
  return blocks.filter(
    (block) => block.id !== proposedBlock.id && blockOverlaps(block, proposedBlock)
  );
}

export function resolveForcePlace(
  allBlocks: ScheduleBlock[],
  proposedBlock: ScheduleBlock
) {
  const proposedDate = parseLocalDate(proposedBlock.blockDate);
  if (!proposedDate) {
    return allBlocks;
  }

  const proposedStart = getBlockStartMinutes(proposedBlock);
  const proposedEnd = getBlockEndMinutes(proposedBlock);

  const blocksOnSameDay = allBlocks
    .filter(
      (block) =>
        block.id !== proposedBlock.id && block.blockDate === proposedBlock.blockDate
    )
    .sort((a, b) => getBlockStartMinutes(a) - getBlockStartMinutes(b));

  let currentEnd = proposedEnd;

  const forcedBlocks = blocksOnSameDay.map((block) => {
    const blockStart = getBlockStartMinutes(block);
    const blockEnd = getBlockEndMinutes(block);

    if (blockEnd <= proposedStart) {
      return block;
    }

    if (blockStart < currentEnd) {
      const moved = setBlockStartFromDateAndMinutes(block, proposedDate, currentEnd);
      currentEnd += block.durationMinutes;
      return moved;
    }

    return block;
  });

  const forcedMap = new Map(forcedBlocks.map((block) => [block.id, block]));

  return allBlocks.map((block) => {
    if (block.id === proposedBlock.id) {
      return {
        ...proposedBlock,
        isManuallyPlaced: true,
      };
    }

    return forcedMap.get(block.id) || block;
  });
}

export function resolveFitAtEnd(
  allBlocks: ScheduleBlock[],
  proposedBlock: ScheduleBlock
) {
  const baseDate = parseLocalDate(proposedBlock.blockDate);
  if (!baseDate) {
    return allBlocks;
  }

  const duration = proposedBlock.durationMinutes;
  const dayBlocks = allBlocks
    .filter(
      (block) =>
        block.id !== proposedBlock.id && block.blockDate === proposedBlock.blockDate
    )
    .sort((a, b) => getBlockStartMinutes(a) - getBlockStartMinutes(b));

  let candidateStart = getBlockStartMinutes(proposedBlock);

  for (const block of dayBlocks) {
    const blockStart = getBlockStartMinutes(block);
    const blockEnd = getBlockEndMinutes(block);

    if (candidateStart + duration <= blockStart) {
      break;
    }

    if (candidateStart < blockEnd) {
      candidateStart = blockEnd;
    }
  }

  const fittedBlock = setBlockStartFromDateAndMinutes(
    proposedBlock,
    baseDate,
    candidateStart
  );

  return allBlocks.map((block) =>
    block.id === proposedBlock.id
      ? { ...fittedBlock, isManuallyPlaced: true }
      : block
  );
}