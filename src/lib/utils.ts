
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

// Safe extraction of value from an object that might have a 'value' property
export function safeExtractValue<T>(obj: any): T | undefined {
  if (obj === null || obj === undefined) {
    return undefined;
  }
  
  if (typeof obj === 'object' && 'value' in obj && obj.value !== undefined) {
    return obj.value as T;
  }
  
  return typeof obj === 'object' ? undefined : obj as T;
}

// Convert any value to string safely
export function safeToString(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }
  
  if (typeof value === 'object' && 'value' in value && value.value !== undefined) {
    return String(value.value);
  }
  
  return String(value);
}
