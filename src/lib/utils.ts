// @ts-nocheck
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number, decimals = 4) {
  return n.toFixed(decimals);
}

export function formatPercent(n: number) {
  return `${(n * 100).toFixed(2)}%`;
}

export function formatMs(ms: number) {
  return ms < 1000 ? `${ms.toFixed(1)}ms` : `${(ms / 1000).toFixed(2)}s`;
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(2)} MB`;
}

export function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function generateId(prefix = "") {
  const rand = Math.random().toString(36).slice(2, 10);
  return prefix ? `${prefix}_${rand}` : rand;
}

// Simulate ML training step
export function simulateMetric(base: number, epoch: number, maxEpochs: number, variance = 0.02) {
  const progress = epoch / maxEpochs;
  const improvement = base * 0.15 * (1 - Math.exp(-3 * progress));
  const noise = (Math.random() - 0.5) * variance;
  return Math.min(base + improvement + noise, 0.99);
}
