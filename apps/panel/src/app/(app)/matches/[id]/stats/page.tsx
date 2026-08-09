import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { loadRounds, team1WasCt } from '@/lib/match-stats';
import { Card, CardHeader, EmptyState } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function MatchStatisticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    select: {
      team1Name: true,
      team2Name: true,
      team1Score: true,
      team2Score: true,
      team1Side: true,
      maxRounds: true,
      overtimeRounds: true,
    },
  });
  if (!match) notFound();

  const rounds = await loadRounds(id);

  if (rounds.length === 0) {
    return (
      <Card>
        <EmptyState
          title="No rounds recorded"
          description="The timeline is rebuilt from the server's own score reports. Nothing has arrived for this match yet."
        />
      </Card>
    );
  }

  const roundsPlayed = match.team1Score + match.team2Score;
  const half = Math.floor(match.maxRounds / 2);

  const attributed = rounds.map((round) => {
    const team1Ct = team1WasCt(
      round.round,
      match.team1Side,
      roundsPlayed,
      match.maxRounds,
      match.overtimeRounds,
    );
    const winnerTeam =
      round.winner === null ? null : round.winner === 'CT' ? (team1Ct ? 1 : 2) : team1Ct ? 2 : 1;
    return { ...round, team1Ct, winnerTeam };
  });

  const segments = [
    { label: 'First half', rounds: attributed.filter((r) => r.round <= half) },
    {
      label: 'Second half',
      rounds: attributed.filter((r) => r.round > half && r.round <= match.maxRounds),
    },
    { label: 'Overtime', rounds: attributed.filter((r) => r.round > match.maxRounds) },
  ].filter((segment) => segment.rounds.length > 0);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Round timeline"
          description="Rebuilt from the score the server reports after every round; CS2 round-end lines carry no winner of their own."
        />
        <div className="space-y-5 px-5 py-4">
          {segments.map((segment) => {
            const team1Rounds = segment.rounds.filter((r) => r.winnerTeam === 1).length;
            const team2Rounds = segment.rounds.filter((r) => r.winnerTeam === 2).length;

            return (
              <div key={segment.label}>
                <div className="flex items-baseline justify-between text-xs">
                  <span className="uppercase tracking-wide text-ink-400">
                    {segment.label}
                  </span>
                  <span className="tabular-nums text-ink-300">
                    {match.team1Name} {team1Rounds} — {team2Rounds} {match.team2Name}
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1">
                  {segment.rounds.map((round) => (
                    <div
                      key={round.round}
                      title={`Round ${round.round} · ${
                        round.winner ?? 'unknown'
                      } · ${round.ctScore}:${round.tScore}`}
                      className={`flex h-7 w-9 items-center justify-center rounded border text-xs tabular-nums ${
                        round.winnerTeam === 1
                          ? 'border-brand-500/50 bg-brand-500/15 text-brand-500'
                          : round.winnerTeam === 2
                            ? 'border-ink-600 bg-ink-800 text-ink-200'
                            : 'border-ink-700 text-ink-400'
                      }`}
                    >
                      {round.round}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex items-center gap-5 border-t border-ink-700 px-5 py-3 text-xs text-ink-400">
          <span className="flex items-center gap-2">
            <span className="size-3 rounded border border-brand-500/50 bg-brand-500/15" />
            {match.team1Name}
          </span>
          <span className="flex items-center gap-2">
            <span className="size-3 rounded border border-ink-600 bg-ink-800" />
            {match.team2Name}
          </span>
        </div>
      </Card>

      <Card>
        <CardHeader title="Rounds" description={`${attributed.length} recorded`} />
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs uppercase tracking-wide text-ink-400">
              <th className="px-5 py-2 text-left font-normal">Round</th>
              <th className="px-3 py-2 text-left font-normal">Won by side</th>
              <th className="px-3 py-2 text-left font-normal">Won by team</th>
              <th className="px-3 py-2 text-right font-normal">CT</th>
              <th className="px-5 py-2 text-right font-normal">T</th>
            </tr>
          </thead>
          <tbody>
            {attributed.map((round) => (
              <tr key={round.round} className="border-t border-ink-800">
                <td className="px-5 py-2 tabular-nums text-ink-300">{round.round}</td>
                <td className="px-3 py-2 text-ink-200">{round.winner ?? '—'}</td>
                <td className="px-3 py-2 text-ink-200">
                  {round.winnerTeam === 1
                    ? match.team1Name
                    : round.winnerTeam === 2
                      ? match.team2Name
                      : '—'}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-ink-400">
                  {round.ctScore}
                </td>
                <td className="px-5 py-2 text-right tabular-nums text-ink-400">
                  {round.tScore}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
