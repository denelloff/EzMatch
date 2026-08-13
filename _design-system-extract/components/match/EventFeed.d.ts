/** Streaming server log for one instance, with category filter pills. */
export interface FeedEvent {
  /** Pre-formatted local time, e.g. "21:04:11". */
  time: string;
  /** Event name shown in the badge, e.g. "round_end", "player_death". */
  kind: string;
  category: 'match' | 'combat' | 'connection' | 'server' | 'chat' | 'economy' | 'other';
  /** Monospace key=value tail. */
  detail: string;
}
export interface EventFeedProps { events?: FeedEvent[]; maxHeight?: number }
export declare function EventFeed(props: EventFeedProps): JSX.Element;
