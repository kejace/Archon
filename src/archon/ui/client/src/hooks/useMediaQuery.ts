import { useEffect, useState } from 'react';

/**
 * Viewport / breakpoint hooks for responsive behaviour.
 *
 * CSS handles *styling* across breakpoints via `@media` queries; these hooks
 * exist for the cases where the component tree itself has to differ — e.g.
 * rendering a node-detail panel as a bottom sheet on a phone vs. a docked
 * sidebar on desktop, or enabling touch gestures only on small screens. Keep
 * the breakpoints here in sync with the `$bp-*` values used in global.css.
 */

// Single source of truth for breakpoints (px). Mirrored in global.css.
export const BP_MOBILE = 640;  // phones
export const BP_TABLET = 1024; // small tablets / split-screen

export type Breakpoint = 'mobile' | 'tablet' | 'desktop';

/** Subscribe to a media query, SSR-safe and returning a live boolean. */
export function useMediaQuery(query: string): boolean {
  const get = () =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function'
      ? window.matchMedia(query).matches
      : false;

  const [matches, setMatches] = useState<boolean>(get);

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(query);
    const onChange = () => setMatches(mql.matches);
    onChange(); // sync immediately in case the query changed between render and effect
    // Safari <14 only supports the deprecated addListener signature.
    if (mql.addEventListener) mql.addEventListener('change', onChange);
    else mql.addListener(onChange);
    return () => {
      if (mql.removeEventListener) mql.removeEventListener('change', onChange);
      else mql.removeListener(onChange);
    };
  }, [query]);

  return matches;
}

/** True on phone-width viewports (≤ 640px). */
export function useIsMobile(): boolean {
  return useMediaQuery(`(max-width: ${BP_MOBILE}px)`);
}

/** True on tablet-width viewports (641–1024px). */
export function useIsTablet(): boolean {
  return useMediaQuery(`(min-width: ${BP_MOBILE + 1}px) and (max-width: ${BP_TABLET}px)`);
}

/** True when the device's primary input is coarse (touch). */
export function useIsTouch(): boolean {
  return useMediaQuery('(pointer: coarse)');
}

/** Coarse breakpoint label, recomputed on resize. */
export function useBreakpoint(): Breakpoint {
  const mobile = useIsMobile();
  const tablet = useIsTablet();
  return mobile ? 'mobile' : tablet ? 'tablet' : 'desktop';
}
