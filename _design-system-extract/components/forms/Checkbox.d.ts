/** Custom checkbox — the native box renders light on Windows dark themes. */
export interface CheckboxProps {
  label?: string;
  checked?: boolean;
  defaultChecked?: boolean;
  disabled?: boolean;
  name?: string;
  onChange?: (event: any) => void;
}
export declare function Checkbox(props: CheckboxProps): JSX.Element;
