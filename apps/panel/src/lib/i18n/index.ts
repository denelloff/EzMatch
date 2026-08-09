import { cookies } from 'next/headers';
import {
  DEFAULT_LOCALE,
  LOCALE_COOKIE,
  getDictionary,
  isLocale,
  type Dictionary,
  type Locale,
} from './dictionaries';

export async function getLocale(): Promise<Locale> {
  const jar = await cookies();
  const value = jar.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
}

export async function getT(): Promise<Dictionary> {
  return getDictionary(await getLocale());
}

export { getDictionary, isLocale, LOCALE_COOKIE, type Dictionary, type Locale };

