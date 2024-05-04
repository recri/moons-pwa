/* eslint-disable no-multi-assign */
/* eslint-disable camelcase */
/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable no-param-reassign */
/* eslint-disable no-use-before-define */

/*
 ** 2 arc minute ephemeris of sun, moon, and planets.
 ** Copyright (C) 1999,2006,2018 by Roger E Critchlow Jr,
 ** Santa Fe, New Mexico, USA,
 ** Charlestown, Massachusetts, USA,
 ** and Las Cruces, New Mexico, USA.
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
 ** The home page for this ephemeris is
 **	http://www.elf.org/moons/
 ** a copy of the GNU GPL may be found at
 **	http://www.gnu.org/copyleft/gpl.html,
 ** Formulae taken from
 **	http://hotel04.ausys.se/pausch/comp/ppcomp.html
 **  new url (2006-10-21) http://www.stjarnhimlen.se/comp/ppcomp.html
 **  still active 2018.07.03
 **  by Paul Schlyter, Stockholm, Sweden
 **	pausch@saaf.se or paul.schlyter@ausys.se
 **
 ** Dedicated to the memory of my uncle, Raphael Benitez.
 **
 */

// simplify calling math functions
import {
  EphemerisDay,
  Ephemeris,
  EphemerisDict,
  Elements,
  ElementsDict,
} from './ephemerides-interfaces.js';

const { abs } = Math;
const { floor } = Math;
const { ceil } = Math;
const { log } = Math;
const { LN10 } = Math;
const { PI } = Math;
const { sin, sinh } = Math;
const { asin } = Math;
const { cos, cosh } = Math;
const { acos } = Math;
const { tan, tanh } = Math;
const { atan } = Math;
const { atan2 } = Math;
const { sqrt } = Math;
// const {pow} = Math;

// additional math functions with simplified calling
//
// compute integer division, truncating toward zero.
// reduce to a positive angle
// convert degrees into radians and vice versa
// log base 10

const div = (a: number, b: number): number =>
  a > 0 === b > 0 ? floor(a / b) : ceil(a / b);
const posdegrees = (a: number): number => (a < 0 ? 360 + (a % 360) : a % 360);
const radians = (deg: number): number => deg * 0.0174532925199;
const degrees = (rad: number): number => rad * 57.2957795131;
const log10 = (a: number): number => log(a) / LN10;
const TWOPI = 2 * PI;

const initialEphemeris: Ephemeris = {
  N: 0,
  i: 0,
  w: 0,
  a: 0,
  e: 0,
  M: 0,
  d: 0,
  mag: 0,
  xg: 0,
  yg: 0,
  zg: 0,
  xh: 0,
  yh: 0,
  zh: 0,
  xv: 0,
  yv: 0,
  v: 0,
  r: 0,
  E: 0,
  lonecl: 0,
  latecl: 0,
  xs: 0,
  ys: 0,
  xe: 0,
  ye: 0,
  ze: 0,
  RA: 0,
  Dec: 0,
  loneclg: 0,
  lateclg: 0,
  rg: 0,
  elong: 0,
  FV: 0,
  phase: 0,
};

/*
 ** Several versions of eccentric anomaly.
 **
 ** eccentric anomaly by refinement according to someone.
 ** started failing to converge.
 */
const eccentricAnomaly1 = (M: number, e: number) => {
  /*
   ** iteratively refine the eccentric anomaly from a first estimate
   */
  function eccentricAnomaly(E0: number) {
    for (let i = 0; i < 500; i += 1) {
      const E1 =
        E0 -
        (E0 - degrees(e) * sin(radians(E0)) - M) / (1 - e * cos(radians(E0)));
      if (abs(E1 - E0) < 1e-5) return E1;
      E0 = E1;
    }
    throw new Error('eccentricAnomaly exceeded 500 iterations');
  }
  return eccentricAnomaly(
    M + degrees(e) * sin(radians(M)) * (1.0 + e * cos(radians(M)))
  );
};

/*
 ** eccentric anomaly by refinement according to wikipedia
 ** failed to converge.
 */
