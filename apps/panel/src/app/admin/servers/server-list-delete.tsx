'use client';

import {
  DeleteServerButton,
  type DeleteServerLabels,
} from './delete-server-button';

export function ServerListDelete({
  serverId,
  labels,
}: {
  serverId: string;
  labels: DeleteServerLabels;
}) {
  return <DeleteServerButton serverId={serverId} labels={labels} />;
}
