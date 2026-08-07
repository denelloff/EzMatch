import { notFound } from 'next/navigation';
import Link from 'next/link';
import { hasRole, requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatRelative } from '@/lib/format';
import { STATE_LABEL, STATE_TONE } from '@/lib/match-state';
import { Badge, Card, CardHeader, EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-ink-800 px-5 py-2.5 text-sm first:border-t-0">
      <span className="text-ink-400">{label}</span>
      <span className="text-right text-ink-200">{value}</span>
    </div>
  );
}

function Flag({ on }: { on: boolean }) {
  return (
    <span className={on ? 'text-ok-500' : 'text-ink-400'}>
      {on ? 'enabled' : 'disabled'}
    </span>
  );
}

export default async function MatchInformationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await requireUser();
  const isAdmin = hasRole(user, 'ADMIN');
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      instance: {
        select: {
          id: true,
          name: true,
          gamePort: true,
          server: { select: { id: true, name: true } },
        },
      },
      transitions: { orderBy: { createdAt: 'desc' }, take: 20 },
    },
  });
  if (!match) notFound();

  const team1Ct = match.team1Side === 'CT';
  const serverLabel = match.instance.server.name;
  const instanceLabel = `${match.instance.name} :${match.instance.gamePort}`;

  return (
    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        <Card>
          <CardHeader
            title="Match configuration"
            description="Fixed when the match was created and pushed to the server on prepare."
          />
          <div>
            <Row label="Status" value={
              <Badge tone={STATE_TONE[match.state]}>{STATE_LABEL[match.state]}</Badge>
            } />
            <Row label="Map" value={match.map} />
            <Row label="Max rounds" value={match.maxRounds} />
            <Row label="Knife round" value={<Flag on={match.knifeRound} />} />
            <Row label="Overtime" value={<Flag on={match.overtimeEnabled} />} />
            <Row label="Overtime rounds" value={match.overtimeRounds} />
            <Row
              label="Round backup prefix"
              value={<span className="font-mono text-xs">{match.backupPrefix}</span>}
            />
            <Row
              label="Server"
              value={
                isAdmin ? (
                  <Link
                    href={`/admin/servers/${match.instance.server.id}`}
                    className="hover:text-brand-500"
                  >
                    {serverLabel}
                  </Link>
                ) : (
                  serverLabel
                )
              }
            />
            <Row
              label="Instance"
              value={
                isAdmin ? (
                  <Link
                    href={`/admin/instances/${match.instance.id}`}
                    className="hover:text-brand-500"
                  >
                    {instanceLabel}
                  </Link>
                ) : (
                  instanceLabel
                )
              }
            />
          </div>
        </Card>

        <Card>
          <CardHeader title="Match information" />
          <div>
            <Row
              label={`${match.team1Name} (team 1)`}
              value={
                <>
                  <span className="text-ink-400">{team1Ct ? 'CT' : 'T'} · </span>
                  <span className="tabular-nums">{match.team1Score}</span>
                </>
              }
            />
            <Row
              label={`${match.team2Name} (team 2)`}
              value={
                <>
                  <span className="text-ink-400">{team1Ct ? 'T' : 'CT'} · </span>
                  <span className="tabular-nums">{match.team2Score}</span>
                </>
              }
            />
            <Row label="Created" value={formatRelative(match.createdAt)} />
            <Row
              label="Started"
              value={match.startedAt ? formatRelative(match.startedAt) : 'not started'}
            />
            <Row
              label="Ended"
              value={match.endedAt ? formatRelative(match.endedAt) : '—'}
            />
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader
          title="Transitions"
          description="Each one is confirmed by a log event, not a timer."
        />
        {match.transitions.length === 0 ? (
          <EmptyState
            title="Nothing yet"
            description="Preparing the server records the first transition here."
          />
        ) : (
          <ol className="divide-y divide-ink-800">
            {match.transitions.map((transition) => (
              <li key={transition.id} className="px-5 py-3 text-sm">
                <p className="text-ink-200">
                  {transition.fromState.toLowerCase()} →{' '}
                  <span className="text-ink-100">
                    {transition.toState.toLowerCase()}
                  </span>
                </p>
                <p className="mt-0.5 text-xs text-ink-400">
                  {transition.reason} · {formatRelative(transition.createdAt)}
                </p>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
