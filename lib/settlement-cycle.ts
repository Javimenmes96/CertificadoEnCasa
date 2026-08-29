const MADRID_TIME_ZONE = "Europe/Madrid";
const SETTLEMENT_CRON_UTC_HOUR = 11;

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

function settlementCutoff(settlementDate: string) {
  return new Date(`${settlementDate}T${String(SETTLEMENT_CRON_UTC_HOUR).padStart(2, "0")}:00:00.000Z`);
}

export function isSettlementDate(date = new Date()) {
  const { year, month, day } = madridDateParts(date);
  const lastDay = daysInMonth(year, month);
  return day === 10 || day === 20 || day === lastDay;
}

export function nextSettlementDate(date = new Date()) {
  const { year, month, day } = madridDateParts(date);
  const lastDay = daysInMonth(year, month);
  const candidates = [10, 20, lastDay];

  for (const candidateDay of candidates) {
    if (day < candidateDay) {
      return formatDateParts(year, month, candidateDay);
    }

    if (day === candidateDay) {
      const candidate = formatDateParts(year, month, candidateDay);
      if (date.getTime() < settlementCutoff(candidate).getTime()) {
        return candidate;
      }
    }
  }

  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;
  return formatDateParts(nextYear, nextMonth, 10);
}

export function isEligibleBySettlementDate(eligibleAt: string | null, settlementDate: string) {
  if (!eligibleAt) return false;
  return new Date(eligibleAt).getTime() <= settlementCutoff(settlementDate).getTime();
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
