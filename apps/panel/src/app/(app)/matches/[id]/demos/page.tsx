import { notFound } from 'next/navigation';
import { requireUser } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { formatBytes, formatRelative } from '@/lib/format';
import { Card, CardHeader, EmptyState } from '@/components/ui';
import { SyncDemosButton } from './sync-button';

export const dynamic = 'force-dynamic';

export default async function DemosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    select: {
      demoName: true,
      instance: { select: { name: true, server: { select: { name: true } } } },
      demos: { orderBy: { recordedAt: 'desc' } },
    },
  });
  if (!match) notFound();

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="GOTV recordings"
          description="eZ-Match starts the recording when the match goes live and closes it when the match ends. The files stay on the game host."
        />

        {match.demos.length === 0 ? (
          <EmptyState
            title={
              match.demoName
                ? 'No recording indexed yet'
                : 'Nothing recorded for this match'
            }
            description={
              match.demoName
                ? `The recording was named ${match.demoName}. If the match just ended, re-index to pick the file up.`
                : 'Recording starts when a match goes live. This match has not gone live yet, or GOTV was unavailable on the server.'
            }
          />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-ink-400">
                <th className="px-5 py-2 text-left font-normal">File</th>
                <th className="px-3 py-2 text-right font-normal">Size</th>
                <th className="px-5 py-2 text-right font-normal">Recorded</th>
              </tr>
            </thead>
            <tbody>
              {match.demos.map((demo) => (
                <tr key={demo.id} className="border-t border-ink-800">
                  <td className="px-5 py-2 font-mono text-xs text-ink-200">
                    {demo.fileName}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums text-ink-300">
                    {formatBytes(Number(demo.sizeBytes))}
                  </td>
                  <td className="px-5 py-2 text-right text-ink-400">
                    {formatRelative(demo.recordedAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="border-t border-ink-700 px-5 py-4">
          <SyncDemosButton matchId={id} />
        </div>
      </Card>

      <p className="text-sm text-ink-400">
        Demos are not downloadable through the panel yet. A match recording runs
        to a few hundred megabytes, so serving them means deciding where they
        should live — streamed from the game host on request, or copied to the
        hub and kept for a fixed retention window. Until that is settled, the
        files can be pulled straight off{' '}
        <span className="text-ink-200">
          {match.instance.server.name} · {match.instance.name}
        </span>{' '}
        from the CS2 game directory.
      </p>
    </div>
  );
}
