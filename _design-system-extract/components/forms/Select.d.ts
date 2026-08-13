import type { CSSProperties } from 'react';

/** Dropdown with a hand-drawn chevron — the native arrow renders light on dark. */
export interface SelectProps {
  options?: { value: string; label: string }[];
  /** Rendered as a leading empty option, e.g. "Select a team". */
  placeholder?: string;
  value?: string;
  defaultValue?: string;
  disabled?: boolean;
  name?: string;
  style?: CSSProperties;
  onChange?: (event: any) => void;
}
export declare function Select(props: SelectProps): JSX.Element;
