/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
/* eslint-disable no-bitwise */
/* eslint-disable no-alert */
/* eslint-disable no-param-reassign */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ParamOptions, DrawOptions } from './moons-interfaces.js';

import './moons-menu.js';
import './moons-calendar.js';
import './moons-settings.js';
import './moons-about.js';

type TypeProto = {
  [key: string]: string;
};
type TypeValues = {
  search: string;
  planets: Array<string>;
  draw: DrawOptions;
  [key: string]: any;
};

const get_proto = (): TypeProto => ({
  // the params for specifying a calendar
  year: 'year', // year CE
  y: 'year',
  month: 'month', // month of year 1..12
  m: 'month',
  day: 'day',
  d: 'day',
  months: 'months', // number of months to draw
  n: 'months',
  phases: 'phases', // number of phases to draw, power of two
  p: 'phases',
  // these are pretty much fixed by the designer's taste
  days: 'days', // width of frame in days
  border: 'border', // border in days width == month height
  moon_per_cent: 'moon_per_cent', // per cent of month height for moon diameter
  scale: 'scale', // scale of SVG viewport
});

const get_defaults = (): ParamOptions => {
  const now = new Date(Date.now());
  return {
    year: now.getFullYear(), // today
    month: now.getMonth(),
    day: now.getDate(),
    months: 13, // one year
    phases: 8, // new, crescent, quarter, gibbous
    days: 40,
    border: 2.5,
    moon_per_cent: 80,
    scale: 1000,
  };
};

const get_params = (): ParamOptions => get_defaults();

const get_values = (): TypeValues => ({
  // search string
  search: '', // document search contents
  // constants
  planets: ['Mercury', 'Venus', 'Mars', 'Jupiter', 'Saturn'],
  // variations
  draw: {
    frame: true,
    moons: true,
    day_ticks: true,
    day_numbers: true,
    planets: true,
    orbital_gees: false,
    orbital_nodes: true,
    new_moon_dates: true,
    title: true,
    copyright: true,
    days: true,
    aries: false,
    zodiac: false,
  },
});

const parse_search = (search: URLSearchParams): ParamOptions => {
  const params = get_params();

  const proto = get_proto();
  for (const [name, value] of Object.entries(search)) {
    if (proto[name]) {
      if (proto[name] !== name) params[proto[name]] = Number(value);
      else params[name] = Number(value);
    } else {
      console.log(`unrecognized parameter: '${name}' with value '${value}'`);
    }
  }

  const defaults = get_defaults();
  if (defaults) {
    for (const i of Object.keys(defaults)) {
      if (typeof params[i] === 'undefined') {
        if (typeof defaults[i] === 'undefined') alert(`no default for ${i}?`);
        else params[i] = defaults[i];
      }
    }
  }

  while ((params.phases & (params.phases - 1)) !== 0) params.phases += 1;

  return params;
};

@customElement('moons-app')
export class MoonsApp extends LitElement {
  static styles = css`
    :host {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      margin: 0 auto;
      text-align: center;
    }
  `;

  render() {
    const path = window.location.pathname;
    const params = parse_search(new URLSearchParams(window.location.search));
    const { draw } = get_values();
    return html`
      <moons-menu></moons-menu>
      ${path === '/settings'
        ? html`<moons-settings .params=${params}></moons-settings>`
        : path === '/about'
        ? html`<moons-about></moons-about>`
        : html`<moons-calendar
            .params=${params}
            .draw${draw}
          ></moons-calendar>`}
    `;
  }
}
