const MADRID_TIME_ZONE = "Europe/Madrid";

export type MadridDateParts = {
  year: number;
  month: number;
  day: number;
};

export function madridDateParts(date = new Date()): MadridDateParts {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: MADRID_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const value = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((part) => part.type === type)?.value || 0);

  return {
    year: value("year"),
    month: value("month"),
    day: value("day"),
  };
}

export function madridDateString(date = new Date()) {
  const { year, month, day } = madridDateParts(date);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function daysInMonth(year: number, month: number) {
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function formatDateParts(year: number, month: number, day: number) {
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function isSettlementDate(date = new Date()) {
  const { year, month, day } = madridDateParts(date);
  const lastDay = daysInMonth(year, month);
  return day === 10 || day === 20 || day === lastDay;
}

export function nextSettlementDate(date = new Date()) {
  const { year, month, day } = madridDateParts(date);
  const lastDay = daysInMonth(year, month);

  if (day <= 10) return formatDateParts(year, month, 10);
  if (day <= 20) return formatDateParts(year, month, 20);
  if (day <= lastDay) return formatDateParts(year, month, lastDay);

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return formatDateParts(nextYear, nextMonth, 10);
}

export function isEligibleBySettlementDate(eligibleAt: string | null, settlementDate: string) {
  if (!eligibleAt) return false;
  const eligibleDate = madridDateString(new Date(eligibleAt));
  return eligibleDate <= settlementDate;
}

export function formatSettlementDate(dateString: string) {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Intl.DateTimeFormat("es-ES", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    timeZone: "Europe/Madrid",
  }).format(new Date(Date.UTC(year, month - 1, day, 12)));
}
