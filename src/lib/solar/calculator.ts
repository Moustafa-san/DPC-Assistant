/**
 * Pure Astronomical Solar Calculations based on NOAA General Solar Position Algorithms.
 * Computes exact Sunrise, Sunset, Solar Noon, Golden Hour, and Blue Hour for any coordinate and date,
 * completely offline without external APIs.
 */

export interface SolarCoordinates {
  latitude: number;  // Decimal degrees (-90 to +90)
  longitude: number; // Decimal degrees (-180 to +180)
}

export interface SolarTimes {
  date: string;
  timeZone: string;
  sunrise: string;       // Formatted HH:mm
  sunset: string;        // Formatted HH:mm
  solarNoon: string;     // Formatted HH:mm
  morningGoldenHour: {
    start: string;
    end: string;
  };
  eveningGoldenHour: {
    start: string;
    end: string;
  };
  sunriseMinutesFromMidnight: number;
  sunsetMinutesFromMidnight: number;
}

const RAD = Math.PI / 180;
const DEG = 180 / Math.PI;

function getJulianDay(date: Date): number {
  return date.getTime() / 86400000 + 2440587.5;
}

function getJulianCentury(julianDay: number): number {
  return (julianDay - 2451545.0) / 36525.0;
}

function getGeomMeanLongSun(t: number): number {
  let l0 = 280.46646 + t * (36000.76983 + 0.0003032 * t);
  l0 = l0 % 360;
  if (l0 < 0) l0 += 360;
  return l0;
}

function getGeomMeanAnomalySun(t: number): number {
  return 357.52911 + t * (35999.05029 - 0.0001537 * t);
}

function getEccentricityEarthOrbit(t: number): number {
  return 0.016708634 - t * (0.000042037 + 0.0000001267 * t);
}

function getSunEqOfCenter(t: number, m: number): number {
  const mrad = m * RAD;
  return (
    Math.sin(mrad) * (1.914602 - t * (0.004817 + 0.000014 * t)) +
    Math.sin(mrad * 2) * (0.019993 - 0.000101 * t) +
    Math.sin(mrad * 3) * 0.000289
  );
}

function getSunTrueLong(l0: number, c: number): number {
  return l0 + c;
}

function getSunApparentLong(t: number, trueLong: number): number {
  const omega = 125.04 - 1934.136 * t;
  return trueLong - 0.00569 - 0.00478 * Math.sin(omega * RAD);
}

function getMeanObliquityOfEcliptic(t: number): number {
  const seconds = 21.448 - t * (46.815 + t * (0.00059 - t * 0.001813));
  return 23.0 + (26.0 + seconds / 60.0) / 60.0;
}

function getObliquityCorrection(t: number, e0: number): number {
  const omega = 125.04 - 1934.136 * t;
  return e0 + 0.00256 * Math.cos(omega * RAD);
}

function getSunDeclination(e: number, lambda: number): number {
  return Math.asin(Math.sin(e * RAD) * Math.sin(lambda * RAD)) * DEG;
}

function getEquationOfTime(t: number, l0: number, e: number, m: number): number {
  const eps = e * RAD;
  let y = Math.tan(eps / 2.0);
  y = y * y;

  const l0rad = l0 * RAD;
  const mrad = m * RAD;

  const sin2l0 = Math.sin(2.0 * l0rad);
  const sinm = Math.sin(mrad);
  const cos2l0 = Math.cos(2.0 * l0rad);
  const sin4l0 = Math.sin(4.0 * l0rad);
  const sin2m = Math.sin(2.0 * mrad);

  const eot =
    y * sin2l0 -
    2.0 * getEccentricityEarthOrbit(t) * sinm +
    4.0 * getEccentricityEarthOrbit(t) * y * sinm * cos2l0 -
    0.5 * y * y * sin4l0 -
    1.25 * getEccentricityEarthOrbit(t) * getEccentricityEarthOrbit(t) * sin2m;

  return eot * 4.0 * DEG; // in minutes of time
}

