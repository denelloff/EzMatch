'use client';

import Link from 'next/link';
import { useActionState, useEffect, useMemo, useState } from 'react';
import { useFormStatus } from 'react-dom';
import { flagUrl } from '@/lib/countries';
import {
  Card,
  CardHeader,
  Field,
  Notice,
  buttonClass,
  inputClass,
  secondaryButtonClass,
  selectClass,
} from '@/components/ui';
import {
  createMatchAction,
  type CreateMatchState,
} from '@/app/(app)/matches/actions';
import type { MapOption } from '@/lib/maps';

export interface MatchTeamOption {
  id: string;
  name: string;
  tag: string;
  country: string;
  logoPath: string | null;
}

export interface MatchServerOption {
  id: string;
  label: string;
  map: string;
}

const OT_STARTMONEY_PRESETS = [10_000, 16_000] as const;
const OT_STARTMONEY_MIN = 0;
const OT_STARTMONEY_MAX = 16_000;
const OT_STARTMONEY_STORAGE_KEY = 'ezmatch.match.otStartMoney.saved';
const OT_STARTMONEY_LAST_KEY = 'ezmatch.match.otStartMoney.last';

/** MR label → total mp_maxrounds (two halves). */
const MR_OPTIONS = [
  { mr: 8, maxRounds: 16, label: 'MR8' },
  { mr: 12, maxRounds: 24, label: 'MR12' },
  { mr: 15, maxRounds: 30, label: 'MR15' },
] as const;

/** OT MR label → total mp_overtime_maxrounds (two halves). */
const OT_MR_OPTIONS = [
  { mr: 3, overtimeRounds: 6, label: 'MR3' },
  { mr: 5, overtimeRounds: 10, label: 'MR5' },
] as const;

function loadSavedStartMoney(): number[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(OT_STARTMONEY_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((value) => Number(value))
      .filter(
        (value) =>
          Number.isInteger(value) &&
          value >= OT_STARTMONEY_MIN &&
          value <= OT_STARTMONEY_MAX &&
          !(OT_STARTMONEY_PRESETS as readonly number[]).includes(value),
      )
      .slice(0, 8);
  } catch {
    return [];
  }
}

function loadLastStartMoney(): number | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(OT_STARTMONEY_LAST_KEY);
    if (!raw) return null;
    const value = Number(raw);
    if (
      !Number.isInteger(value) ||
      value < OT_STARTMONEY_MIN ||
      value > OT_STARTMONEY_MAX
    ) {
      return null;
    }
    return value;
  } catch {
    return null;
  }
}

function persistLastStartMoney(value: number) {
  try {
    window.localStorage.setItem(OT_STARTMONEY_LAST_KEY, String(value));
  } catch {
    // ignore quota / private mode
  }
}

function persistSavedStartMoney(values: number[]) {
  try {
    window.localStorage.setItem(
      OT_STARTMONEY_STORAGE_KEY,
      JSON.stringify(values),
    );
  } catch {
    // ignore quota / private mode
  }
}

function formatMoney(value: number): string {
  return `$${value.toLocaleString('en-US')}`;
}