const eccentricAnomaly2 = (M: number, e: number, E0: number) => {
  /*
   ** iteratively refine the eccentric anomaly from a first estimate
   */
  function eccentricAnomaly(_E0: number) {
    let E = _E0;
    for (let i = 0; i < 500; i += 1) {
      const E1 = M + degrees(e) * sin(radians(E));
      if (abs(E1 - E) < 1e-5) return E1;
      E = E1;
    }
    throw new Error('eccentricAnomaly exceeded 500 iterations');
  }
  return eccentricAnomaly(M);
};

/*
 ** compute the eccentricAnomaly from libastro
 */
const eccentricAnomaly3 = (M: number, e: number) => {
  /*
   ** compute the eccentric anomaly, ea, and true anomaly, nu
   ** given the mean anomaly, ma, and the eccentricity, s.
   */
  function anomaly(ma: number, s: number) {
    const result = { ea: 0, nu: 0 };
    let m;
    let fea;
    let corr;
    const STOPERR = 1e-5;
    if (s < 1.0) {
      /* elliptical */
      let dla;

      m = ma - TWOPI * floor(ma / TWOPI);
      if (m > PI) m -= TWOPI;
      if (m < -PI) m += TWOPI;
      fea = m;

      for (;;) {
        dla = fea - s * sin(fea) - m;
        if (abs(dla) < STOPERR) break;
        /* avoid runnaway corrections for e>.97 and M near 0 */
        corr = 1 - s * cos(fea);
        if (corr < 0.1) corr = 0.1;
        dla /= corr;
        fea -= dla;
      }
      result.nu = 2 * atan(sqrt((1 + s) / (1 - s)) * tan(fea / 2));
    } else {
      /* hyperbolic */
      m = abs(ma);
      fea = m / (s - 1);
      const fea1 = ((6 * m) / (s * s)) ** (1 / 3);
      /* whichever is smaller is the better initial guess */
      if (fea1 < fea) fea = fea1;

      corr = 1;
      while (abs(corr) > STOPERR) {
        corr = (m - s * sinh(fea) + fea) / (s * cosh(fea) - 1);
        fea += corr;
      }
      if (ma < 0) fea = -fea;
      result.nu = 2 * atan(sqrt((s + 1) / (s - 1)) * tanh(fea / 2));
    }
    result.ea = fea;
    return result;
  }
  const result = anomaly(radians(M), e);
  return result.ea;
};

/*
 ** The eccentric anomaly according to the current low precision ephemeris.
 ** with E and M in degrees: E = M + e*(180/pi) * sin(M) * ( 1.0 + e * cos(M) )
 ** "Note that the formulae for computing E are not exact; however they're accurate enough here."
 */
const eccentricAnomaly4 = (M: number, e: number) =>
  M + degrees(e) * sin(radians(M)) * (1.0 + e * cos(radians(M)));

/*
 ** The eccentric anomaly according to one of the four options above.
 */
const eccentricAnomaly = eccentricAnomaly4;

//
// position function used to perform common computation
//
const generic_position = (
  edict: EphemerisDict,
  planet: string,
  eph: EphemerisDay
) => {
  // determine unperturbed position of the planet
  // this function serves for the moon and all the planets
  // other than Pluto
  // const E = eph[planet].E = eccentricAnomaly(M, e, M + degrees(e) * sin(radians(M)) * (1.0 + e * cos(radians(M))));
  const ep = edict[planet];
  const { M } = ep;
  const { e } = ep;
  const { a } = ep;
  const { N } = ep;
  const { w } = ep;
  const { i } = ep;
  const E = (ep.E = eccentricAnomaly(M, e));
  const xv = (ep.xv = a * (cos(radians(E)) - e));
  const yv = (ep.yv = a * (sqrt(1 - e * e) * sin(radians(E))));
  const v = (ep.v = degrees(atan2(yv, xv)));
  const r = (ep.r = sqrt(xv * xv + yv * yv));
  const xh = (ep.xh =
    r *
    (cos(radians(N)) * cos(radians(v + w)) -
      sin(radians(N)) * sin(radians(v + w)) * cos(radians(i))));
  const yh = (ep.yh =
    r *
    (sin(radians(N)) * cos(radians(v + w)) +
      cos(radians(N)) * sin(radians(v + w)) * cos(radians(i))));
  const zh = (ep.zh = r * (sin(radians(v + w)) * sin(radians(i))));
  ep.lonecl = posdegrees(degrees(atan2(yh, xh)) + eph.lon_corr);
  ep.latecl = degrees(atan2(zh, sqrt(xh * xh + yh * yh)));
  edict[planet] = ep;
};

