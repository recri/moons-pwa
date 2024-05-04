/* eslint-disable camelcase */
/* eslint-disable no-nested-ternary */
/* eslint-disable prefer-destructuring */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-console */
/* eslint-disable no-empty */
/* eslint-disable no-continue */
/*
 ** Copyright (C) 2018 by Roger E Critchlow Jr,
 ** Charlestown, MA, USA
 ** rec@elf.org
 **
 ** This program is free software; you can redistribute it and/or
 ** modify it under the terms of the GNU General Public License
 ** as published by the Free Software Foundation; either version 2
 ** of the License, or (at your option) any later version.
 **
 ** This program is distributed in the hope that it will be useful,
 ** but WITHOUT ANY WARRANTY; without even the implied warranty of
 ** MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 ** GNU General Public License for more details.
 **
 ** You should have received a copy of the GNU General Public License
 ** along with this program; if not, write to the Free Software
 ** Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 **
 ** The home page for this calendar is
 **	http://www.elf.org/moons/
 ** a copy of the GNU GPL may be found at
 **	http://www.gnu.org/copyleft/gpl.html,
 */

//
// web worker to compute the values required for a month of calendar
//
// FIX.ME - these need to change to importScripts() when you figure out how
import { Ephemerides } from './ephemerides.js';
import {
  DrawOptions,
  TaggedTime,
  MonthData,
  MonthDataEvent,
} from './moons-calendar-interfaces.js';

const millis_per_day = 24 * 60 * 60 * 1000; // milliseconds in a day
const millis_per_degree = (27.3 * 24 * 60 * 60 * 1000) / 360; // milliarcseconds per degree???

//
// cache ephemerides computations
// fetch ephemerides for date (maybe) with caching
// restrict the cache to +/- 30 days from the start date of the moon we're working on
//
const ephemerides_cache: Map<number, Ephemerides> = new Map();

export const clear_ephemerides_cache = () => {
  ephemerides_cache.clear();
};

const ephemerides_cached_times = (): Array<number> =>
  Array.from(ephemerides_cache.keys()).sort((a, b) => a - b);

const ephemerides_at_time = (_t: number): Ephemerides => {
  function ephemerides(t: number) {
    const date = new Date(t);
    return new Ephemerides(
      date.getUTCFullYear(),
      date.getUTCMonth() + 1,
      date.getUTCDate(),
      date.getUTCHours() +
        (date.getUTCMinutes() + date.getUTCSeconds() / 60) / 60
    );
  }
  if (!ephemerides_cache.has(_t)) ephemerides_cache.set(_t, ephemerides(_t));
  return ephemerides_cache.get(_t)!;
};

//
// find a zero of a function via Brent's method
// this is ripped off from the apache commons-math-1.1 package
//
function find_zero_by_brents_method(
  f: (x: number) => number,
  _x0: number,
  _y0: number,
  _x1: number,
  _y1: number
) {
  let x0 = _x0;
  let y0 = _y0;
  let x1 = _x1;
  let y1 = _y1;

  const maximalIterationCount = 100;
  const relativeAccuracy = 1e-14;
  const absoluteAccuracy = 1e-6;
  const functionValueAccuracy = 5e-3;
  // Index 0 is the old approximation for the root.
  // Index 1 is the last calculated approximation  for the root.
  // Index 2 is a bracket for the root with respect to x1.

  // See if we're already there
  if (Math.abs(y1) <= functionValueAccuracy) {
    return x1;
  }

  // Verify bracketing
  if (y0 * y1 >= 0) {
    throw new Error(
      `Function values [${y0},${y1}] at endpoints [${x0},${x1}] do not have different signs.`
    );
  }

  let x2 = x0;
  let y2 = y0;
  let delta = x1 - x0;
  let oldDelta = delta;

  let i = 0;
  while (i < maximalIterationCount) {
    // console.log(`brent at i ${i} x0 ${x0} y0 ${y0} x1 ${x1} y1 ${y1} x2 ${x2} y2 ${y2}`);
    if (Math.abs(y2) < Math.abs(y1)) {
      x0 = x1;
      x1 = x2;
      x2 = x0;
      y0 = y1;
      y1 = y2;
      y2 = y0;
    }
    if (Math.abs(y1) <= functionValueAccuracy) {
      // Avoid division by very small values. Assume
      // the iteration has converged (the problem may
      // still be ill conditioned)
      // console.log(`brent found ${y1} in ${i} iterations`);
      return x1;
    }
    const dx = x2 - x1;
    const tolerance = Math.max(
      relativeAccuracy * Math.abs(x1),
      absoluteAccuracy
    );
    if (Math.abs(dx) <= tolerance) {
      // console.log("brent found "+y1+" in "+i+" iterations");
      return x1;
    }
    if (Math.abs(oldDelta) < tolerance || Math.abs(y0) <= Math.abs(y1)) {
      // Force bisection.
      delta = 0.5 * dx;
      oldDelta = delta;
    } else {
      const r3 = y1 / y0;
      let p;
      let p1;
      if (x0 === x2) {
        // Linear interpolation.
        p = dx * r3;
        p1 = 1.0 - r3;
      } else {
        // Inverse quadratic interpolation.
        const r1 = y0 / y2;
        const r2 = y1 / y2;
        p = r3 * (dx * r1 * (r1 - r2) - (x1 - x0) * (r2 - 1.0));
        p1 = (r1 - 1.0) * (r2 - 1.0) * (r3 - 1.0);
      }
      if (p > 0.0) {
        p1 = -p1;
      } else {
        p = -p;
      }
      if (
        2.0 * p >= 1.5 * dx * p1 - Math.abs(tolerance * p1) ||
        p >= Math.abs(0.5 * oldDelta * p1)
      ) {
        // Inverse quadratic interpolation gives a value
        // in the wrong direction, or progress is slow.
        // Fall back to bisection.
        delta = 0.5 * dx;
        oldDelta = delta;
      } else {
        oldDelta = delta;
        delta = p / p1;
      }
    }
    // Save old X1, Y1
    x0 = x1;
    y0 = y1;
    // Compute new X1, Y1
    if (Math.abs(delta) > tolerance) {
      x1 += delta;
    } else if (dx > 0.0) {
      x1 += 0.5 * tolerance;
    } else if (dx <= 0.0) {
      x1 -= 0.5 * tolerance;
    }
    y1 = f(x1);
    if (y1 > 0 === y2 > 0) {
      x2 = x0;
      y2 = y0;
      delta = x1 - x0;
      oldDelta = delta;
    }
    i += 1;
  }
  throw new Error('Maximum number of iterations exceeded.');
}

