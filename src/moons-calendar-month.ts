/* eslint-disable camelcase */
import { LitElement, html, css, svg } from 'lit';
import { property, customElement } from 'lit/decorators.js';
import { SVGTemplateResult } from 'lit-html';

import {
  draw_nil,
  line_node_vertical,
  text_node,
  top_tick_node,
  btm_tick_node,
  top_text_node,
  btm_text_node,
  format_date,
  phase_path_points,
} from './moons-svg.js';

import { MonthData } from './moons-calendar-interfaces.js';

@customElement('moons-calendar-month')
export class MoonsCalendarMonth extends LitElement {
  @property({ type: Object }) params!: any;

  @property({ type: Object }) monthdata!: MonthData;

  static styles = css`
    :host {
    }
  `;

  render() {
    const millis_per_day = 24 * 60 * 60 * 1000; // milliseconds in a day
    const { phases, days, border, moon_per_cent, scale, draw } = this.params;
    const dwidth = border + days + border;
    const width = dwidth * scale;
    const dheight = 1;
    const height = dheight * scale;
    // compute the frame coordinates, centered
    // const fwidth = days*scale;
    const fheight = 1 * scale;
    // const fx = 0.5 * (width - fwidth);
    const fy = 0.5 * (height - fheight);
    // moon phases
    const pfull = phases / 2;
    const pnew0 = 0;
    const pnew1 = phases;
    // const first_day = this.monthdata.phase[pnew0];
    // const middle_day = this.monthdata.phase[pfull];
    // const last_day = this.monthdata.phase[pnew1];

    const generate_month = monthdata => {
      // const mnew0 = monthdata.phases[pnew0], mfull = monthdata.phases[pfull], mnew1 = month.m_date[pnew1];
      const tnew0 = monthdata.phases[pnew0];
      const tfull = monthdata.phases[pfull];
      const tnew1 = monthdata.phases[pnew1];
      // const tnew0 = mnew0.getTime(), tfull = mfull.getTime(), tnew1 = mnew1.getTime();
      const x_for_time = t =>
        Math.round(
          width / 2 + // the x coordinate of the full moon
            ((tfull - // the time of the full moon
              t) / // minus the time of interest
              millis_per_day) * // convert to day.fraction_of_day
              scale // times the width of the day
        );
      const draw_frame = () => {
        const x1 = x_for_time(
          millis_per_day * Math.floor(1 + tnew1 / millis_per_day)
        );
        const x2 = x_for_time(
          millis_per_day * Math.floor(tnew0 / millis_per_day)
        );
        return svg`<rect class="frame" x$=${x1} y=0 width$=${x2 - x1} height$=${
          scale - 1
        } />`;
      };
      const draw_moons = () => {
        const cy = scale / 2;
        const r = ((moon_per_cent / 100.0) * scale) / 2;
        return monthdata.phases.map((date, i) => {
          const phase = (i * (360 / phases)) % 360;
          const cx = x_for_time(date.getTime());
          const d = phase_path_points(phase, r, 36);
          const className = `moon${phase === 0 ? ' new' : ''}`;
          return svg`<path class$="${className}" transform$="translate(${cx},${cy})" d$="${d}" />`;
        });
      };

      const draw_day_ticks_and_numbers = () => {
        const day_vertical_line = (x, h) => line_node_vertical(x, 0, h);
        const day_tick_node = (x, h) => btm_tick_node(x, h, 'daytick');
        const day_number_node = (x, h, d) =>
          btm_text_node(x, h, 'daynumber', `${d}`);
        // const f_t = tfull / millis_per_day;                   // fractional date of full moon
        const n1_d = Math.floor(tnew0 / millis_per_day); // day of 1st new moon
        const n2_d = Math.floor(tnew1 / millis_per_day); // day of 2nd new moon
        const day_markers = [];
        for (let d = n1_d; d <= n2_d + 1; d += 1) {
          const t = d * millis_per_day;
          const x = x_for_time(t);
          const h = scale;
          const day = new Date(t).getUTCDate(); // day of month, UTC
          if (draw.day_ticks) day_markers.push(day_tick_node(x, h));
          if (draw.day_numbers && d !== n2_d + 1)
            day_markers.push(day_number_node(x, h, day));
          if (d === n1_d || d === n2_d + 1)
            day_markers.push(day_vertical_line(x, h));
        }
        return svg`${day_markers}`;
      };

      const draw_new_moon_dates = () => {
        const new_moon_date = (x, y, w, h, fill, date, className) =>
          text_node(x, y, `newmoondate ${className}`, format_date(date));
        const new_moon_date_left = (x, y, w, h, fill, date) =>
          new_moon_date(x - 4, y - h / 3, w, h, fill, date, 'left');
        const new_moon_date_right = (x, y, w, h, fill, date) =>
          new_moon_date(x + 4, y - h / 3, w, h, fill, date, 'right');
        const w = scale;
        const x0 = x_for_time(tnew0 - millis_per_day);
        const x1 = x_for_time(tnew1 + millis_per_day);
        return svg`
		    ${new_moon_date_right(x0, w, w, w, 'white', new Date(tnew0))}
		    ${new_moon_date_left(x1, w, w, w, 'white', new Date(tnew1))}
                  `;
      };
      const draw_planets = () => {
        const planet_map = {
          Mercury: '☿',
          Venus: '♀',
          Mars: '♂',
          Jupiter: '♃',
          Saturn: '♄',
          Uranus: '⛢',
          Neptune: '♆',
          Pluto: '♇',
        };
        const planet_markers = [];
        monthdata.planets.forEach((t, planet) => {
          const x = x_for_time(t);
          planet_markers.push(
            top_text_node(x, scale, `planet ${planet}`, planet_map[planet]),
            top_tick_node(x, scale, 'planettick')
          );
        });
        return svg`${planet_markers}`;
      };
      const draw_gees = () => draw_nil();
      const draw_nodes = (): Array<SVGTemplateResult> => {
        const node_map = {
          ascending: '☊',
          descending: '☋',
          conjunction: '☌',
          opposition: '☍',
        };
        const node_markers: Array<SVGTemplateResult> = [];
        monthdata.nodes.forEach((t, node) => {
          const x = x_for_time(t);
          console.log(
            `drawing ${node} time ${t} node ${node_map[node]} at ${x}`
          );
          node_markers.push(top_text_node(x, scale, 'node', node_map[node]));
          node_markers.push(top_tick_node(x, scale, 'nodetick'));
        });
        return svg`${node_markers!}`;
      };
      const draw_zodiac = () => draw_nil();
      const draw_mondays = () => draw_nil();
      const index = monthdata.month;
      return svg`
	      <g id$=m${index} transform$=translate(0,${
        fy + index * scale
      }) width$=${width} height$=${scale}px>
              <title>this is moonth ${index}</title>
              ${draw.frame ? draw_frame() : draw_nil()}
              ${draw.moons ? draw_moons() : draw_nil()}
              ${
                draw.day_ticks || draw.day_numbers
                  ? draw_day_ticks_and_numbers()
                  : draw_nil()
              }
              ${draw.new_moon_dates ? draw_new_moon_dates() : draw_nil()}
              ${draw.planets ? draw_planets() : draw_nil()}
              ${draw.orbital_gees ? draw_gees() : draw_nil()}
              ${draw.orbital_nodes ? draw_nodes() : draw_nil()} 
              ${draw.aries || draw.zodiac ? draw_zodiac() : draw_nil()}
              ${draw.mondays ? draw_mondays() : draw_nil()}
              </g>`;
    };
    return html` <style>
        svg.frame {
          position: absolute;
          top: 0px;
          left: 0px;
          height: var(--moons-month-height);
          width: var(--moons-month-width);
        }
      </style>
      <svg class="frame" viewbox="0 0 ${width} ${height}">
        ${generate_month(this.monthdata)}
      </svg>`;
  }
}
