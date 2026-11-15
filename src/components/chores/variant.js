// Варіант міні-гри: щоразу інший (по колу, коли варіанти скінчилися).
export const pickVariant = (list, n = 0) => list[((n % list.length) + list.length) % list.length];
