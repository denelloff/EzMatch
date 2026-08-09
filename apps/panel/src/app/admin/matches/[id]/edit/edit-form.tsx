'use client';

import Link from 'next/link';
import { useActionState, useState } from 'react';
import { useFormStatus } from 'react-dom';
import type { MapOption } from '@/lib/maps';
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
  updateMatchAction,
  type MatchManageState,
} from '../../manage-actions';

const MR_OPTIONS = [
  { mr: 8, maxRounds: 16, label: 'MR8' },
  { mr: 12, maxRounds: 24, label: 'MR12' },
  { mr: 15, maxRounds: 30, label: 'MR15' },
] as const;

const OT_MR = [
  { mr: 3, rounds: 6 },
  { mr: 5, rounds: 10 },
] as const;

export function MatchEditForm({
  match,
  maps,
  labels,
}: {
  match: {
    id: string;
    title: string;
    map: string;
    team1Name: string;
    team2Name: string;
    maxRounds: number;
    overtimeEnabled: boolean;
    overtimeRounds: number;
    overtimeStartMoney: number;
    freezetime: number;
    knifeRound: boolean;
    hasJoinPassword: boolean;
  };
  maps: MapOption[];
  labels: {
    title: string;
    map: string;
    team1: string;
    team2: string;
    mr: string;
    freezetime: string;
    freezetimeHint: string;
    knife: string;
    overtime: string;
    overtimeMr: string;
    overtimeStartMoney: string;
    password: string;
    passwordHint: string;
    clearPassword: string;
    submit: string;
    cancel: string;
  };
}) {
  const [state, formAction] = useActionState<MatchManageState, FormData>(
    updateMatchAction,
    { error: null, ok: false },
  );
  const [maxRounds, setMaxRounds] = useState(match.maxRounds);
  const [otEnabled, setOtEnabled] = useState(match.overtimeEnabled);
  const [otRounds, setOtRounds] = useState(match.overtimeRounds);
  const [knife, setKnife] = useState(match.knifeRound);

  const mapOptions =
    maps.some((m) => m.name === match.map)
      ? maps
      : [{ name: match.map, label: match.map }, ...maps];

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="matchId" value={match.id} />
      <input type="hidden" name="maxRounds" value={maxRounds} />
      <input type="hidden" name="overtimeRounds" value={otRounds} />
      {knife ? <input type="hidden" name="knifeRound" value="on" /> : null}
      {otEnabled ? <input type="hidden" name="overtimeEnabled" value="on" /> : null}

      <Card>
        <CardHeader title={labels.title} />
        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <Field label={labels.title}>
            <input
              name="title"
              defaultValue={match.title}
              className={inputClass}
              required
              maxLength={80}
            />
          </Field>
          <Field label={labels.map}>
            <select
              name="map"
              className={selectClass}
              defaultValue={match.map}
              required
            >
              {mapOptions.map((map) => (
                <option key={map.name} value={map.name}>
                  {map.label} ({map.name})
                </option>
              ))}
            </select>
          </Field>
          <Field label={labels.team1}>
            <input
              name="team1Name"
              defaultValue={match.team1Name}
              className={inputClass}
              required
              maxLength={24}
            />
          </Field>
          <Field label={labels.team2}>
            <input
              name="team2Name"
              defaultValue={match.team2Name}
              className={inputClass}
              required
              maxLength={24}
            />
          </Field>
          <Field label={labels.mr}>
            <div className="flex flex-wrap gap-2">
              {MR_OPTIONS.map((option) => (
                <button
                  key={option.mr}
                  type="button"
                  onClick={() => setMaxRounds(option.maxRounds)}
                  className={
                    maxRounds === option.maxRounds ? buttonClass : secondaryButtonClass
                  }
                >
                  {option.label}
                </button>
              ))}
            </div>
          </Field>
          <Field label={labels.overtimeStartMoney}>
            <input
              name="overtimeStartMoney"
              type="number"
              min={0}
              max={16000}
              defaultValue={match.overtimeStartMoney}
              className={inputClass}
            />
          </Field>
          <Field label={labels.freezetime} hint={labels.freezetimeHint}>
            <input
              name="freezetime"
              type="number"
              min={0}
              max={60}
              defaultValue={match.freezetime}
              className={inputClass}
            />
          </Field>
          <Field
            label={labels.password}
            hint={
              match.hasJoinPassword
                ? labels.passwordHint
                : labels.passwordHint
            }
          >
            <input
              name="joinPassword"
              type="text"
              maxLength={64}
              autoComplete="off"
              spellCheck={false}
              className={inputClass}
              placeholder={
                match.hasJoinPassword ? '•••••••• (leave blank to keep)' : 'optional'
              }
            />
          </Field>
          {match.hasJoinPassword ? (
            <label className="flex items-center gap-2 text-sm text-ink-300 sm:col-span-2">
              <input type="checkbox" name="clearJoinPassword" value="on" />
              {labels.clearPassword}
            </label>
          ) : null}
        </div>
        <div className="space-y-3 border-t border-ink-700/80 px-5 py-4">
          <label className="flex items-center justify-between gap-4 text-sm text-ink-200">
            <span>{labels.knife}</span>
            <button
              type="button"
              role="switch"
              aria-checked={knife}
              onClick={() => setKnife(!knife)}
              className={`relative h-6 w-11 rounded-full ${knife ? 'bg-brand-500' : 'bg-ink-600'}`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-ink-100 transition-all ${
                  knife ? 'left-[1.375rem]' : 'left-0.5'
                }`}
              />
            </button>
          </label>
          <label className="flex items-center justify-between gap-4 text-sm text-ink-200">
            <span>{labels.overtime}</span>
            <button
              type="button"
              role="switch"
              aria-checked={otEnabled}
              onClick={() => setOtEnabled(!otEnabled)}
              className={`relative h-6 w-11 rounded-full ${otEnabled ? 'bg-brand-500' : 'bg-ink-600'}`}
            >
              <span
                className={`absolute top-0.5 size-5 rounded-full bg-ink-100 transition-all ${
                  otEnabled ? 'left-[1.375rem]' : 'left-0.5'
                }`}
              />
            </button>
          </label>
          {otEnabled ? (
            <Field label={labels.overtimeMr}>
              <div className="flex gap-2">
                {OT_MR.map((option) => (
                  <button
                    key={option.mr}
                    type="button"
                    onClick={() => setOtRounds(option.rounds)}
                    className={
                      otRounds === option.rounds ? buttonClass : secondaryButtonClass
                    }
                  >
                    MR{option.mr}
                  </button>
                ))}
              </div>
            </Field>
          ) : null}
        </div>
      </Card>

      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}

      <div className="flex gap-3">
        <Submit label={labels.submit} />
        <Link href="/admin/matches/mine" className={secondaryButtonClass}>
          {labels.cancel}
        </Link>
      </div>
    </form>
  );
}

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={buttonClass} disabled={pending}>
      {pending ? '…' : label}
    </button>
  );
}
