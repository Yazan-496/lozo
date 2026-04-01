export function getPresenceString(isOnline: boolean, lastSeenAt: string): string {
  if (isOnline) return 'Active now';
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return 'Active now';
  if (minutes < 60) return `Active ${minutes}m ago`;
  const hours = Math.floor(diff / 3_600_000);
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.floor(diff / 86_400_000);
  return `Active ${days}d ago`;
}
