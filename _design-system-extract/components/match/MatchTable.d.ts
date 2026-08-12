/**
 * The panel's central list: every match with teams, padded score, map, server and state.
 */
export interface MatchTableRow {
  id: string;
  /** Short public id printed after "#". */
  shortId: string;
  team1Name: string;
  team2Name: string;
  team1Score: number;
  team2Score: number;
  map: string;
  serverName: string;
  instanceName: string;
  state: 'DRAFT' | 'WARMUP' | 'KNIFE' | 'KNIFE_DECISION' | 'LIVE' | 'PAUSED' | 'HALFTIME' | 'OVERTIME' | 'FINISHED' | 'CANCELLED';
}
export interface MatchTableProps {
  rows?: MatchTableRow[];
  onOpen?: (row: MatchTableRow) => void;
  emptyTitle?: string;
  emptyDescription?: string;
}
export declare function MatchTable(props: MatchTableProps): JSX.Element;
export declare const STATE_LABEL: Record<string, string>;
export declare const STATE_TONE: Record<string, string>;
/** Two-digit score, the way eBot prints it (10 - 08). */
export declare function formatScore(value: number): string;
