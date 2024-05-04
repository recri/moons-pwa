/* eslint-disable camelcase */
/* eslint-disable no-nested-ternary */
/* eslint-disable no-unused-vars */
import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';

import { MonthData } from './moons-calendar-interfaces.js';

const sequence = (upto: number): Array<number> =>
  Array(Math.floor(upto))
    .fill(0)
    .map((ai, i) => i);

@customElement('moons-calendar')
export class MoonsCalendar extends LitElement {
  @property({ type: Object }) params: any = {};

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

    main {
      flex-grow: 1;
    }
  `;

  render() {
    const { year, month, day, months, phases, scale } = this.params;
    const start_date = new Date(`${year}-${month}-${day}`);
    const monthdata = sequence(months - 1).map(
      m =>
        new MonthData(
          m,
          start_date.getTime() + m * 29.5 * 24 * 60 * 60 * scale,
          phases
        )
    );
    return html`<moons-calendar-worker
      .params=${this.params}
      .monthdata=${monthdata}
    ></moons-calendar-worker>`;
  }
}
