import { getTimes, getPosition } from 'suncalc';
import * as THREE from 'three';

type SunTimesResult = ReturnType<typeof getTimes>;

export type AstronomicalPhase =
  | 'dawn'
  | 'morning'
  | 'noon'
  | 'golden_hour'
  | 'sunset'
  | 'dusk'
  | 'evening'
  | 'night';

export type WeatherType =
  | 'clear'
  | 'cloudy'
  | 'rain'
  | 'mist'
  | 'monsoon'
  | 'winter_fog';

export interface SolarState {
  hour: number; // 0 - 24
  phase: AstronomicalPhase;
  altitude: number; // in radians
  azimuth: number;
  skyZenith: string;
  skyMid: string;
  skyHorizon: string;
  sunPosition: [number, number, number];
  sunColor: string;
  sunIntensity: number;
  ambientColor: string;
  ambientIntensity: number;
  rimColor: string;
  rimIntensity: number;
  fogColor: string;
  fogDensity: number;
  isNight: boolean;
}

// Default location (Asia/Kolkata: lat 12.9716, lon 77.5946 - coarse regional center)
const DEFAULT_LAT = 12.9716;
const DEFAULT_LON = 77.5946;

export class SolarTimeService {
  private static userLat = DEFAULT_LAT;
  private static userLon = DEFAULT_LON;
  private static hasLocationConsent = false;

  public static setLocation(lat: number, lon: number) {
    this.userLat = lat;
    this.userLon = lon;
    this.hasLocationConsent = true;
  }

  /**
   * Computes solar calculation and continuous interpolated scene attributes for a given hour (0-24) or Date.
   */
  public static calculate(dateOrHour: Date | number = new Date()): SolarState {
    let targetDate: Date;
    let hourDecimal: number;

    if (typeof dateOrHour === 'number') {
      hourDecimal = Math.max(0, Math.min(24, dateOrHour));
      targetDate = new Date();
      targetDate.setHours(Math.floor(hourDecimal));
      targetDate.setMinutes(Math.floor((hourDecimal % 1) * 60));
      targetDate.setSeconds(Math.floor(((hourDecimal * 60) % 1) * 60));
    } else {
      targetDate = dateOrHour;
      hourDecimal = targetDate.getHours() + targetDate.getMinutes() / 60 + targetDate.getSeconds() / 3600;
    }

    const times = getTimes(targetDate, this.userLat, this.userLon);
    const sunPos = getPosition(targetDate, this.userLat, this.userLon);

    // Astronomical Phase determination
    const phase = this.determinePhase(targetDate, times, hourDecimal);

    // Continuous lighting & sky gradient interpolation based on sun altitude & normalized time
    return this.interpolateEnvironment(hourDecimal, phase, sunPos.altitude, sunPos.azimuth);
  }

  private static determinePhase(now: Date, times: SunTimesResult, hour: number): AstronomicalPhase {
    const t = now.getTime();
    const dawn = times.dawn?.getTime() || 5.5 * 3600000;
    const sunrise = times.sunrise?.getTime() || 6.2 * 3600000;
    const goldenHourEnd = times.goldenHourEnd?.getTime() || 8.0 * 3600000;
    const solarNoon = times.solarNoon?.getTime() || 12.2 * 3600000;
    const goldenHour = times.goldenHour?.getTime() || 17.5 * 3600000;
    const sunset = times.sunset?.getTime() || 18.2 * 3600000;
    const dusk = times.dusk?.getTime() || 18.8 * 3600000;

    // Relative to times of day
    if (t >= dawn && t < sunrise) return 'dawn';
    if (t >= sunrise && t < goldenHourEnd) return 'morning';
    if (t >= goldenHourEnd && t < goldenHour) return 'noon';
    if (t >= goldenHour && t < sunset) return 'golden_hour';
    if (t >= sunset && t < dusk) return 'sunset';
    if (t >= dusk && hour < 21.5) return 'evening';
    return 'night';
  }

