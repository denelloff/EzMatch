import type { ReactNode } from 'react';

/** Label + control + hint wrapper. Every form control in the panel is wrapped in one. */
export interface FieldProps {
  label: string;
  /** Explains the setting in game terms, e.g. "MR12 = 24 total rounds (12 per half)." */
  hint?: ReactNode;
  error?: ReactNode;
  children?: ReactNode;
}
export declare function Field(props: FieldProps): JSX.Element;
