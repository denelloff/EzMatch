/** EN / RU switch. The panel ships a full Russian dictionary; the toggle is always visible. */
export interface LanguageToggleProps {
  locale?: 'en' | 'ru';
  onChange?: (locale: 'en' | 'ru') => void;
  labels?: { en: string; ru: string };
}
export declare function LanguageToggle(props: LanguageToggleProps): JSX.Element;