// perturbation function used when there is no perturbation
const generic_perturbation = (edict: EphemerisDict, planet: string) => {
  const ep = edict[planet];
  edict[planet] = ep;
};

const elements: ElementsDict = {
  Sun: {
    N(d) {
      return 0.0;
    },
    i(d) {
      return 0.0;
    },
    w(d) {
      return 282.9404 + 4.70935e-5 * d;
    },
    a(d) {
      return 1.0;
    },
    a_units: 'AU',
    e(d) {
      return 0.016709 - 1.151e-9 * d;
    },
    M(d) {
      return 356.047 + 0.9856002585 * d;
    },
    position(edict, planet, eph) {
      // determine the position of the sun
      // these are largely simplifications of the general case
      // knowing that the sun defines the plane of the ecliptic
      // hence many terms are zero by definition.
      // also knowing that we will need some of the sun's data
      // to compute geocentric coordinates for other bodies, we
      // name some things differently
      const ep = edict.Sun;
      const { M } = ep;
      const { e } = ep;
      const { w } = ep;
      const E = (ep.E = eccentricAnomaly(M, e));
      const xv = (ep.xv = cos(radians(E)) - e);
      const yv = (ep.yv = sqrt(1 - e * e) * sin(radians(E)));
      const v = (ep.v = degrees(atan2(yv, xv)));
      const r = (ep.r = sqrt(xv * xv + yv * yv));
      const lonecl = (ep.lonecl = posdegrees(v + w + eph.lon_corr));
      const latecl = (ep.latecl = 0); // by definition
      const xs = (ep.xs = r * cos(radians(lonecl)));
      const ys = (ep.ys = r * sin(radians(lonecl)));
      const xe = (ep.xe = xs);
      const ye = (ep.ye = ys * cos(radians(eph.ecl)));
      const ze = (ep.ze = ys * sin(radians(eph.ecl)));
      ep.RA = posdegrees(degrees(atan2(ye, xe)));
      ep.Dec = degrees(atan2(ze, sqrt(xe * xe + ye * ye)));
      ep.d = elements.Sun.d(r);
      edict.Sun = ep;
    },
    perturbation: generic_perturbation,
    d(r) {
      return 1919.26 / r;
    },
    mag(r, R, FV) {
      return -27;
    },
  },
  Moon: {
    N(d) {
      return 125.1228 - 0.0529538083 * d;
    },
    i(d) {
      return 5.1454;
    },
    w(d) {
      return 318.0634 + 0.1643573223 * d;
    },
    a(d) {
      return 60.2666;
    },
    a_units: 'Earth radii',
    e(d) {
      return 0.0549;
    },
    M(d) {
      return 115.3654 + 13.0649929509 * d;
    },
    position: generic_position,
    perturbation(edict, planet) {
      const es = edict.Sun;
      const em = edict.Moon;
      const Ms = es.M; // Mean Anomaly of the Sun and the Moon
      const Mm = em.M;
      const Nm = em.N; // Longitude of the Moon's node
      const ws = es.w; // Argument of perihelion for the Sun and the Moon
      const wm = em.w;
      const Ls = Ms + ws; // Mean Longitude of the Sun  (Ns=0)
      const Lm = Mm + wm + Nm; // Mean longitude of the Moon
      const D = Lm - Ls; // Mean elongation of the Moon
      const F = Lm - Nm; // Argument of latitude for the Moon
      em.lonecl +=
        0 -
        1.274 * sin(radians(Mm - 2 * D)) +
        0.658 * sin(radians(2 * D)) -
        0.186 * sin(radians(Ms)) -
        0.059 * sin(radians(2 * Mm - 2 * D)) -
        0.057 * sin(radians(Mm - 2 * D + Ms)) +
        0.053 * sin(radians(Mm + 2 * D)) +
        0.046 * sin(radians(2 * D - Ms)) +
        0.041 * sin(radians(Mm - Ms)) -
        0.035 * sin(radians(D)) -
        0.031 * sin(radians(Mm + Ms)) -
        0.015 * sin(radians(2 * F - 2 * D)) +
        0.011 * sin(radians(Mm - 4 * D));
      em.latecl +=
        0 -
        0.173 * sin(radians(F - 2 * D)) -
        0.055 * sin(radians(Mm - F - 2 * D)) -
        0.046 * sin(radians(Mm + F - 2 * D)) +
        0.033 * sin(radians(F + 2 * D)) +
        0.017 * sin(radians(2 * Mm + F));
      em.r += 0 - 0.58 * cos(radians(Mm - 2 * D)) - 0.46 * cos(radians(2 * D));
      edict.Moon = em;
    },
    d(r) {
      return (1873.7 * 60) / r;
    },
    mag(r, R, FV) {
      return -13; // full moon
    },
  },

  Mercury: {
    N(d) {
      return 48.3313 + 3.24587e-5 * d;
    },
    i(d) {
      return 7.0047 + 5.0e-8 * d;
    },
    w(d) {
      return 29.1241 + 1.01444e-5 * d;
    },
    a(d) {
      return 0.387098;
    },
    a_units: 'AU',
    e(d) {
      return 0.205635 + 5.59e-10 * d;
    },
    M(d) {
      return 168.6562 + 4.0923344368 * d;
    },
    position: generic_position,
    perturbation: generic_perturbation,
    d(r) {
      return 6.74 / r;
    },
    mag(r, R, FV) {
      return -0.36 + 5 * log10(r * R) + 0.027 * FV + 2.2e-13 * FV ** 6;
    },
  },

  Venus: {
    N(d) {
      return 76.6799 + 2.4659e-5 * d;
    },
    i(d) {
      return 3.3946 + 2.75e-8 * d;
    },
    w(d) {
      return 54.891 + 1.38374e-5 * d;
    },
    a(d) {
      return 0.72333;
    },
    a_units: 'AU',
    e(d) {
      return 0.006773 - 1.302e-9 * d;
    },
    M(d) {
      return 48.0052 + 1.6021302244 * d;
    },
    position: generic_position,
    perturbation: generic_perturbation,
    d(r) {
      return 16.92 / r;
    },
    mag(r, R, FV) {
      return -4.34 + 5 * log10(r * R) + 0.013 * FV + 4.2e-7 * FV ** 3;
    },
  },

  Mars: {
    N(d) {
      return 49.5574 + 2.11081e-5 * d;
    },
    i(d) {
      return 1.8497 - 1.78e-8 * d;
    },
    w(d) {
      return 286.5016 + 2.92961e-5 * d;
    },
    a(d) {
      return 1.523688;
    },
    a_units: 'AU',
    e(d) {
      return 0.093405 + 2.516e-9 * d;
    },
    M(d) {
      return 18.6021 + 0.5240207766 * d;
    },
    position: generic_position,
    perturbation: generic_perturbation,
    d(r) {
      return 9.36 / r;
    } /*  polar 9.28 */,
    mag(r, R, FV) {
      return -1.51 + 5 * log10(r * R) + 0.016 * FV;
    },
  },

  Jupiter: {
    N(d) {
      return 100.4542 + 2.76854e-5 * d;
    },
    i(d) {
      return 1.303 - 1.557e-7 * d;
    },
    w(d) {
      return 273.8777 + 1.64505e-5 * d;
    },
    a(d) {
      return 5.20256;
    },
    a_units: 'AU',
    e(d) {
      return 0.048498 + 4.469e-9 * d;
    },
    M(d) {
      return 19.895 + 0.0830853001 * d;
    },
    position: generic_position,
    perturbation(edict, planet) {
      const Mj = edict.Jupiter.M; // Mean anomaly of Jupiter
      const Ms = edict.Saturn.M; // Mean anomaly of Saturn
      edict.Jupiter.lonecl +=
        0 -
        0.332 * sin(radians(2 * Mj - 5 * Ms - 67.6)) -
        0.056 * sin(radians(2 * Mj - 2 * Ms + 21)) +
        0.042 * sin(radians(3 * Mj - 5 * Ms + 21)) -
        0.036 * sin(radians(Mj - 2 * Ms)) +
        0.022 * cos(radians(Mj - Ms)) +
        0.023 * sin(radians(2 * Mj - 3 * Ms + 52)) -
        0.016 * sin(radians(Mj - 5 * Ms - 69));
    },
    d(r) {
      return 196.94 / r;
    } /* polar 185.08 - xephem has 196.74 for equatorial diameter */,
    mag(r, R, FV) {
      return -9.25 + 5 * log10(r * R) + 0.014 * FV;
    },
  },
  Saturn: {
    N: d => 113.6634 + 2.3898e-5 * d,
    i(d) {
      return 2.4886 - 1.081e-7 * d;
    },
    w(d) {
      return 339.3939 + 2.97661e-5 * d;
    },
    a(d) {
      return 9.55475;
    },
    a_units: 'AU',
    e(d) {
      return 0.055546 - 9.499e-9 * d;
    },
    M(d) {
      return 316.967 + 0.0334442282 * d;
    },
    position: generic_position,
    perturbation(edict, planet) {
      const Mj = edict.Jupiter.M; // Mean anomaly of Jupiter
      const Ms = edict.Saturn.M; // Mean anomaly of Saturn
      edict.Saturn.lonecl +=
        0 +
        0.812 * sin(radians(2 * Mj - 5 * Ms - 67.6)) -
        0.229 * cos(radians(2 * Mj - 4 * Ms - 2)) +
        0.119 * sin(radians(Mj - 2 * Ms - 3)) +
        0.046 * sin(radians(2 * Mj - 6 * Ms - 69)) +
        0.014 * sin(radians(Mj - 3 * Ms + 32));
      edict.Saturn.latecl +=
        0 -
        0.02 * cos(radians(2 * Mj - 4 * Ms - 2)) +
        0.018 * sin(radians(2 * Mj - 6 * Ms - 49));
    },
    d(r) {
      return 165.6 / r;
    } /* polar 150.8 */,
    mag(r, R, FV, ring_magn) {
      return -9.0 + 5 * log10(r * R) + 0.044 * FV + ring_magn;
    },
  },

  Uranus: {
    N: d => 74.0005 + 1.3978e-5 * d,
    i: d => 0.7733 + 1.9e-8 * d,
    w: d => 96.6612 + 3.0565e-5 * d,
    a: d => 19.18171 - 1.55e-8 * d,
    a_units: 'AU',
    e: d => 0.047318 + 7.45e-9 * d,
    M: d => 142.5905 + 0.011725806 * d,
    position: generic_position,
    perturbation: (edict, planet) => {
      const Mj = edict.Jupiter.M; // Mean anomaly of Jupiter
      const Ms = edict.Saturn.M; // Mean anomaly of Saturn
      const Mu = edict.Uranus.M; // Mean anomaly of Uranus
      edict.Uranus.lonecl +=
        0 +
        0.04 * sin(radians(Ms - 2 * Mu + 6)) +
        0.035 * sin(radians(Ms - 3 * Mu + 33)) -
        0.015 * sin(radians(Mj - Mu + 20));
    },
    d: r => 65.8 / r /* polar 62 */,
    mag: (r, R, FV) => -7.15 + 5 * log10(r * R) + 0.001 * FV,
  },

  Neptune: {
    N: d => 131.7806 + 3.0173e-5 * d,
    i: d => 1.77 - 2.55e-7 * d,
    w: d => 272.8461 - 6.027e-6 * d,
    a: d => 30.05826 + 3.313e-8 * d,
    a_units: 'AU',
    e: d => 0.008606 + 2.15e-9 * d,
    M: d => 260.2471 + 0.005995147 * d,
    position: generic_position,
    perturbation: generic_perturbation,
    d: r => 62.2 / r /* polar 60.9 */,
    mag: (r, R, FV) => -6.9 + 5 * log10(r * R) + 0.001 * FV,
  },

  Pluto: {
    // fill in normal elements not used for pluto
    N: d => 0,
    i: d => 0,
    w: d => 0,
    a: d => 0,
    a_units: 'AU',
    e: d => 0,
    M: d => 0,
    position: (edict, planet, eph) => {
      // determine pluto's position
      // this is a formula by curve fit to observed positions
      const S = 50.03 + 0.033459652 * eph.d;
      const P = 238.95 + 0.003968789 * eph.d;
      edict.Pluto.lonecl = posdegrees(
        238.9508 +
          0.00400703 * eph.d -
          19.799 * sin(radians(P)) +
          19.848 * cos(radians(P)) +
          0.897 * sin(radians(2 * P)) -
          4.956 * cos(radians(2 * P)) +
          0.61 * sin(radians(3 * P)) +
          1.211 * cos(radians(3 * P)) -
          0.341 * sin(radians(4 * P)) -
          0.19 * cos(radians(4 * P)) +
          0.128 * sin(radians(5 * P)) -
          0.034 * cos(radians(5 * P)) -
          0.038 * sin(radians(6 * P)) +
          0.031 * cos(radians(6 * P)) +
          0.02 * sin(radians(S - P)) -
          0.01 * cos(radians(S - P)) +
          eph.lon_corr
      );
      edict.Pluto.latecl =
        -3.9082 -
        5.453 * sin(radians(P)) -
        14.975 * cos(radians(P)) +
        3.527 * sin(radians(2 * P)) +
        1.673 * cos(radians(2 * P)) -
        1.051 * sin(radians(3 * P)) +
        0.328 * cos(radians(3 * P)) +
        0.179 * sin(radians(4 * P)) -
        0.292 * cos(radians(4 * P)) +
        0.019 * sin(radians(5 * P)) +
        0.1 * cos(radians(5 * P)) -
        0.031 * sin(radians(6 * P)) -
        0.026 * cos(radians(6 * P)) +
        0.011 * cos(radians(S - P));
      edict.Pluto.r =
        40.72 +
        6.68 * sin(radians(P)) +
        6.9 * cos(radians(P)) -
        1.18 * sin(radians(2 * P)) -
        0.03 * cos(radians(2 * P)) +
        0.15 * sin(radians(3 * P)) -
        0.14 * cos(radians(3 * P));
    },
    perturbation: generic_perturbation,
    d: r => 8.2 / r,
    mag: (r, R, FV) => 0,
  },
};

