import Link from 'next/link';
import { prisma } from '@/lib/db';
import { LIVE_MATCH_STATES } from '@/lib/match-state';
import { getT } from '@/lib/i18n';
import { Card, CardHeader, EmptyState, chipClass } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function AdminCreateMatchPage() {
  const t = await getT();

  const running = await prisma.gameInstance.findMany({
    where: { state: 'RUNNING' },
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      startMap: true,
      gamePort: true,
      server: { select: { name: true } },
      matches: {
        where: { state: { notIn: ['FINISHED', 'CANCELLED'] } },
        select: { id: true, title: true },
        take: 1,
      },
    },
  });

  const free = running.filter((instance) => instance.matches.length === 0);
  const busy = running.filter((instance) => instance.matches.length > 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink-100">
          {t.adminNavCreateMatch}
        </h1>
        <p className="mt-0.5 text-sm text-ink-400">
          {t.homeFreeServersDescription}
        </p>
      </div>

      <Card>
        <CardHeader title={t.homeFreeServers} />
        {free.length === 0 ? (
          <EmptyState
            title={t.homeEmptyTitle}
            description={t.serversEmptyDescription}
          />
        ) : (
          <div className="flex flex-wrap gap-2 px-5 py-4">
            {free.map((instance) => (
              <Link
                key={instance.id}
                href={`/admin/instances/${instance.id}/matches/new`}
                className={chipClass}
              >
                {instance.server.name} · {instance.name}
                <span className="ml-2 text-ink-400">
                  :{instance.gamePort} · {instance.startMap}
                </span>
              </Link>
            ))}
          </div>
        )}
      </Card>

      {busy.length > 0 ? (
        <Card>
          <CardHeader
            title={t.adminNavMatchesLive}
            description={`${busy.length}`}
          />
          <ul className="divide-y divide-ink-800 px-5">
            {busy.map((instance) => (
              <li
                key={instance.id}
                className="flex items-center justify-between gap-3 py-3 text-sm"
              >
                <span className="text-ink-300">
                  {instance.server.name} · {instance.name}
                </span>
                <Link
                  href={`/matches/${instance.matches[0]!.id}`}
                  className="text-ink-400 hover:text-brand-500"
                >
                  {instance.matches[0]!.title}
                </Link>
              </li>
            ))}
          </ul>
        </Card>
      ) : null}
    </div>
  );
}
