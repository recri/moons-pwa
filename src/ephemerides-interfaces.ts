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
