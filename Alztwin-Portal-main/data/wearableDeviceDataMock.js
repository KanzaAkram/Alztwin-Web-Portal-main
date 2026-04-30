export const RAFAY_PATIENT_NAME = "Rafay";
export const RAFAY_PATIENT_ID = "patient_1776607538754";
export const SENSOR_HISTORY_DAYS = 14;
export const SENSOR_SEED_VERSION = "rafay-sensor-seed-v5";

export const SENSOR_DISPLAY_FIELDS = [
  "bpm",
  "fall",
  "latitude",
  "longitude",
  "outOfZone",
  "pitch",
  "roll",
  "sleeping",
];

const BASE_DATE = new Date("2026-04-30T00:00:00+05:00");
const READING_TIMES = [
  { hour: 0, minute: 15 },
  { hour: 3, minute: 30 },
  { hour: 6, minute: 45 },
  { hour: 9, minute: 20 },
  { hour: 12, minute: 45 },
  { hour: 15, minute: 10 },
  { hour: 18, minute: 15 },
  { hour: 21, minute: 40 },
];

const DAILY_RISK_LEVELS = [3, 2, 2, 3, 1, 4, 2, 3, 1, 4, 2, 1, 3, 1];
const FALL_EVENTS = new Set(["1-6", "5-5", "9-4", "12-6"]);
const SLEEP_READING_PROFILES = [
  [0, 1, 7],
  [0, 1, 2, 7],
  [0, 1],
  [0, 7],
  [0, 1, 7],
  [0, 1, 2],
  [0, 1, 7],
  [0, 1],
  [0, 7],
  [0, 1, 2, 7],
  [0, 1, 7],
  [0, 1],
  [0, 1, 2],
  [0, 7],
];

const toDateKey = (date) => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Karachi",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const part = (type) => parts.find((item) => item.type === type)?.value;
  return `${part("year")}-${part("month")}-${part("day")}`;
};
const round = (value, decimals = 2) => Number(value.toFixed(decimals));

const makeReadingDate = (dayOffset, time) => {
  const date = new Date(BASE_DATE);
  date.setDate(BASE_DATE.getDate() - dayOffset);
  date.setHours(time.hour, time.minute, 0, 0);
  return date;
};

const isSleepingReading = (dayOffset, readingIndex) =>
  SLEEP_READING_PROFILES[dayOffset % SLEEP_READING_PROFILES.length].includes(readingIndex);

const isOutOfBoundReading = (dayOffset, readingIndex, riskLevel) => {
  if (FALL_EVENTS.has(`${dayOffset}-${readingIndex}`)) return true;
  if (riskLevel >= 4 && [3, 4, 5, 6].includes(readingIndex)) return true;
  if (riskLevel >= 3 && [4, 6].includes(readingIndex)) return true;
  if (riskLevel >= 2 && readingIndex === 6) return true;
  return false;
};

export const RAFAY_SENSOR_MOCK_READINGS = DAILY_RISK_LEVELS.flatMap(
  (riskLevel, dayOffset) =>
    READING_TIMES.map((time, readingIndex) => {
      const date = makeReadingDate(dayOffset, time);
      const sleeping = isSleepingReading(dayOffset, readingIndex);
      const fall = FALL_EVENTS.has(`${dayOffset}-${readingIndex}`);
      const outOfBound = isOutOfBoundReading(dayOffset, readingIndex, riskLevel) ? 1 : 0;
      const activityWave = Math.sin((readingIndex + dayOffset) * 0.85);
      const baseBpm = sleeping ? 63 : 76 + readingIndex * 3.4;
      const riskBump = outOfBound ? 13 + riskLevel * 3.2 : riskLevel * 1.1;
      const bpm = round(fall ? 126 + dayOffset * 0.7 : baseBpm + riskBump + activityWave * 4.6);
      const pitch = round(
        fall
          ? 34 + riskLevel * 1.7
          : (sleeping ? 4.8 : 8.6 + readingIndex * 2.1) + outOfBound * 7.4 + dayOffset * 0.18
      );
      const roll = round(
        fall
          ? -22 - riskLevel
          : (sleeping ? -0.9 : -1.8 - readingIndex * 1.15) - outOfBound * 4.8 - dayOffset * 0.07
      );

      return {
        timestampMs: date.getTime(),
        dateKey: toDateKey(date),
        bpm,
        fall,
        latitude: round(outOfBound ? 24.861 + dayOffset * 0.00011 + readingIndex * 0.00002 : 24.8607, 6),
        longitude: round(outOfBound ? 67.0014 + dayOffset * 0.00009 + readingIndex * 0.00002 : 67.0011, 6),
        outOfZone: Boolean(outOfBound),
        outOfBound,
        pitch,
        roll,
        sleeping,
      };
    })
);
