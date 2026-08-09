import { requireRole } from '@/lib/auth';
import { getT } from '@/lib/i18n';
import { getDefaultFreezetime } from '@/lib/match-defaults';
import { listAllMaps } from '@/lib/maps';
import { Badge, Card, CardHeader } from '@/components/ui';
import { AddMapForm, MapRowActions } from './map-forms';
import { MatchDefaultsForm } from './match-defaults-form';

export const dynamic = 'force-dynamic';

const POOL_ORDER = ['ACTIVE_DUTY', 'COMPETITIVE', 'CUSTOM'] as const;

export default async function AdminSettingsPage() {
  await requireRole('ADMIN');
  const t = await getT();
  const [maps, defaultFreezetime] = await Promise.all([
    listAllMaps(),
    getDefaultFreezetime(),
  ]);

  const byPool = POOL_ORDER.map((pool) => ({
    pool,
    title:
      pool === 'ACTIVE_DUTY'
        ? t.settingsMapsActiveDuty
        : pool === 'COMPETITIVE'
          ? t.settingsMapsCompetitive
          : t.settingsMapsCustom,
    description:
      pool === 'ACTIVE_DUTY'
        ? t.settingsMapsActiveDutyHint
        : pool === 'COMPETITIVE'
          ? t.settingsMapsCompetitiveHint
          : t.settingsMapsCustomHint,
    items: maps.filter((map) => map.pool === pool),
  }));

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-lg font-semibold text-ink-100">{t.settingsTitle}</h1>
        <p className="mt-1 text-sm text-ink-400">{t.settingsDescription}</p>
      </div>

      <Card>
        <CardHeader
          title={t.settingsMatchDefaultsTitle}
          description={t.settingsMatchDefaultsDescription}
        />
        <div className="px-5 py-5">
          <MatchDefaultsForm
            freezetime={defaultFreezetime}
            labels={{
              freezetime: t.settingsDefaultFreezetime,
              freezetimeHint: t.settingsDefaultFreezetimeHint,
              submit: t.settingsMatchDefaultsSave,
              saved: t.settingsMatchDefaultsSaved,
            }}
          />
        </div>
      </Card>

      <Card>
        <CardHeader
          title={t.settingsMapsTitle}
          description={t.settingsMapsDescription}
        />
        <div className="space-y-8 px-5 py-5">
          {byPool.map((group) => (
            <section key={group.pool} className="space-y-3">
              <div>
                <h2 className="text-sm font-medium text-ink-100">{group.title}</h2>
                <p className="mt-0.5 text-xs text-ink-400">{group.description}</p>
              </div>
              {group.items.length === 0 ? (
                <p className="text-sm text-ink-500">{t.settingsMapsEmpty}</p>
              ) : (
                <ul className="divide-y divide-ink-700/80 rounded-xl border border-ink-700/80">
                  {group.items.map((map) => (
                    <li
                      key={map.id}
                      className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink-100">
                          {map.label}
                          <span className="ml-2 font-mono text-xs text-ink-400">
                            {map.name}
                          </span>
                        </p>
                        <div className="mt-1">
                          <Badge tone={map.enabled ? 'ok' : 'neutral'}>
                            {map.enabled
                              ? t.settingsMapsEnabled
                              : t.settingsMapsDisabled}
                          </Badge>
                        </div>
                      </div>
                      <MapRowActions
                        id={map.id}
                        enabled={map.enabled}
                        canDelete={map.pool === 'CUSTOM'}
                        labels={{
                          enable: t.settingsMapsEnable,
                          disable: t.settingsMapsDisable,
                          delete: t.settingsMapsDelete,
                        }}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}

          <section className="border-t border-ink-700/80 pt-6">
            <h2 className="mb-3 text-sm font-medium text-ink-100">
              {t.settingsMapsAdd}
            </h2>
            <AddMapForm
              labels={{
                name: t.settingsMapsName,
                nameHint: t.settingsMapsNameHint,
                label: t.settingsMapsLabel,
                labelHint: t.settingsMapsLabelHint,
                submit: t.settingsMapsAddSubmit,
              }}
            />
          </section>
        </div>
      </Card>
    </div>
  );
}
