//
// EphemerisDay, values computed in Ephemerides
// which are used in postion computation
// abstracted as an interface so we don't get
// a circular class definition.
//
export interface EphemerisDay {
  //  y: number; // year

  //  m: number; // month

  //  D: number; // day

  //  UTC: number; // utc offset

  //  Epoch: number; // epoch time stamp

  d: number; // ephemeris time

  ecl: number; // ecliptic

  lon_corr: number; // longitude correction
}

//
// Ephemeris, these are the values at a particular date
// one set of values for each planet, but some planets
// don't have all values.
//
export interface Ephemeris {
  N: number;
  i: number;
  w: number;
  a: number;
  e: number;
  M: number;
  d: number;
  mag: number;
  xg: number;
  yg: number;
  zg: number;
  xh: number;
  yh: number;
  zh: number;
  xv: number;
  yv: number;
  v: number;
  r: number;
  E: number;
  lonecl: number;
  latecl: number;
  xs: number;
  ys: number;
  xe: number;
  ye: number;
  ze: number;
  RA: number;
  Dec: number;
  loneclg: number;
  lateclg: number;
  rg: number;
  elong: number;
  FV: number;
  phase: number;
}

// An object that contains and Ephemeris for each planet,
// accessed by array reference to the planet's name.
export interface EphemerisDict {
  [index: string]: Ephemeris;
}

//
// orbital elements
// these are the functions that produce values for time
// there is one set for each planet
//
export interface Elements {
  N: (d: number) => number;
  i: (d: number) => number;
  w: (d: number) => number;
  a: (d: number) => number;
  a_units: string;
  e: (d: number) => number;
  M: (d: number) => number;
  d: (d: number) => number;
  mag: (r: number, R: number, FV: number, ring_magn: number) => number;
  position(edict: EphemerisDict, planet: string, eph: EphemerisDay): void;
  perturbation(edict: EphemerisDict, planet: string): void;
}

export interface ElementsDict {
  [index: string]: Elements;
}

/*
 ** the data computed for each month of the calendar
 **
 ** the timezone is only relevant for placing the midnight markers
 ** the rest can be UTC time relative to any epoch
 */
export interface DrawOptions {
  frame: boolean;
  moons: boolean;
  day_ticks: boolean;
  day_numbers: boolean;
  planets: boolean;
  orbital_gees: boolean;
  orbital_nodes: boolean;
  new_moon_dates: boolean;
  title: boolean;
  copyright: boolean;
}

export interface TaggedTime {
  tag: string;
  time: number;
}

export class MonthData {
  start: number; // start time stamp

  min_date: number; // time stamp of first new moon

  max_date: number; // time stamp of last new moon

  draw: DrawOptions; // draw options

  month: number = 0; // month index

  days: Array<TaggedTime> = []; // time stamps of days

  phases: Array<TaggedTime> = []; // time stamps of phases

  planets: Array<TaggedTime> = []; // time stamps of planetary conjunctions

  gees: Array<TaggedTime> = []; // time stamps of perigee and apogee

  nodes: Array<TaggedTime> = []; // time stamps of ascending and descending nodes

  zodiac: Array<TaggedTime> = []; // time stamps of zodic sign entries

  done: boolean = false; // has the data been computed

  constructor(_month: number, _start: number, _nphases: number) {
    this.month = _month;
    // initialize dummy day tick marks
    // initialize dummy moon positions: p0 .. p${_nphases}
    const dt = (29.5 * 24 * 60 * 60 * 1000) / _nphases;
    for (let p = 0; p <= _nphases; p += 1) {
      this.phases[p] = _start + p * dt;
    }
    // initialize dummy planet positions
    // initialize dummy gee positions
    // initialize dummy node positions
    // initialize dummy zodiac positions
    this.done = false;
  }

  nphases() {
    return this.phases.length;
  }

  start_date() {
    return this.phases[0];
  }

  end_date() {
    return this.phases[this.nphases - 1];
  }

  update(days, phases, planets, gees, nodes, zodiac, done) {
    this = { days, phases, planets, gees, nodes, zodiac, done };
  }
}

export interface MonthDataEvent {
  data: MonthData;
}
