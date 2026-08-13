import type { ReactNode, CSSProperties } from 'react';

/** Inline block-level message — form errors, agent warnings, informational hints. */
export interface NoticeProps {
  tone?: 'warn' | 'danger' | 'info';
  style?: CSSProperties;
  children?: ReactNode;
}
export declare function Notice(props: NoticeProps): JSX.Element;