export class Ephemerides {
  y: number; // year

  m: number; // month

  D: number; // day

  UTC: number; // utc offset

  Epoch: number = 2000.0; // epoch time stamp

  d: number; // ephemeris time

  ecl: number; // ecliptic

  lon_corr: number; // longitude correction

  ephemeris: EphemerisDict = {};

  constructor(y: number, m: number, D: number, UTC: number, Epoch?: number) {
    this.y = y;
    this.m = m;
    this.D = D;
    this.UTC = UTC;
    if (Epoch) this.Epoch = Epoch;
    // should dispatch a web worker and return a promise
    // compute the date in ephemeris time
    this.d = Ephemerides.day(y, m, D, UTC);

    // compute the obliquity of the ecliptic
    this.ecl = Ephemerides.obliquity(this.d);

    // compute the ecliptic of the epoch correction
    this.lon_corr = Epoch ? Ephemerides.longitudeEcliptic(this.d, Epoch) : 0;

    // compute the mean orbital elements
    for (const planet of Object.keys(Ephemerides.Planets)) {
      this.ephemeris[planet] = initialEphemeris;
      if (planet !== 'Pluto') {
        this.ephemeris[planet].N = posdegrees(elements[planet].N(this.d));
        this.ephemeris[planet].i = elements[planet].i(this.d);
        this.ephemeris[planet].w = posdegrees(elements[planet].w(this.d));
        this.ephemeris[planet].a = elements[planet].a(this.d);
        this.ephemeris[planet].e = elements[planet].e(this.d);
        this.ephemeris[planet].M = posdegrees(elements[planet].M(this.d));
      }
    }

    // determine the positions of the planets
    for (const planet of Object.keys(Ephemerides.Planets)) {
      // compute ecliptic longitude and latitude
      elements[planet].position(this.ephemeris, planet, this);
      // perturbation terms in ecliptic longitude and latitude
      elements[planet].perturbation(this.ephemeris, planet);

      if (planet !== 'Sun') {
        // geocentric ecliptic coordinates
        const { r } = this.ephemeris[planet];
        const { lonecl } = this.ephemeris[planet];
        const { latecl } = this.ephemeris[planet];
        const xh = (this.ephemeris[planet].xh =
          r * cos(radians(lonecl)) * cos(radians(latecl)));
        const yh = (this.ephemeris[planet].yh =
          r * sin(radians(lonecl)) * cos(radians(latecl)));
        const zh = (this.ephemeris[planet].zh = r * sin(radians(latecl)));
        if (planet === 'Moon') {
          this.ephemeris[planet].xg = xh;
          this.ephemeris[planet].yg = yh;
          this.ephemeris[planet].zg = zh;
        } else {
          this.ephemeris[planet].xg = xh + this.ephemeris.Sun.xs;
          this.ephemeris[planet].yg = yh + this.ephemeris.Sun.ys;
          this.ephemeris[planet].zg = zh;
        }
        const { xg } = this.ephemeris[planet];
        const { yg } = this.ephemeris[planet];
        const { zg } = this.ephemeris[planet];
        // compute geocentric lonecl and latecl
        this.ephemeris[planet].loneclg = posdegrees(
          degrees(atan2(yg, xg)) + this.lon_corr
        );
        this.ephemeris[planet].lateclg = degrees(
          atan2(zg, sqrt(xg * xg + yg * yg))
        );
        // geocentric equatorial coordinates
        const xe = (this.ephemeris[planet].xe = xg);
        const ye = (this.ephemeris[planet].ye =
          yg * cos(radians(this.ecl)) - zg * sin(radians(this.ecl)));
        const ze = (this.ephemeris[planet].ze =
          yg * sin(radians(this.ecl)) + zg * cos(radians(this.ecl)));
        this.ephemeris[planet].RA = posdegrees(degrees(atan2(ye, xe)));
        this.ephemeris[planet].Dec = degrees(
          atan2(ze, sqrt(xe * xe + ye * ye))
        );
        const rg = (this.ephemeris[planet].rg = sqrt(
          xg * xg + yg * yg + zg * zg
        ));

        // Moon's topocentric coordinates
        if (planet === 'Moon') {
        }

        // Apparent diameter
        this.ephemeris[planet].d = elements[planet].d(r);

        // elongation and phase
        let FV;
        if (planet !== 'Moon') {
          const s = this.ephemeris.Sun.r;
          const R = rg;
          this.ephemeris[planet].elong = degrees(
            acos((s * s + R * R - r * r) / (2 * s * R))
          );
          if (
            lonecl > this.ephemeris.Sun.lonecl + 180 ||
            (lonecl > this.ephemeris.Sun.lonecl - 180 &&
              lonecl < this.ephemeris.Sun.lonecl)
          )
            this.ephemeris[planet].elong *= -1;
          FV = this.ephemeris[planet].FV = degrees(
            acos((r * r + R * R - s * s) / (2 * r * R))
          );
          if (planet === 'Saturn') {
            const los = lonecl;
            const las = latecl;
            const ir = 28.06;
            const Nr = 169.51 + 3.82e-5 * this.d;
            const B = asin(
              sin(radians(las)) * cos(radians(ir)) -
                cos(radians(las)) * sin(radians(ir)) * sin(radians(los - Nr))
            );
            const ring_magn = -2.6 * sin(abs(B)) + 1.2 * sin(B) ** 2;
            this.ephemeris[planet].mag = elements[planet].mag(
              r,
              R,
              FV,
              ring_magn
            );
          } else if (planet !== 'Pluto') {
            this.ephemeris[planet].mag = elements[planet].mag(r, R, FV, 0);
          }
        } else {
          const mlon = lonecl;
          const mlat = latecl;
          const slon = this.ephemeris.Sun.lonecl;
          let elong = (this.ephemeris[planet].elong = degrees(
            acos(cos(radians(slon - mlon)) * cos(radians(mlat)))
          ));
          if (mlon > slon + 180 || (mlon > slon - 180 && mlon < slon))
            elong = this.ephemeris[planet].elong *= -1;
          FV = this.ephemeris[planet].FV = 180 - elong;
        }
        this.ephemeris[planet].phase = (1 + cos(radians(FV))) / 2;
      }
    }
  }

