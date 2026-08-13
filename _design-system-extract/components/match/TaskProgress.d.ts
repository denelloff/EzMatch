/** Determinate progress bar for agent deploys, backups and demo syncs. */
export interface TaskProgressProps {
  label: string;
  percent?: number;
  state?: 'running' | 'done' | 'failed';
  /** Pre-formatted remaining time, e.g. "~40s left". */
  eta?: string;
}
export declare function TaskProgress(props: TaskProgressProps): JSX.Element;
