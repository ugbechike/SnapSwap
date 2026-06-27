export const publicEnv = {
  serverUrl: process.env.NEXT_PUBLIC_SERVER_URL ?? "http://localhost:3001"
} as const;
