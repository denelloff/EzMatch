/**
 * Live match scoreboard: score head, then one block per team in its CS2 side colour.
 */
export interface ScoreboardPlayer { name: string; kills: number; assists: number; deaths: number; damage: number; connected?: boolean }
export interface ScoreboardTeam { name: string; score: number; logo?: string; players?: ScoreboardPlayer[] }
export interface ScoreboardProps {
  map: string;
  state?: string;
  /** Total rounds in regulation; the header prints MR = maxRounds / 2. */
  maxRounds?: number;
  team1: ScoreboardTeam;
  team2: ScoreboardTeam;
  /** Side team 1 is currently on; drives which score is blue and which is gold. */
  team1Side?: 'CT' | 'T';
  roundsPlayed?: number;
  spectators?: ScoreboardPlayer[];
}
export declare function Scoreboard(props: ScoreboardProps): JSX.Element;