//
// find the dates of moon's conjunction with ascending and descending nodes
//
function moon_node_conjunction(date0: number, node: string): number | null {
  //
  // compute how many degrees the moon is away from the planet
  // this function is positive from 180 degrees behind down
  // to conjunction, and negative from conjunction up to
  // -180 degrees behind (ie, ahead).
  //
  function degrees_from_conjunction(t: number) {
    const eph = ephemerides_at_time(t);
    const moonlon = eph.ephemeris.Moon.lonecl;
    const nodelon = eph.ephemeris.Moon.N + (node === 'ascending' ? 0 : 180);
    const d = moonlon - nodelon;
    return d > 180 ? d - 360 : d < -180 ? d + 360 : d;
  }
  function moon_node_conjunction_time(time0: number): number | null {
    let t0;
    let d0;
    for (const t1 of ephemerides_cached_times()) {
      if (t1 < time0) continue;
      const d1 = degrees_from_conjunction(t1);
      if (d1 === 0) return t1;
      if (t0 !== undefined && d0 !== undefined && d1 * d0 < 0 && d0 < 0) {
        return find_zero_by_brents_method(
          degrees_from_conjunction,
          t0,
          d0,
          t1,
          d1
        );
      }
      t0 = t1;
      d0 = d1;
    }
    return null;
  }

  return moon_node_conjunction_time(date0);
}

//
// find the ascending and descending nodes of the moon
// from start date to end date
//
const compute_nodes = (c: MonthData): Array<TaggedTime> => {
  const node_date: Array<TaggedTime> = [];
  for (const node of ['ascending', 'descending']) {
    let d = moon_node_conjunction(c.min_date.time, node);
    while (d !== null && d < c.max_date.time) {
      node_date.push({ tag: node, time: d });
      d = moon_node_conjunction(d + millis_per_day, node);
    }
  }
  return node_date;
};

//
// find the perigee and apogee of the moon
// from start date to end date
//
const compute_gees = (c: MonthData): Array<TaggedTime> => {
  const gees: Array<TaggedTime> = [];
  return gees;
};

const compute_zodiac = (c: MonthData): Array<TaggedTime> => {
  const zodiac: Array<TaggedTime> = [];
  return zodiac;
};

//
// find the next date of moon planet conjunction
// in ecliptic longitude
// forward from the given date.
//
function moon_planet_conjunction(date0: number, planet: string): number|null {
  //
  // compute how many degrees the moon is away from the planet
  // this function is positive from 180 degrees behind down
  // to conjunction, and negative from conjunction up to
  // -180 degrees behind (ie, ahead).
  //
  function degrees_from_conjunction(t: number) {
    const eph = ephemerides_at_time(t);
    const moonlon = eph.ephemeris.Moon.lonecl;
    const planetlon = eph.ephemeris[planet].loneclg;
    const d = moonlon - planetlon;
    return d > 180 ? d - 360 : d < -180 ? d + 360 : d;
  }
    function moon_planet_conjunction_time(time0: number) {
    let t0;
    let d0;
    for (const t1 of ephemerides_cached_times()) {
      const d1 = degrees_from_conjunction(t1);
      if (t1 < time0) continue;
      if (d1 === 0) return t1;
	if (t0 !== undefined && d0 !== undefined && d1 * d0 < 0 && d0 < 0) {
        return find_zero_by_brents_method(
          degrees_from_conjunction,
          t0,
          d0,
          t1,
          d1
        );
      } else {
        t0 = t1;
        d0 = d1;
      }
    }
    return null;
  }

  return moon_planet_conjunction_time(date0);
}

