import { Card, EmptyState } from '@/components/ui';
import { getT } from '@/lib/i18n';

export async function ComingSoon() {
  const t = await getT();
  return (
    <Card>
      <EmptyState title={t.adminComingSoon} description={t.adminComingSoonBody} />
    </Card>
  );
}
