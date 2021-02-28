/** utility functions */
export function isUUIDv4(id?: string): boolean {
  if (!id) {
    return false;
  }
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/g;
  const matched = id.match(regex);
  return matched && matched.length === 1 ? true : false;
}