//
// find the conjunctions of the moon with planets
// from start date to end date
//
export const compute_planets = (c: MonthData): Array<TaggedTime> => {
  const planet_date: Array<TaggedTime> = [];
    for (const p of Object.keys(Ephemerides.Planets)) {
    let d = moon_planet_conjunction(c.min_date.time, p);
    while (d !== null && d < c.max_date.time) {
      planet_date.push({ tag: p, time: d });
      d = moon_planet_conjunction(d + millis_per_day, p);
    }
  }
  return planet_date;
};

//
// find the date nearest the given date when the moon's elongation is elong
//
export const moon_at_phase = (date0: number, _phase: number) => {
  //
  // fetch moon phase at date
  // note that the "elongation" includes separation in latitude
  // so it only goes to zero at new moons which are total eclipses
  // we're only concerned with elongation in longitude.
  //
  function moon_phase_at_time(t:number) {
    const eph = ephemerides_at_time(t);
    const phase = eph.ephemeris.Moon.lonecl - eph.ephemeris.Sun.lonecl;
    // System.out.print("moon_phase_at_time("+t+") is "+(phase < 0 ? phase + 360 : phase));
    return phase < 0 ? phase + 360 : phase;
  }

  //
  // compute the error in phase where e1 is current and e2 is desired
  // phase starts at zero, increases to 359.9999..., and jumps back to 0
  // so when approaching 0 from below, be careful
  //
  function error_in_moon_phase(t:number) {
    const de = _phase - moon_phase_at_time(t);
    return de > 180 ? de - 360 : de < -180 ? de + 360 : de;
  }

    function moon_at_phase_time(time0:number) {
    const x0 = time0;
    const y0 = error_in_moon_phase(x0);
    const x1 = x0 + 1.25 * y0 * millis_per_degree;
    const y1 = error_in_moon_phase(x1);
    return find_zero_by_brents_method(error_in_moon_phase, x0, y0, x1, y1);
  }

  return moon_at_phase_time(date0);
};

//
// compute the n phases of the moon
// starting from the nearest new moon to date
// and working forward in time
//
export const compute_month = (c: MonthData, date: number, n: number): Array<TaggedTime> => {
    // console.log(`compute_month(..., ${date.toString()}, ${n})`);
    const month_date = new Array(n + 1);
    month_date[0] = {tag: `0/${n}`, time: date};
    const dt = (29.5 / (n - 1)) * millis_per_day;
    for (let i = 1; i <= n; i += 1) {
	const from_date = month_date[i - 1].time + dt;
	month_date[i] = {tag: `${i}/${n}`, time: moon_at_phase(from_date, (i * (360 / n)) % 360)};
  }
  return month_date;
};

/* eslint-disable no-param-reassign */
const compute = (c: MonthData) => {
  c.start0 = moon_at_phase(c.start, 0);
  // console.log(`moon_at_phase(${c.start}, 0) returned ${c.start0}`);
  // this should return an array of times for the nphases of the moon
    c.phases = compute_month(c, c.start0, c.nphases());
  // console.log(`compute_month returned ${c.m_date.map((d) => d).join(', ')}`);
  c.min_date = c.phases[0];
  c.max_date = c.phases[c.nphases()];
  // planets will return an array of [time:number, tag:string, ...]
  // where tags are planet names
  if (c.draw.planets) c.planets = compute_planets(c);
  // gees will return an array of [time:number, tag:string, ...]
  // where tags are perigee, apogee, perihelion, apohelion
  if (c.draw.orbital_gees) c.gees = compute_gees(c);
  // nodes will return an array of [time:number, tag:string, ...]
  // where tags are ascending or descending
  // mark the ascending and descending nodes
  if (c.draw.orbital_nodes) c.nodes = compute_nodes(c);
  // mark the zodiac or first point of aries
  // nodes will return an array of [time:number, tag:string, ...]
  // where tags are zodiac signs
  if (c.draw.zodiac || c.draw.aries) c.zodiac = compute_zodiac(c);
  return c;
};
/* eslint-enable no-param-reassign */

//
// handle worker interface
//
const onmessage = (e: MonthDataEvent) => {
  // console.log(`worker in generate.js received ${e.data}`);
  const result: MonthData = compute(e.data);
  // console.log(`worker in generate.js computed ${result}`);
  postMessage(result);
};

const onerror = (e: MessageEvent) => {
  console.log(`worker in generate.js received error ${e}`);
};
// console.log('reached the end of generate.js');
// postMessage('reached the real end of generate.js');
