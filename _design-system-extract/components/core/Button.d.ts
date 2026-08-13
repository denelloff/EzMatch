import type { ReactNode, CSSProperties } from 'react';

/**
 * Primary action control. Four variants mirror the panel's action hierarchy:
 * primary (create/start), secondary (cancel/edit), ghost (toolbar), danger (delete).
 */
export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  /** Stretch to the container width — used on the login form. */
  block?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit';
  /** Renders an anchor instead of a button. */
  href?: string;
  style?: CSSProperties;
  onClick?: () => void;
  children?: ReactNode;
}
export declare function Button(props: ButtonProps): JSX.Element;
