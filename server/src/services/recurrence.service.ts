import { RecurrenceInterval } from "../generated/prisma/client.js";

export function getNextPeriod(
  period: string,
  interval: RecurrenceInterval,
): string {
  switch (interval) {
    case RecurrenceInterval.MONTHLY:
      return getNextMonthlyPeriod(period);

    case RecurrenceInterval.QUARTERLY:
      return getNextQuarterlyPeriod(period);

    case RecurrenceInterval.YEARLY:
      return getNextYearlyPeriod(period);
  }
}

function getNextMonthlyPeriod(period: string): string {
  const match = /^(\d{4})-(\d{2})$/.exec(period);

  if (!match) {
    throw new Error("Invalid monthly period.");
  }

  let year = Number(match[1]);
  let month = Number(match[2]);

  month += 1;

  if (month === 13) {
    month = 1;
    year += 1;
  }

  return `${year}-${String(month).padStart(2, "0")}`;
}

function getNextQuarterlyPeriod(period: string): string {
  const match = /^(\d{4})-Q([1-4])$/.exec(period);

  if (!match) {
    throw new Error("Invalid quarterly period.");
  }

  let year = Number(match[1]);
  let quarter = Number(match[2]);

  quarter += 1;

  if (quarter === 5) {
    quarter = 1;
    year += 1;
  }

  return `${year}-Q${quarter}`;
}

function getNextYearlyPeriod(period: string): string {
  const match = /^(\d{4})$/.exec(period);

  if (!match) {
    throw new Error("Invalid yearly period.");
  }

  return String(Number(match[1]) + 1);
}
