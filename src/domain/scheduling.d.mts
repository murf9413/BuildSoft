export interface Step { id: string; name: string; start: string; duration: number; locked: boolean }
export interface Dependency { before: string; after: string; relation: 'same-day' | 'next-working-day' | 'previous-working-day' }
export interface Move { id: string; offset: number; scope: 'only' | 'following' | 'selected'; selected?: readonly string[] }
export function isWorkingDay(value: string, holidays?: readonly string[]): boolean;
export function shiftWorkingDays(value: string, offset: number, holidays?: readonly string[]): string;
export function finishDate(step: Step, holidays?: readonly string[]): string;
export function validateSchedule(steps: readonly Step[], dependencies?: readonly Dependency[], holidays?: readonly string[]): void;
export function previewMove<T extends Step>(steps: readonly T[], move: Move, dependencies?: readonly Dependency[], holidays?: readonly string[]): T[];
export function countDays(start: string, through: string, mode?: 'calendar' | 'working', holidays?: readonly string[]): number;
export function calculateDuc(allowed: number, actual: number): { value: number; tone: 'green' | 'neutral' | 'red' };
