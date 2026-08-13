import type { ReactNode, CSSProperties } from 'react';

/**
 * Bordered surface panel — the only container the panel uses. No drop shadow:
 * elevation comes from the 1px border plus the surface step.
 */
export interface CardProps {
  /** Darker inner surface, used for consoles and scoreboards. */
  inset?: boolean;
  style?: CSSProperties;
  children?: ReactNode;
}
export declare function Card(props: CardProps): JSX.Element;

export interface CardHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Right-aligned control, usually a Button or Chip. */
  action?: ReactNode;
  style?: CSSProperties;
}
export declare function CardHeader(props: CardHeaderProps): JSX.Element;

export interface CardBodyProps { style?: CSSProperties; children?: ReactNode }
export declare function CardBody(props: CardBodyProps): JSX.Element;
