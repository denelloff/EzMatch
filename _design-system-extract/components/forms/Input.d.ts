import type { CSSProperties } from 'react';

/** Text / number / password input on the dark inset surface. */
export interface InputProps {
  type?: 'text' | 'password' | 'email' | 'number' | 'search';
  value?: string | number;
  defaultValue?: string | number;
  placeholder?: string;
  disabled?: boolean;
  invalid?: boolean;
  name?: string;
  style?: CSSProperties;
  onChange?: (event: any) => void;
}
export declare function Input(props: InputProps): JSX.Element;
