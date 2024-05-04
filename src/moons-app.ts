/* eslint-disable no-nested-ternary */
/* eslint-disable camelcase */
/* eslint-disable no-bitwise */
/* eslint-disable no-alert */
/* eslint-disable no-param-reassign */

import { LitElement, html, css } from 'lit';
import { customElement } from 'lit/decorators.js';

import './moons-menu.js';
import './moons-calendar.js';
import './moons-settings.js';
import './moons-about.js';

const search_params = () => {
  const now = Date.now();
  const dateNow = new Date(now);
  const year = dateNow.getFullYear();
  const month = dateNow.getMonth();
  const day = dateNow.getDate();
  return {
    // the names allowed in the search string and their canonical form
    proto: {
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
    },
    // the default values
    defaults: {
      year, // today
      month,
      day,
      months: 13, // one year
      phases: 8, // new, crescent, quarter, gibbous
      days: 40,
      border: 2.5,
      moon_per_cent: 80,
    },
    // how to validate values
    validations: {
      start: (x: string) => new Date(x),
      months: (x: string) => Number(x) > 0,
      phases: (x: string) => (Number(x) & (Number(x) - 1)) === 0, // power of two
      days: (x: string) => Number(x) > 30,
      border: (x: string) => Number(x) >= 0,
      moon_per_cent: (x: string) => Number(x) > 0 && Number(x) <= 100,
    },
    params: {
      // the default values merged with values from search string
    },
    // the other values needed
    values: {
      // scale of the svg images
      scale: 1000,
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
    },
  };
};

const parse_search = (
  search: URLSearchParams,
  { proto, defaults, params, validations }
) => {
  //
  // merge default values into the params arrays
  //
  const merge_defaults = () => {
    if (defaults) {
      for (const i of Object.keys(defaults)) {
        if (typeof params[i] === 'undefined') {
          if (typeof defaults[i] === 'undefined') alert(`no default for ${i}?`);
          else params[i] = defaults[i];
        }
      }
    }
  };
  //
  // validate values in params
  //
  const validate_values = () => {
    if (validations) {
      for (const i of Object.keys(params)) {
        if (typeof params[i] === 'undefined') alert(`no param for ${i}?`);
        else if (typeof validations[i] === 'undefined')
          alert(`no validation function for ${i}?`);
        else params[i] = validations[i](params[i]);
      }
    }
  };

  for (const [name, value] of Object.entries(search)) {
    if (proto[name]) {
      if (proto[name] !== name) params[proto[name]] = search[name];
      else params[name] = search[name];
    } else {
      console.log(`unrecognized parameter: '${name}' with value '${value}'`);
    }
  }

  merge_defaults();
  validate_values();

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
    const params = parse_search(
      new URLSearchParams(window.location.search),
      search_params()
    );
    return html`
      <moons-menu></moons-menu>
      ${path === '/settings'
        ? html`<moons-settings .params=${params}></moons-settings>`
        : path === '/about'
        ? html`<moons-about></moons-about>`
        : html`<moons-calendar .params=${params}></moons-calendar>`}
    `;
  }
}
