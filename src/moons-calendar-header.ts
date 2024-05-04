/* eslint-disable camelcase */

import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';

import { text_node, format_date } from './moons-svg.js';
import { MonthData } from './moons-calendar-interfaces.js';

@customElement('moons-calendar-header')
export class MoonsCalendarHeader extends LitElement {
  @property({ type: Object }) params!: any;

  @property({ type: Array }) monthdata!: Array<MonthData>;

  @property({ type: Number }) width: number = 1000;

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
    const { phases, days, border, scale, draw } = this.params;
    if (!draw.title) return html``;
    const dwidth = border + days + border;
    const width = dwidth * scale;
    const dheight = 1;
    const height = dheight * scale;
    // compute the frame coordinates, centered
    // const fwidth = days*scale;
    const fheight = 1 * scale;
    // const fx = 0.5 * (width - fwidth);
    const fy = 0.5 * (height - fheight);
    const first_day = this.monthdata[0].phase[0];
    const last_day = this.monthdata[this.monthdata.length - 1].phase[phases];
    const generate_title = () =>
      text_node(
        width / 2,
        fy - scale / 2,
        'calendartitle',
        `${format_date(first_day)} - Moons - ${format_date(last_day)}`
      );

    return html`
      <style>
        svg.frame {
          position: absolute;
          top: 0px;
          left: 0px;
          height: var(--moons-month-height);
          width: var(--moons-month-width);
        }
      </style>

      <svg class="frame" viewbox="0 0 ${width} ${height}">
        ${generate_title()}
      </svg>
    `;
  }
}