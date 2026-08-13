import type { CSSProperties } from 'react';

/**
 * eZ-Match lockup: mark + wordmark, optional uppercase subtitle ("Admin").
 */
export interface LogoProps {
  /** Which candidate mark to render. */
  /** Defaults to the locked mark, 'reticle'. */
  mark?: 'shard' | 'bracket' | 'reticle' | 'caret';
  size?: 'sm' | 'md' | 'lg';
  /** Small caps line under the wordmark, e.g. "Admin". */
  subtitle?: string;
  href?: string;
  /** Override the mark URL entirely. */
  src?: string;
  style?: CSSProperties;
}
export declare function Logo(props: LogoProps): JSX.Element;
