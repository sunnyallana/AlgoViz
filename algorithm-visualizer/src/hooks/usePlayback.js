import { useCallback, useEffect, useState } from 'react';

/** Map a 0..1 slider value to a frame interval: 1000ms (slow) → 40ms (fast). */
export const intervalFromSpeed = (t) => Math.round(1000 * Math.pow(0.04, t));

/**
 * The playback engine. Drives an index through a frames array with
 * play / pause / step / seek / speed controls. Auto-pauses on the last
 * frame and resets whenever a new frames array arrives.
 */
export function usePlayback(frames) {
  const [index, setIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(0.55);
  const total = frames.length;

  // New data or algorithm → rewind.
  useEffect(() => {
    setIndex(0);
    setIsPlaying(false);
  }, [frames]);

  // One timeout per tick: simple, and auto-pauses cleanly at the end.
  useEffect(() => {
    if (!isPlaying) return undefined;
    if (index >= total - 1) {
      setIsPlaying(false);
      return undefined;
    }
    const t = setTimeout(
      () => setIndex((i) => Math.min(i + 1, total - 1)),
      intervalFromSpeed(speed)
    );
    return () => clearTimeout(t);
  }, [isPlaying, index, speed, total]);

  const play = useCallback(() => {
    // Pressing play at the end restarts from the beginning.
    setIndex((i) => (i >= total - 1 ? 0 : i));
    setIsPlaying(true);
  }, [total]);

  const pause = useCallback(() => setIsPlaying(false), []);

  const toggle = useCallback(() => {
    setIsPlaying((p) => {
      if (!p) setIndex((i) => (i >= total - 1 ? 0 : i));
      return !p;
    });
  }, [total]);

  const next = useCallback(() => {
    setIsPlaying(false);
    setIndex((i) => Math.min(i + 1, total - 1));
  }, [total]);

  const prev = useCallback(() => {
    setIsPlaying(false);
    setIndex((i) => Math.max(i - 1, 0));
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setIndex(0);
  }, []);

  const toEnd = useCallback(() => {
    setIsPlaying(false);
    setIndex(Math.max(total - 1, 0));
  }, [total]);

  const seek = useCallback(
    (i) => {
      setIsPlaying(false);
      setIndex(Math.max(0, Math.min(i, total - 1)));
    },
    [total]
  );

  return {
    index,
    total,
    isPlaying,
    speed,
    setSpeed,
    play,
    pause,
    toggle,
    next,
    prev,
    reset,
    toEnd,
    seek,
    atEnd: index >= total - 1,
    progress: total > 1 ? index / (total - 1) : 0,
  };
}

/** Space = play/pause, ← → = step, R = reset. Ignored while typing in inputs. */
export function useKeyboardShortcuts({ toggle, next, prev, reset }) {
  useEffect(() => {
    const onKey = (e) => {
      const t = e.target;
      const tag = t.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || t.isContentEditable) return;
      if (e.code === 'Space') {
        e.preventDefault();
        toggle();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      } else if (e.key === 'r' || e.key === 'R') {
        reset();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggle, next, prev, reset]);
}