export function MatchCreateForm({
  teams,
  servers,
  maps,
  defaultInstanceId,
  defaultMap,
  cancelHref,
  labels,
}: {
  teams: MatchTeamOption[];
  servers: MatchServerOption[];
  maps: MapOption[];
  defaultInstanceId?: string;
  defaultMap?: string;
  cancelHref: string;
  labels: {
    teamCt: string;
    teamT: string;
    pickTeam: string;
    config: string;
    server: string;
    serverHint: string;
    pickServer: string;
    map: string;
    mr: string;
    mrHint: string;
    knife: string;
    knifeHint: string;
    overtime: string;
    overtimeMr: string;
    overtimeMrHint: string;
    overtimeStartMoney: string;
    overtimeStartMoneyHint: string;
    overtimeStartMoneyCustom: string;
    overtimeStartMoneySave: string;
    overtimeStartMoneySaved: string;
    title: string;
    titleHint: string;
    password: string;
    passwordHint: string;
    submit: string;
    cancel: string;
    needTeams: string;
    needServer: string;
  };
}) {
  const [state, formAction] = useActionState<CreateMatchState, FormData>(
    createMatchAction,
    { error: null },
  );
  const [team1Id, setTeam1Id] = useState('');
  const [team2Id, setTeam2Id] = useState('');
  const [instanceId, setInstanceId] = useState(defaultInstanceId ?? '');
  const [mapName, setMapName] = useState(
    defaultMap ??
      maps.find((map) => map.name === 'de_mirage')?.name ??
      maps[0]?.name ??
      'de_mirage',
  );
  const [mr, setMr] = useState(12);
  const [knifeRound, setKnifeRound] = useState(true);
  const [overtimeEnabled, setOvertimeEnabled] = useState(true);
  const [otMr, setOtMr] = useState(3);
  const [otStartMoney, setOtStartMoney] = useState(10_000);
  const [otStartMoneyDraft, setOtStartMoneyDraft] = useState('10000');
  const [savedStartMoney, setSavedStartMoney] = useState<number[]>([]);

  useEffect(() => {
    const saved = loadSavedStartMoney();
    setSavedStartMoney(saved);
    const last = loadLastStartMoney();
    if (last != null) {
      setOtStartMoney(last);
      setOtStartMoneyDraft(String(last));
    }
  }, []);

  const selectStartMoney = (value: number) => {
    setOtStartMoney(value);
    setOtStartMoneyDraft(String(value));
    persistLastStartMoney(value);
  };

  const saveCustomStartMoney = () => {
    const value = Number(otStartMoneyDraft);
    if (
      !Number.isInteger(value) ||
      value < OT_STARTMONEY_MIN ||
      value > OT_STARTMONEY_MAX
    ) {
      return;
    }
    selectStartMoney(value);
    if ((OT_STARTMONEY_PRESETS as readonly number[]).includes(value)) return;
    setSavedStartMoney((prev) => {
      const next = [value, ...prev.filter((item) => item !== value)].slice(0, 8);
      persistSavedStartMoney(next);
      return next;
    });
  };

  const team1 = teams.find((team) => team.id === team1Id) ?? null;
  const team2 = teams.find((team) => team.id === team2Id) ?? null;
  const selectedServer =
    servers.find((server) => server.id === instanceId) ?? null;

  useEffect(() => {
    if (!selectedServer?.map) return;
    const known = maps.some((map) => map.name === selectedServer.map);
    if (known) setMapName(selectedServer.map);
  }, [selectedServer?.map, maps]);

  const mapOptions = useMemo(() => {
    if (!mapName || maps.some((map) => map.name === mapName)) return maps;
    return [{ name: mapName, label: mapName }, ...maps];
  }, [maps, mapName]);

  const maxRounds =
    MR_OPTIONS.find((option) => option.mr === mr)?.maxRounds ?? 24;
  const overtimeRounds =
    OT_MR_OPTIONS.find((option) => option.mr === otMr)?.overtimeRounds ?? 6;

  const autoTitle =
    team1 && team2 ? `${team1.tag} vs ${team2.tag}` : '';

  if (teams.length < 2) {
    return (
      <Card>
        <div className="px-5 py-8 text-center text-sm text-ink-400">
          {labels.needTeams}
        </div>
      </Card>
    );
  }

  if (servers.length === 0) {
    return (
      <Card>
        <div className="px-5 py-8 text-center text-sm text-ink-400">
          {labels.needServer}
        </div>
      </Card>
    );
  }

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="team1Id" value={team1Id} />
      <input type="hidden" name="team2Id" value={team2Id} />
      <input type="hidden" name="instanceId" value={instanceId} />
      <input type="hidden" name="maxRounds" value={maxRounds} />
      <input type="hidden" name="overtimeRounds" value={overtimeRounds} />
      <input type="hidden" name="overtimeStartMoney" value={otStartMoney} />
      {knifeRound ? <input type="hidden" name="knifeRound" value="on" /> : null}
      {overtimeEnabled ? (
        <input type="hidden" name="overtimeEnabled" value="on" />
      ) : null}

      <Card>
        <CardHeader title={`${labels.teamCt}  vs  ${labels.teamT}`} />
        <div className="grid gap-4 px-5 py-6 md:grid-cols-[1fr_auto_1fr] md:items-center">
          <TeamPick
            side="CT"
            sideLabel={labels.teamCt}
            teams={teams}
            excludeId={team2Id}
            value={team1Id}
            pickLabel={labels.pickTeam}
            onChange={setTeam1Id}
          />

          <div className="flex flex-col items-center justify-center gap-1 py-2">
            <span
              className="text-2xl font-semibold tracking-tight text-ink-100"
              style={{ fontFamily: 'var(--font-display)' }}
            >
              VS
            </span>
            <span className="text-[10px] uppercase tracking-widest text-ink-500">
              CT · T
            </span>
          </div>

          <TeamPick
            side="T"
            sideLabel={labels.teamT}
            teams={teams}
            excludeId={team1Id}
            value={team2Id}
            pickLabel={labels.pickTeam}
            onChange={setTeam2Id}
            align="right"
          />
        </div>
      </Card>

      <Card>
        <CardHeader title={labels.config} />
        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <Field label={labels.server} hint={labels.serverHint}>
            <select
              className={selectClass}
              value={instanceId}
              onChange={(event) => setInstanceId(event.target.value)}
              required
            >
              <option value="">{labels.pickServer}</option>
              {servers.map((server) => (
                <option key={server.id} value={server.id}>
                  {server.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label={labels.map}>
            <select
              name="map"
              className={selectClass}
              value={mapName}
              onChange={(event) => setMapName(event.target.value)}
              required
            >
              {mapOptions.map((map) => (
                <option key={map.name} value={map.name}>
                  {map.label} ({map.name})
                </option>
              ))}
            </select>
          </Field>

          <Field label={labels.mr} hint={labels.mrHint}>
            <div className="flex flex-wrap gap-2">
              {MR_OPTIONS.map((option) => (
                <button
                  key={option.mr}
                  type="button"
                  onClick={() => setMr(option.mr)}
                  className={
                    mr === option.mr
                      ? buttonClass
                      : secondaryButtonClass
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Field>

          <Field label={labels.title} hint={labels.titleHint}>
            <input
              name="title"
              maxLength={80}
              defaultValue={autoTitle || 'Scrim'}
              key={autoTitle || 'title'}
              className={inputClass}
              required
            />
          </Field>

          <Field label={labels.password} hint={labels.passwordHint}>
            <input
              name="joinPassword"
              type="text"
              maxLength={64}
              defaultValue="pcw"
              autoComplete="off"
              spellCheck={false}
              className={inputClass}
              placeholder="pcw"
            />
          </Field>
        </div>

        <div className="space-y-4 border-t border-ink-700/80 px-5 py-4">
          <SettingToggle
            checked={knifeRound}
            onChange={setKnifeRound}
            label={labels.knife}
            hint={labels.knifeHint}
          />

          <SettingToggle
            checked={overtimeEnabled}
            onChange={setOvertimeEnabled}
            label={labels.overtime}
          />

          {overtimeEnabled ? (
            <div className="grid gap-4 rounded-xl border border-ink-700/80 bg-ink-950/40 p-4 sm:grid-cols-2">
              <Field label={labels.overtimeMr} hint={labels.overtimeMrHint}>
                <div className="flex flex-wrap gap-2">
                  {OT_MR_OPTIONS.map((option) => (
                    <button
                      key={option.mr}
                      type="button"
                      onClick={() => setOtMr(option.mr)}
                      className={
                        otMr === option.mr
                          ? buttonClass
                          : secondaryButtonClass
                      }
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </Field>

              <Field
                label={labels.overtimeStartMoney}
                hint={labels.overtimeStartMoneyHint}
              >
                <div className="flex flex-wrap gap-2">
                  {OT_STARTMONEY_PRESETS.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => selectStartMoney(amount)}
                      className={
                        otStartMoney === amount
                          ? buttonClass
                          : secondaryButtonClass
                      }
                    >
                      {formatMoney(amount)}
                    </button>
                  ))}
                  {savedStartMoney.map((amount) => (
                    <button
                      key={`saved-${amount}`}
                      type="button"
                      title={labels.overtimeStartMoneySaved}
                      onClick={() => selectStartMoney(amount)}
                      className={
                        otStartMoney === amount
                          ? buttonClass
                          : secondaryButtonClass
                      }
                    >
                      {formatMoney(amount)}
                    </button>
                  ))}
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <input
                    type="number"
                    min={OT_STARTMONEY_MIN}
                    max={OT_STARTMONEY_MAX}
                    step={100}
                    value={otStartMoneyDraft}
                    onChange={(event) => setOtStartMoneyDraft(event.target.value)}
                    onBlur={() => {
                      const value = Number(otStartMoneyDraft);
                      if (
                        Number.isInteger(value) &&
                        value >= OT_STARTMONEY_MIN &&
                        value <= OT_STARTMONEY_MAX
                      ) {
                        selectStartMoney(value);
                      } else {
                        setOtStartMoneyDraft(String(otStartMoney));
                      }
                    }}
                    className={`${inputClass} max-w-[9rem]`}
                    aria-label={labels.overtimeStartMoneyCustom}
                    placeholder={labels.overtimeStartMoneyCustom}
                  />
                  <button
                    type="button"
                    onClick={saveCustomStartMoney}
                    className={secondaryButtonClass}
                  >
                    {labels.overtimeStartMoneySave}
                  </button>
                </div>
              </Field>
            </div>
          ) : null}
        </div>
      </Card>

      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}

      <div className="flex flex-wrap items-center gap-3">
        <Submit label={labels.submit} disabled={!team1Id || !team2Id || !instanceId} />
        <Link href={cancelHref} className={secondaryButtonClass}>
          {labels.cancel}
        </Link>
      </div>
    </form>
  );
}

function SettingToggle({
  checked,
  onChange,
  label,
  hint,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  hint?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="min-w-0">
        <p className="text-sm text-ink-200">{label}</p>
        {hint ? (
          <p className="mt-0.5 text-xs text-ink-400">{hint}</p>
        ) : null}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        onClick={() => onChange(!checked)}
        className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors duration-200 ${
          checked ? 'bg-brand-500' : 'bg-ink-600'
        }`}
      >
        <span
          aria-hidden="true"
          className={`absolute top-0.5 size-5 rounded-full bg-ink-100 shadow-sm transition-all duration-200 ${
            checked ? 'left-[1.375rem]' : 'left-0.5'
          }`}
        />
      </button>
    </div>
  );
}

function TeamPick({
  side,
  sideLabel,
  teams,
  excludeId,
  value,
  pickLabel,
  onChange,
  align = 'left',
}: {
  side: 'CT' | 'T';
  sideLabel: string;
  teams: MatchTeamOption[];
  excludeId: string;
  value: string;
  pickLabel: string;
  onChange: (id: string) => void;
  align?: 'left' | 'right';
}) {
  const options = teams.filter((team) => team.id !== excludeId);
  // Resolve from the live value so the preview cannot drift from the <select>.
  const selected =
    teams.find((team) => team.id === value) ??
    options.find((team) => team.id === value) ??
    null;
  const sideTone =
    side === 'CT'
      ? 'border-brand-500/40 bg-brand-500/10'
      : 'border-warn-500/40 bg-warn-500/10';

  return (
    <div
      className={`rounded-2xl border px-4 py-4 ${sideTone} ${
        align === 'right' ? 'text-right' : 'text-left'
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-widest text-ink-400">
        {sideLabel}
      </p>
      <div
        key={value || 'none'}
        className={`mt-3 flex items-center gap-3 ${
          align === 'right' ? 'flex-row-reverse' : ''
        }`}
      >
        <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-ink-700 bg-ink-900">
          {selected?.logoPath ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={selected.logoPath}
              alt=""
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-xs font-semibold text-ink-400">
              {selected?.tag?.slice(0, 4) || '—'}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold text-ink-100">
            {selected ? selected.name : pickLabel}
          </p>
          {selected ? (
            <p
              className={`mt-1 flex items-center gap-2 text-xs text-ink-400 ${
                align === 'right' ? 'justify-end' : ''
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={flagUrl(selected.country)}
                alt=""
                width={18}
                height={12}
                className="h-3 w-[18px] rounded-sm object-cover"
              />
              <span className="console-surface">{selected.tag}</span>
            </p>
          ) : null}
        </div>
      </div>
      <select
        className={`mt-3 ${selectClass}`}
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
        }}
        required
      >
        <option value="">{pickLabel}</option>
        {options.map((team) => (
          <option key={team.id} value={team.id}>
            {team.tag} — {team.name}
          </option>
        ))}
      </select>
    </div>
  );
}

function Submit({ label, disabled }: { label: string; disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      className={buttonClass}
      disabled={pending || disabled}
    >
      {pending ? '…' : label}
    </button>
  );
}
