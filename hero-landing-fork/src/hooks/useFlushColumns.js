import { useEffect } from 'react';

const STRETCHED = 'is-stretched';

function columnOf(element, containerLeft) {
  return Math.round(element.getBoundingClientRect().left - containerLeft);
}

function reset(container) {
  for (const tile of container.querySelectorAll(`.${STRETCHED}`)) {
    tile.classList.remove(STRETCHED);
    tile.style.height = '';
  }
}

// CSS columns balance the mosaic groups, but their bottoms still land a few pixels
// apart. Grow the last row of each shorter column (the photos crop to fit) so every
// column ends on the same line. Every read happens before any write — interleaving
// them used to force ~700ms of layouts on load.
function flush(container) {
  reset(container);

  const groups = [...container.children];
  if (!groups.length) return;

  const containerLeft = container.getBoundingClientRect().left;
  const columnsBefore = groups.map((group) => columnOf(group, containerLeft));
  const bottoms = groups.map((group) => group.getBoundingClientRect().bottom);

  const lastInColumn = new Map();
  groups.forEach((group, index) => {
    const column = columnsBefore[index];
    const current = lastInColumn.get(column);
    if (!current || bottoms[index] > current.bottom) {
      lastInColumn.set(column, { group, bottom: bottoms[index] });
    }
  });

  // One column: nothing to level.
  if (lastInColumn.size < 2) return;

  const target = Math.max(...[...lastInColumn.values()].map(({ bottom }) => bottom));

  const stretches = [];
  for (const { group, bottom } of lastInColumn.values()) {
    const delta = target - bottom;
    if (delta < 0.5) continue;

    for (const tile of group.querySelectorAll('.portfolio-mosaic-tile')) {
      if (Math.abs(tile.getBoundingClientRect().bottom - bottom) < 1) {
        stretches.push({ tile, height: tile.getBoundingClientRect().height + delta });
      }
    }
  }

  for (const { tile, height } of stretches) {
    tile.style.height = `${height}px`;
    tile.classList.add(STRETCHED);
  }

  // Taller content can make the browser rebalance the columns; if any group moved,
  // the natural layout is the safer one.
  const moved = groups.some((group, index) => columnOf(group, containerLeft) !== columnsBefore[index]);
  if (moved) reset(container);
}

export function useFlushColumns(ref, layoutKey) {
  useEffect(() => {
    const container = ref.current;
    if (!container) return undefined;

    let width = null;
    let frame = 0;

    const scheduleFlush = (entry) => {
      if (width !== null && Math.abs(entry.contentRect.width - width) < 0.5) return;
      width = entry.contentRect.width;
      // rAF keeps the flush out of the observer callback, which is what
      // tripped "ResizeObserver loop completed with undelivered notifications".
      if (!frame) {
        frame = requestAnimationFrame(() => {
          frame = 0;
          flush(container);
        });
      }
    };

    // The observer fires once right after observe(), so the initial levelling
    // happens there — a useLayoutEffect here blocked first paint for ~0.7s.
    const observer = new ResizeObserver((entries) => scheduleFlush(entries[entries.length - 1]));
    observer.observe(container);

    return () => {
      observer.disconnect();
      if (frame) cancelAnimationFrame(frame);
    };
  }, [ref, layoutKey]);
}
