export type CreateContextOptions = {
  context: unknown;
};

export function createContext({ context: _context }: CreateContextOptions) {
  return {};
}

export type Context = Awaited<ReturnType<typeof createContext>>;
