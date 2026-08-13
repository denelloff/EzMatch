import type { ReactNode } from 'react';

/**
 * Sticky player-facing top bar: logo, primary nav with live counts, user + role, actions.
 */
export interface TopNavItem { href: string; label: string; count?: number }
export interface TopNavProps {
  items?: TopNavItem[];
  activeHref?: string;
  onNavigate?: (href: string) => void;
  /** Display name shown at the right. */
  user?: string;
  /** Uppercase role tag: OWNER / ADMIN / USER. */
  role?: string;
  /** Extra controls (language toggle, sign out, Admin panel link). */
  right?: ReactNode;
  /** Defaults to the locked mark, 'reticle'. */
  mark?: 'shard' | 'bracket' | 'reticle' | 'caret';
}
export declare function TopNav(props: TopNavProps): JSX.Element;
export declare function NavLink(props: { item: TopNavItem; active?: boolean; onNavigate?: (href: string) => void }): JSX.Element;
