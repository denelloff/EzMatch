'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import {
  Card,
  CardHeader,
  Field,
  Notice,
  buttonClass,
  checkboxClass,
  inputClass,
  secondaryButtonClass,
} from '@/components/ui';
import { createMatchAction, type CreateMatchState } from '@/app/(app)/matches/actions';

const MAPS = [
  'de_dust2',
  'de_mirage',
  'de_inferno',
  'de_nuke',
  'de_ancient',
  'de_anubis',
  'de_vertigo',
  'de_overpass',
  'de_train',
];

export function MatchForm({
  instanceId,
  defaultMap,
}: {
  instanceId: string;
  defaultMap: string;
}) {
  const [state, formAction] = useActionState<CreateMatchState, FormData>(
    createMatchAction,
    { error: null },
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="instanceId" value={instanceId} />

      <Card>
        <CardHeader title="Match" />
        <div className="grid gap-4 px-5 py-4 sm:grid-cols-2">
          <Field label="Title">
            <input
              name="title"
              required
              maxLength={80}
              defaultValue="Scrim"
              className={inputClass}
            />
          </Field>

          <Field label="Map">
            <input
              name="map"
              list="ppanel-match-maps"
              defaultValue={defaultMap}
              className={inputClass}
            />
            <datalist id="ppanel-match-maps">
              {MAPS.map((map) => (
                <option key={map} value={map} />
              ))}
            </datalist>
          </Field>

          <Field label="Team 1" hint="Starts on CT unless the knife round swaps.">
            <input
              name="team1Name"
              required
              maxLength={24}
              defaultValue="Team A"
              className={inputClass}
            />
          </Field>

          <Field label="Team 2">
            <input
              name="team2Name"
              required
              maxLength={24}
              defaultValue="Team B"
              className={inputClass}
            />
          </Field>

          <Field label="Rounds" hint="24 is MR12. Halftime is at half of this.">
            <input
              name="maxRounds"
              type="number"
              min={2}
              max={60}
              step={2}
              defaultValue={24}
              className={inputClass}
            />
          </Field>

          <Field label="Overtime rounds">
            <input
              name="overtimeRounds"
              type="number"
              min={2}
              max={12}
              step={2}
              defaultValue={6}
              className={inputClass}
            />
          </Field>
        </div>

        <div className="space-y-2 border-t border-ink-700 px-5 py-4">
          <label className="flex items-center gap-2 text-sm text-ink-200">
            <input
              type="checkbox"
              name="knifeRound"
              defaultChecked
              className={checkboxClass}
            />
            Knife round for side selection
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-200">
            <input
              type="checkbox"
              name="overtimeEnabled"
              defaultChecked
              className={checkboxClass}
            />
            Play overtime on a tie
          </label>
        </div>
      </Card>

      {state.error ? <Notice tone="danger">{state.error}</Notice> : null}

      <div className="flex items-center gap-3">
        <Submit />
        <Link href={`/admin/instances/${instanceId}`} className={secondaryButtonClass}>
          Cancel
        </Link>
      </div>
    </form>
  );
}

function Submit() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" className={buttonClass} disabled={pending}>
      {pending ? 'Creating…' : 'Create match'}
    </button>
  );
}
