/** One cell of the statistics strip — matches, finished, rounds played, kills recorded. */
export interface StatTileProps {
  label: string;
  value: string | number;
  hint?: string;
  tone?: 'neutral' | 'brand' | 'ok';
}
export declare function StatTile(props: StatTileProps): JSX.Element;
