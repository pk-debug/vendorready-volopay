export function isValidISODate(value: unknown): value is string;
export function calculateProgress(items: Array<{is_completed: unknown}>): {complete:number;total:number;percent:number;status:'ready'|'in_progress'|'not_started'};
export function safeText(value: unknown, maxLength?: number): string;
export function validEmail(value: unknown): boolean;