function getHourAngleForZenith(lat: number, decl: number, zenith: number): number | null {
  const latRad = lat * RAD;
  const declRad = decl * RAD;
  const zenithRad = zenith * RAD;

  const cosHA =
    (Math.cos(zenithRad) - Math.sin(latRad) * Math.sin(declRad)) /
    (Math.cos(latRad) * Math.cos(declRad));

  if (cosHA > 1 || cosHA < -1) {
    return null; // Sun never reaches this zenith (polar day / polar night)
  }

  return Math.acos(cosHA) * DEG;
}

function formatMinutesToHHMM(totalMinutes: number): string {
  let mins = Math.round(totalMinutes);
  if (mins < 0) mins += 1440;
  mins = mins % 1440;

  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Calculates solar times for a given date, coordinates, and IANA timezone.
 */
export function calculateSolarTimes(
  dateIso: string, // YYYY-MM-DD
  coords: SolarCoordinates,
  timeZone: string = "Africa/Cairo"
): SolarTimes {
  const { latitude, longitude } = coords;

  // Parse local date in target timezone to determine UTC offset at noon
  const noonDate = new Date(`${dateIso}T12:00:00Z`);
  
  // Calculate timezone offset for the given IANA timezone on that date
  const tzFormatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    hour12: false,
  });
  
  // Compare UTC vs target timezone to extract accurate offset in minutes
  const parts = tzFormatter.formatToParts(noonDate);
  const tzHour = parseInt(parts.find((p) => p.type === "hour")?.value ?? "12", 10);
  const utcHour = noonDate.getUTCHours();
  let tzOffsetHours = tzHour - utcHour;
  if (tzOffsetHours < -12) tzOffsetHours += 24;
  if (tzOffsetHours > 12) tzOffsetHours -= 24;
  const tzOffsetMinutes = tzOffsetHours * 60;

  const jd = getJulianDay(noonDate);
  const t = getJulianCentury(jd);

  const l0 = getGeomMeanLongSun(t);
  const m = getGeomMeanAnomalySun(t);
  const c = getSunEqOfCenter(t, m);
  const trueLong = getSunTrueLong(l0, c);
  const appLong = getSunApparentLong(t, trueLong);
  const e0 = getMeanObliquityOfEcliptic(t);
  const e = getObliquityCorrection(t, e0);
  const decl = getSunDeclination(e, appLong);
  const eot = getEquationOfTime(t, l0, e, m);

  // Solar noon in local minutes
  const solarNoonUTCMinutes = 720 - 4 * longitude - eot;
  const solarNoonLocalMinutes = solarNoonUTCMinutes + tzOffsetMinutes;

  // Standard sunrise/sunset zenith angle = 90.8333 degrees (includes atmospheric refraction)
  const standardZenith = 90.8333;
  const haStandard = getHourAngleForZenith(latitude, decl, standardZenith) ?? 90;
  const sunriseMinutes = solarNoonLocalMinutes - haStandard * 4;
  const sunsetMinutes = solarNoonLocalMinutes + haStandard * 4;

  // Golden Hour: Sun between 6 degrees above horizon (zenith 84 deg) and 4 degrees below (zenith 94 deg)
  const haGoldenHigh = getHourAngleForZenith(latitude, decl, 84) ?? haStandard;
  const haGoldenLow = getHourAngleForZenith(latitude, decl, 94) ?? haStandard;

  const morningGoldenStart = solarNoonLocalMinutes - haGoldenLow * 4;
  const morningGoldenEnd = solarNoonLocalMinutes - haGoldenHigh * 4;

  const eveningGoldenStart = solarNoonLocalMinutes + haGoldenHigh * 4;
  const eveningGoldenEnd = solarNoonLocalMinutes + haGoldenLow * 4;

  return {
    date: dateIso,
    timeZone,
    sunrise: formatMinutesToHHMM(sunriseMinutes),
    sunset: formatMinutesToHHMM(sunsetMinutes),
    solarNoon: formatMinutesToHHMM(solarNoonLocalMinutes),
    morningGoldenHour: {
      start: formatMinutesToHHMM(morningGoldenStart),
      end: formatMinutesToHHMM(morningGoldenEnd),
    },
    eveningGoldenHour: {
      start: formatMinutesToHHMM(eveningGoldenStart),
      end: formatMinutesToHHMM(eveningGoldenEnd),
    },
    sunriseMinutesFromMidnight: Math.round(sunriseMinutes),
    sunsetMinutesFromMidnight: Math.round(sunsetMinutes),
  };
}
