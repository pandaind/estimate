import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes safely, resolving conflicts via tailwind-merge.
 * Use this instead of inline template-literal class strings.
 *
 * @param {...import('clsx').ClassValue} inputs
 * @returns {string}
 */
export const cn = (...inputs) => twMerge(clsx(inputs));
