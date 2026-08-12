/**
 * Admin shell sidebar: brand lockup, titled nav sections with live counts, footer credit.
 */
export interface SidebarNavItem { href: string; label: string; count?: number }
export interface SidebarSection { title: string; items: SidebarNavItem[] }
export interface SidebarProps {
  sections?: SidebarSection[];
  activeHref?: string;
  /** Intercepts clicks for prototype routing. */
  onNavigate?: (href: string) => void;
  footerLabel?: string;
  copyright?: string;
  /** Defaults to the locked mark, 'reticle'. */
  mark?: 'shard' | 'bracket' | 'reticle' | 'caret';
}
export declare function Sidebar(props: SidebarProps): JSX.Element;
