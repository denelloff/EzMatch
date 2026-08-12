import type { ReactNode, CSSProperties } from 'react';

/** Status pill for match state, instance state and role tags. */
export interface BadgeProps {
  tone?: 'ok' | 'warn' | 'danger' | 'info' | 'brand' | 'neutral';
  /** Prefixes a pulsing dot — used for LIVE / OVERTIME states. */
  live?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
}
export declare function Badge(props: BadgeProps): JSX.Element;