  private static interpolateEnvironment(
    hour: number,
    phase: AstronomicalPhase,
    altitude: number,
    azimuth: number
  ): SolarState {
    // 3D Sun position from spherical coordinates
    const distance = 4.5;
    const sunX = Math.cos(altitude) * Math.sin(azimuth) * distance;
    const sunY = Math.max(0.4, Math.sin(altitude) * distance + 1.2);
    const sunZ = Math.cos(altitude) * Math.cos(azimuth) * distance;

    let skyZenith = '#02040a';
    let skyMid = '#0f172a';
    let skyHorizon = '#1e1b4b';
    let sunColor = '#ffe4cc';
    let sunIntensity = 0.85;
    let ambientColor = '#080d1c';
    let ambientIntensity = 0.32;
    let rimColor = '#00f3ff';
    let rimIntensity = 0.95;
    let fogColor = '#050816';
    let fogDensity = 0.025;
    const isNight = phase === 'night' || phase === 'dusk';

    switch (phase) {
      case 'dawn':
        skyZenith = '#070b19';
        skyMid = '#2e1065';
        skyHorizon = '#f472b6';
        sunColor = '#fbcfe8';
        sunIntensity = 0.8;
        ambientColor = '#1c1917';
        ambientIntensity = 0.35;
        rimColor = '#f43f5e';
        rimIntensity = 0.9;
        fogColor = '#1e112a';
        fogDensity = 0.035;
        break;

      case 'morning':
        skyZenith = '#0c1b33';
        skyMid = '#3b82f6';
        skyHorizon = '#fed7aa';
        sunColor = '#fff7ed';
        sunIntensity = 1.15;
        ambientColor = '#1e293b';
        ambientIntensity = 0.42;
        rimColor = '#f97316';
        rimIntensity = 0.85;
        fogColor = '#0f172a';
        fogDensity = 0.02;
        break;

      case 'noon':
        skyZenith = '#0369a1';
        skyMid = '#0284c7';
        skyHorizon = '#e0f2fe';
        sunColor = '#ffffff';
        sunIntensity = 1.3;
        ambientColor = '#0f2942';
        ambientIntensity = 0.45;
        rimColor = '#38bdf8';
        rimIntensity = 0.8;
        fogColor = '#0c1d2e';
        fogDensity = 0.015;
        break;

      case 'golden_hour':
        skyZenith = '#1e1b4b';
        skyMid = '#c026d3';
        skyHorizon = '#fbbf24';
        sunColor = '#fef08a';
        sunIntensity = 1.25;
        ambientColor = '#2e1065';
        ambientIntensity = 0.4;
        rimColor = '#f59e0b';
        rimIntensity = 1.1;
        fogColor = '#1f132b';
        fogDensity = 0.022;
        break;

      case 'sunset':
        skyZenith = '#0f051d';
        skyMid = '#9d174d';
        skyHorizon = '#f97316';
        sunColor = '#fb923c';
        sunIntensity = 1.05;
        ambientColor = '#281133';
        ambientIntensity = 0.38;
        rimColor = '#ef4444';
        rimIntensity = 1.2;
        fogColor = '#220b29';
        fogDensity = 0.03;
        break;

      case 'dusk':
      case 'evening':
        skyZenith = '#030712';
        skyMid = '#1e1b4b';
        skyHorizon = '#4c1d95';
        sunColor = '#fca5a5';
        sunIntensity = 0.75;
        ambientColor = '#111827';
        ambientIntensity = 0.3;
        rimColor = '#818cf8';
        rimIntensity = 0.85;
        fogColor = '#090d16';
        fogDensity = 0.028;
        break;

      case 'night':
      default:
        skyZenith = '#02040a';
        skyMid = '#060a17';
        skyHorizon = '#0f172a';
        sunColor = '#ffe4cc'; // Bedside lamp / moonlight
        sunIntensity = 0.85;
        ambientColor = '#080d1c';
        ambientIntensity = 0.28;
        rimColor = '#00f3ff';
        rimIntensity = 0.95;
        fogColor = '#050816';
        fogDensity = 0.025;
        break;
    }

    return {
      hour,
      phase,
      altitude,
      azimuth,
      skyZenith,
      skyMid,
      skyHorizon,
      sunPosition: [sunX, sunY, sunZ],
      sunColor,
      sunIntensity,
      ambientColor,
      ambientIntensity,
      rimColor,
      rimIntensity,
      fogColor,
      fogDensity,
      isNight,
    };
  }
}
