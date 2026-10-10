/**
 * Preloads section picture covers gracefully in the background on idle
 * without blocking critical page rendering, scripts, or database queries.
 */

export const CRITICAL_SECTION_COVERS: string[] = [
  '/mission.jpeg',
  '/yoccover.png',
  '/DEBATE.jpeg',
  '/STEM.jpeg',
  '/group.jpg',
  '/MISSION.jpeg',
  '/YOUTH.jpeg',
  '/ACADEMIC.jpeg',
  '/yoc.jpg',
];

const preloadedCache = new Set<string>();

export function preloadImage(src: string, priority: 'auto' | 'low' = 'low'): Promise<void> {
  if (!src || preloadedCache.has(src) || typeof window === 'undefined') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const img = new Image();
    // @ts-ignore
    img.fetchPriority = priority;
    img.decoding = 'async';
    img.onload = () => {
      preloadedCache.add(src);
      resolve();
    };
    img.onerror = () => {
      resolve();
    };
    img.src = src;
  });
}

/**
 * Stagger background preloading one by one during idle browser moments.
 */
export function preloadAllSectionCovers(): void {
  if (typeof window === 'undefined') return;

  const scheduleTask = (window.requestIdleCallback || ((cb: () => void) => setTimeout(cb, 1000))) as (cb: () => void) => void;

  scheduleTask(() => {
    let index = 0;
    function loadNext() {
      if (index >= CRITICAL_SECTION_COVERS.length) return;
      const url = CRITICAL_SECTION_COVERS[index++];
      preloadImage(url, 'low').finally(() => {
        // Slight delay between each non-critical background image so network is never saturated
        setTimeout(loadNext, 350);
      });
    }
    loadNext();
  });
}

