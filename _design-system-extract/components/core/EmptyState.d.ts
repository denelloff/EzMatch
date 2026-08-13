import type { ReactNode } from 'react';

/** Centred placeholder inside a Card or table when a list has no rows. */
export interface EmptyStateProps {
  title: string;
  description: string;
  action?: ReactNode;
}
export declare function EmptyState(props: EmptyStateProps): JSX.Element;