  /*
   ** compute the julian date epoch 2000
   */
  static day = (y: number, m: number, D: number, UT: number) =>
    // Day 0.0 is 2000 Jan 0 0h0 or 1999 December 31 0h00
    // y = year common era
    // m = month, january = 1
    // D = day, 1st = 1
    // UT = time UTC in hours.fraction
    // using integer division where integer constants are shown
    // return (367*y - 7 * ( y + (m+9)/12 ) / 4 + 275*m/9 + D - 730530) + UT / 24.0
    367 * y -
    div(7 * (y + div(m + 9, 12)), 4) +
    div(275 * m, 9) +
    D -
    730530 +
    UT / 24.0;

  /*
   ** obliquity of the ecliptic
   */
  static obliquity = (d: number) => 23.4393 - 3.563e-7 * d;

  /*
   ** correction to be applied to ecliptic longitude, lonecl, to obtain
   ** equatorial coordinates for specified epoch.
   */
  static longitudeEcliptic = (d: number, Epoch: number) =>
    3.82394e-5 * (365.2422 * (Epoch - 2000.0) - d);

  /*
   ** orbital elements of the planets
   **
   **    N = longitude of the ascending node
   **    i = inclination to the ecliptic (plane of the Earth's orbit)
   **    w = argument of perihelion
   **    a = semi-major axis, or mean distance from Sun
   **    e = eccentricity (0=circle, 0-1=ellipse, 1=parabola)
   **    M = mean anomaly (0 at perihelion; increases uniformly with time)
   **
   ** other orbital elements
   **    w1 = N + w   = longitude of perihelion
   **    L  = M + w1  = mean longitude
   **    q  = a*(1-e) = perihelion distance
   **    Q  = a*(1+e) = aphelion distance
   **    P  = a ^ 1.5 = orbital period (years if a is in AU, astronomical units)
   **    T  = Epoch_of_M - (M(deg)/360_deg) / P  = time of perihelion
   **    v  = true anomaly (angle between position and perihelion)
   **    E  = eccentric anomaly
   */
  static Elements = {
    N: 'longitude of the ascending node',
    i: "inclination to the ecliptic (plane of the Earth's orbit)",
    w: 'argument of perihelion',
    a: 'semi-major axis, or mean distance from Sun',
    e: 'eccentricity (0=circle, 0-1=ellipse, 1=parabola)',
    M: 'mean anomaly (0 at perihelion; increases uniformly with time)',
  };

  static OtherProperties = {
    d: 'Apparent diameter',
    mag: 'Visual magnitude',
  };

  static Planets = {
    Sun: true,
    Moon: true,
    Mercury: true,
    Venus: true,
    Mars: true,
    Jupiter: true,
    Saturn: true,
    Uranus: true,
    Neptune: true,
    Pluto: true,
  };
}
