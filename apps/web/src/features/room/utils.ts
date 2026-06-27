export function normalizeRoomCode(code: string) {
  return code.trim().toUpperCase().slice(0, 6);
}
