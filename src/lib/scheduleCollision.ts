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
  priority?: string;
  customPercentage?: number | null;
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

const MINUTES_PER_DAY = 24 * 60;
const NEXT_WORK_START_MINUTES = 9 * 60;
const WORK_DAY_END_MINUTES = 22 * 60;

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

function normalizeStartToDayWindow(
  baseDate: Date,
  totalMinutes: number,
  durationMinutes: number
) {
  const nextDate = new Date(baseDate);
  let startMinutes = Math.max(0, totalMinutes);

  while (
    durationMinutes < MINUTES_PER_DAY &&
    startMinutes + durationMinutes > MINUTES_PER_DAY
  ) {
    nextDate.setDate(nextDate.getDate() + 1);
    startMinutes = NEXT_WORK_START_MINUTES;
  }

  return {
    nextDate,
    startMinutes,
  };
}

export function setBlockStartFromDateAndMinutes(
  block: ScheduleBlock,
  baseDate: Date,
  totalMinutes: number
) {
  const safeMinutes = Math.max(0, totalMinutes);
  const extraDays = Math.floor(safeMinutes / MINUTES_PER_DAY);
  const remainingMinutes = safeMinutes % MINUTES_PER_DAY;

  const nextDate = new Date(baseDate);
  nextDate.setDate(nextDate.getDate() + extraDays);

  const normalized = normalizeStartToDayWindow(
    nextDate,
    remainingMinutes,
    block.durationMinutes
  );

  return {
    ...block,
    blockDate: formatDateKey(normalized.nextDate),
    startHour: Math.floor(normalized.startMinutes / 60),
    startMinute: normalized.startMinutes % 60,
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

export function resolveCombineChunks(
  allBlocks: ScheduleBlock[],
  draggedBlock: ScheduleBlock,
  targetBlock: ScheduleBlock
) {
  if (draggedBlock.assignmentId !== targetBlock.assignmentId) {
    return allBlocks;
  }

  if (draggedBlock.id === targetBlock.id) {
    return allBlocks;
  }

  const remainingBlocks = allBlocks.filter(
    (block) => block.id !== draggedBlock.id && block.id !== targetBlock.id
  );

  const combinedBlock: ScheduleBlock = {
    ...targetBlock,
    durationMinutes:
      targetBlock.durationMinutes + draggedBlock.durationMinutes,
    isManuallyPlaced: true,
  };

  return resolveForcePlace([...remainingBlocks, combinedBlock], combinedBlock);
}

function buildChunkFromPlacement(
  source: ScheduleBlock,
  id: string,
  blockDate: string,
  startMinutes: number,
  durationMinutes: number,
  chunkIndex: number
): ScheduleBlock {
  return {
    ...source,
    id,
    blockDate,
    startHour: Math.floor(startMinutes / 60),
    startMinute: startMinutes % 60,
    durationMinutes,
    chunkIndex,
    isManuallyPlaced: true,
  };
}

function getBlocksOnDate(allBlocks: ScheduleBlock[], blockDate: string) {
  return allBlocks
    .filter((block) => block.blockDate === blockDate)
    .sort((a, b) => getBlockStartMinutes(a) - getBlockStartMinutes(b));
}

function getForwardChainEnd(
  allBlocks: ScheduleBlock[],
  proposedBlock: ScheduleBlock
) {
  const sameDayBlocks = getBlocksOnDate(allBlocks, proposedBlock.blockDate).filter(
    (block) => block.id !== proposedBlock.id
  );

  const proposedStart = getBlockStartMinutes(proposedBlock);
  let chainEnd = proposedStart;
  let changed = true;

  while (changed) {
    changed = false;

    for (const block of sameDayBlocks) {
      const blockStart = getBlockStartMinutes(block);
      const blockEnd = getBlockEndMinutes(block);

      if (blockStart <= chainEnd && blockEnd > chainEnd) {
        chainEnd = blockEnd;
        changed = true;
      }

      if (
        blockStart < proposedStart + proposedBlock.durationMinutes &&
        blockEnd > chainEnd
      ) {
        chainEnd = Math.max(chainEnd, blockEnd);
        changed = true;
      }
    }
  }

  return chainEnd;
}

function splitBlockForwardFromStart(
  sourceBlock: ScheduleBlock,
  startDate: Date,
  startMinutes: number
): ScheduleBlock[] {
  let remainingMinutes = sourceBlock.durationMinutes;
  let searchDate = new Date(startDate);
  let cursor = startMinutes;
  let nextChunkIndex = sourceBlock.chunkIndex;
  let firstChunkUsedOriginalId = false;

  const chunks: ScheduleBlock[] = [];

  while (remainingMinutes > 0) {
    const dateKey = formatDateKey(searchDate);

    if (cursor < NEXT_WORK_START_MINUTES && dateKey !== sourceBlock.blockDate) {
      cursor = NEXT_WORK_START_MINUTES;
    }

    const availableMinutes = WORK_DAY_END_MINUTES - cursor;
    const chunkMinutes = Math.min(remainingMinutes, availableMinutes);

    if (chunkMinutes > 0) {
      const chunkId = firstChunkUsedOriginalId
        ? `${sourceBlock.assignmentId}-chunk-${Date.now()}-${nextChunkIndex}`
        : sourceBlock.id;

      const chunk = buildChunkFromPlacement(
        sourceBlock,
        chunkId,
        dateKey,
        cursor,
        chunkMinutes,
        nextChunkIndex
      );

      chunks.push(chunk);
      remainingMinutes -= chunkMinutes;
      nextChunkIndex += 1;
      firstChunkUsedOriginalId = true;
    }

    if (remainingMinutes > 0) {
      searchDate.setDate(searchDate.getDate() + 1);
      cursor = NEXT_WORK_START_MINUTES;
    }
  }

  return chunks;
}

export function resolveForcePlace(
  allBlocks: ScheduleBlock[],
  proposedBlock: ScheduleBlock
) {
  const proposedDate = parseLocalDate(proposedBlock.blockDate);
  if (!proposedDate) {
    return allBlocks;
  }

  const normalizedProposed = setBlockStartFromDateAndMinutes(
    proposedBlock,
    proposedDate,
    getBlockStartMinutes(proposedBlock)
  );

  const normalizedProposedDate = parseLocalDate(normalizedProposed.blockDate);
  if (!normalizedProposedDate) {
    return allBlocks;
  }

  const proposedStart = getBlockStartMinutes(normalizedProposed);
  const proposedEnd = getBlockEndMinutes(normalizedProposed);

  const unaffectedBlocks = allBlocks.filter(
    (block) =>
      block.id !== normalizedProposed.id &&
      block.blockDate !== normalizedProposed.blockDate
  );

  const sameDayBlocks = allBlocks
    .filter(
      (block) =>
        block.id !== normalizedProposed.id &&
        block.blockDate === normalizedProposed.blockDate
    )
    .sort((a, b) => getBlockStartMinutes(a) - getBlockStartMinutes(b));

  const resolvedSameDayBlocks: ScheduleBlock[] = [];
  const overflowChunks: ScheduleBlock[] = [];

  let currentEnd = proposedEnd;

  for (const block of sameDayBlocks) {
    const blockStart = getBlockStartMinutes(block);
    const blockEnd = getBlockEndMinutes(block);

    if (blockEnd <= proposedStart) {
      resolvedSameDayBlocks.push(block);
      continue;
    }

    if (blockStart < currentEnd) {
      const movedStartDate = parseLocalDate(normalizedProposed.blockDate);
      if (!movedStartDate) {
        resolvedSameDayBlocks.push(block);
        continue;
      }

      const splitChunks = splitBlockForwardFromStart(
        {
          ...block,
          isManuallyPlaced: true,
        },
        movedStartDate,
        currentEnd
      );

      const firstChunk = splitChunks[0];
      if (firstChunk.blockDate === normalizedProposed.blockDate) {
        resolvedSameDayBlocks.push(firstChunk);
      } else {
        overflowChunks.push(firstChunk);
      }

      if (splitChunks.length > 1) {
        overflowChunks.push(...splitChunks.slice(1));
      }

      currentEnd =
        firstChunk.blockDate === normalizedProposed.blockDate
          ? getBlockEndMinutes(firstChunk)
          : currentEnd;
    } else {
      resolvedSameDayBlocks.push(block);
    }
  }

  return [
    ...unaffectedBlocks,
    ...resolvedSameDayBlocks,
    normalizedProposed,
    ...overflowChunks,
  ];
}

export function resolveFitAtEnd(
  allBlocks: ScheduleBlock[],
  proposedBlock: ScheduleBlock
) {
  const baseDate = parseLocalDate(proposedBlock.blockDate);
  if (!baseDate) {
    return allBlocks;
  }

  const blocksWithoutProposed = allBlocks.filter(
    (block) => block.id !== proposedBlock.id
  );

  const forwardStart = getForwardChainEnd(blocksWithoutProposed, proposedBlock);

  let remainingMinutes = proposedBlock.durationMinutes;
  let searchDate = new Date(baseDate);
  let cursor = forwardStart;

  const newChunks: ScheduleBlock[] = [];
  let nextChunkIndex = proposedBlock.chunkIndex;
  let firstChunkUsedOriginalId = false;

  while (remainingMinutes > 0) {
    const dateKey = formatDateKey(searchDate);
    const dayBlocks = getBlocksOnDate(blocksWithoutProposed, dateKey);

    if (dateKey !== proposedBlock.blockDate) {
      cursor = NEXT_WORK_START_MINUTES;
    }

    for (const block of dayBlocks) {
      const blockStart = getBlockStartMinutes(block);
      const blockEnd = getBlockEndMinutes(block);

      if (blockEnd <= cursor) {
        continue;
      }

      if (blockStart > cursor) {
        const availableMinutes = blockStart - cursor;
        const chunkMinutes = Math.min(remainingMinutes, availableMinutes);

        if (chunkMinutes > 0) {
          const chunkId = firstChunkUsedOriginalId
            ? `${proposedBlock.assignmentId}-chunk-${Date.now()}-${nextChunkIndex}`
            : proposedBlock.id;

          const chunk = buildChunkFromPlacement(
            proposedBlock,
            chunkId,
            dateKey,
            cursor,
            chunkMinutes,
            nextChunkIndex
          );

          newChunks.push(chunk);
          remainingMinutes -= chunkMinutes;
          nextChunkIndex += 1;
          firstChunkUsedOriginalId = true;
          cursor += chunkMinutes;

          if (remainingMinutes <= 0) {
            break;
          }
        }
      }

      if (blockStart <= cursor && blockEnd > cursor) {
        cursor = blockEnd;
      }
    }

    if (remainingMinutes > 0 && cursor < WORK_DAY_END_MINUTES) {
      const availableMinutes = WORK_DAY_END_MINUTES - cursor;
      const chunkMinutes = Math.min(remainingMinutes, availableMinutes);

      if (chunkMinutes > 0) {
        const chunkId = firstChunkUsedOriginalId
          ? `${proposedBlock.assignmentId}-chunk-${Date.now()}-${nextChunkIndex}`
          : proposedBlock.id;

        const chunk = buildChunkFromPlacement(
          proposedBlock,
          chunkId,
          dateKey,
          cursor,
          chunkMinutes,
          nextChunkIndex
        );

        newChunks.push(chunk);
        remainingMinutes -= chunkMinutes;
        nextChunkIndex += 1;
        firstChunkUsedOriginalId = true;
      }
    }

    if (remainingMinutes > 0) {
      searchDate.setDate(searchDate.getDate() + 1);
      cursor = NEXT_WORK_START_MINUTES;
    }
  }

  return [...blocksWithoutProposed, ...newChunks];
}