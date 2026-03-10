import {
  startOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfQuarter,
  endOfQuarter,
  subMonths,
  subQuarters,
  subWeeks,
  subDays,
  format,
  isSameMonth,
} from 'date-fns';
import { es } from 'date-fns/locale';
import { toZonedTime } from 'date-fns-tz';

/**
 * Zona horaria para Chile
 */
export const CHILE_TIMEZONE = 'America/Santiago';

/**
 * Obtiene el inicio del día actual en zona horaria de Chile
 */
export function getStartOfToday(): Date {
  const now = new Date();
  const zonedNow = toZonedTime(now, CHILE_TIMEZONE);
  return startOfDay(zonedNow);
}

export function getChileNow(): Date {
  const now = new Date();
  return toZonedTime(now, CHILE_TIMEZONE);
}

/**
 * Obtiene el inicio del mes actual en zona horaria de Chile
 */
export function getStartOfThisMonth(): Date {
  const now = new Date();
  const zonedNow = toZonedTime(now, CHILE_TIMEZONE);
  return startOfMonth(zonedNow);
}

/**
 * Obtiene el fin del mes actual en zona horaria de Chile
 */
export function getEndOfThisMonth(): Date {
  const now = new Date();
  const zonedNow = toZonedTime(now, CHILE_TIMEZONE);
  return endOfMonth(zonedNow);
}

/**
 * Obtiene el inicio del mes anterior en zona horaria de Chile
 */
export function getStartOfLastMonth(): Date {
  const now = new Date();
  const zonedNow = toZonedTime(now, CHILE_TIMEZONE);
  const lastMonth = subMonths(zonedNow, 1);
  return startOfMonth(lastMonth);
}

/**
 * Obtiene el fin del mes anterior en zona horaria de Chile
 */
export function getEndOfLastMonth(): Date {
  const now = new Date();
  const zonedNow = toZonedTime(now, CHILE_TIMEZONE);
  const lastMonth = subMonths(zonedNow, 1);
  return endOfMonth(lastMonth);
}

/**
 * Obtiene el inicio de ayer en zona horaria de Chile
 */
export function getStartOfYesterday(): Date {
  const now = new Date();
  const zonedNow = toZonedTime(now, CHILE_TIMEZONE);
  const yesterday = subDays(zonedNow, 1);
  return startOfDay(yesterday);
}

/**
 * Obtiene la fecha de hace N días
 */
export function getDaysAgo(days: number): Date {
  const now = new Date();
  const zonedNow = toZonedTime(now, CHILE_TIMEZONE);
  return subDays(zonedNow, days);
}

export function getStartOfThisWeek(): Date {
  const zonedNow = getChileNow();
  return startOfWeek(zonedNow, { weekStartsOn: 1 });
}

export function getEndOfThisWeek(): Date {
  const zonedNow = getChileNow();
  return endOfWeek(zonedNow, { weekStartsOn: 1 });
}

export function getStartOfLastWeek(): Date {
  const zonedNow = subWeeks(getChileNow(), 1);
  return startOfWeek(zonedNow, { weekStartsOn: 1 });
}

export function getEndOfLastWeek(): Date {
  const zonedNow = subWeeks(getChileNow(), 1);
  return endOfWeek(zonedNow, { weekStartsOn: 1 });
}

export function getStartOfThisQuarter(): Date {
  const zonedNow = getChileNow();
  return startOfQuarter(zonedNow);
}

export function getEndOfThisQuarter(): Date {
  const zonedNow = getChileNow();
  return endOfQuarter(zonedNow);
}

export function getStartOfLastQuarter(): Date {
  const zonedNow = subQuarters(getChileNow(), 1);
  return startOfQuarter(zonedNow);
}

export function getEndOfLastQuarter(): Date {
  const zonedNow = subQuarters(getChileNow(), 1);
  return endOfQuarter(zonedNow);
}

/**
 * Formatea un número como moneda chilena (CLP)
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Formatea un porcentaje
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calcula el porcentaje de crecimiento entre dos valores
 * Retorna 0 si lastValue es 0 (evita división por cero)
 */
export function calculateGrowth(currentValue: number, lastValue: number): number {
  if (lastValue === 0) {
    return currentValue > 0 ? 100 : 0;
  }
  return ((currentValue - lastValue) / lastValue) * 100;
}

/**
 * Formatea una fecha para el eje X de gráficos (dd/MM)
 */
export function formatChartDate(date: Date): string {
  return format(date, 'dd/MM');
}

/**
 * Formatea una fecha completa en español (ej: "13 de febrero de 2026")
 */
export function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

/**
 * Genera un array de fechas de los últimos N días
 */
export function getLast7Days(): Date[] {
  const dates: Date[] = [];
  for (let i = 6; i >= 0; i--) {
    dates.push(getDaysAgo(i));
  }
  return dates;
}

/**
 * Convierte un valor Prisma Decimal a number
 * Útil para cálculos con datos de BD
 */
export function decimalToNumber(value: any): number {
  if (value === null || value === undefined) return 0;
  return Number(value);
}

/**
 * Formatea un rango de fechas del período para mostrar en la UI.
 * Usa la zona horaria de Chile para representar correctamente los límites de día/semana.
 * Ej: "9 - 15 mar"  o  "28 feb - 6 mar" si cruza meses.
 *
 * @param startIso ISO string del inicio del período (UTC)
 * @param endIso   ISO string del fin del período (UTC)
 */
export function formatDateRange(startIso: string, endIso: string): string {
  const s = toZonedTime(new Date(startIso), CHILE_TIMEZONE);
  const e = toZonedTime(new Date(endIso), CHILE_TIMEZONE);
  if (isSameMonth(s, e)) {
    // mismo mes → "9 - 15 mar"
    return `${format(s, 'd', { locale: es })} - ${format(e, 'd MMM', { locale: es })}`;
  }
  // cruza meses → "28 feb - 6 mar"
  return `${format(s, 'd MMM', { locale: es })} - ${format(e, 'd MMM', { locale: es })}`;
}
