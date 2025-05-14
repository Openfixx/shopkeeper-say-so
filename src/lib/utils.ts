
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Helper type guard to check if a value has a specific property
export function hasProperty<T extends object, K extends string>(
  obj: T,
  prop: K
): obj is T & Record<K, unknown> {
  return obj !== null && typeof obj === 'object' && prop in obj;
}

// Safe type guard for accessing nested properties
export function safeAccess<T, K extends keyof T>(obj: T | null | undefined, key: K): T[K] | undefined {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  return obj[key];
}
