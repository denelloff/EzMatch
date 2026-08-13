import type { ReactNode, CSSProperties } from 'react';

/** Compact inline entry point — free-server links, backup files, filter chips. */
export interface ChipProps {
  as?: 'span' | 'button';
  /** Renders an anchor and keeps the accent border. */
  href?: string;
  active?: boolean;
  style?: CSSProperties;
  onClick?: () => void;
  children?: ReactNode;
}
export declare function Chip(props: ChipProps): JSX.Element;
