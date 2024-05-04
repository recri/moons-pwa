/* eslint-disable camelcase */
/* eslint-disable class-methods-use-this */
/* eslint-disable no-console */

import { LitElement, html, css, svg } from 'lit';
import { property, customElement } from 'lit/decorators.js';

import { MonthData } from './moons-calendar-interfaces.js';

@customElement('moons-calendar-worker')
export class MoonsCalendarWorker extends LitElement {
  @property({ type: Object }) params!: any;

  @property({ type: Array }) monthdata!: Array<MonthData>;

  @property({ type: Number }) width: number = 1000;

  @property({ type: Number }) height: number = 1000;

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

  handleResize() {
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    // console.log(`handleResize ${this.width} x ${this.height}`);
  }

  resizeHandler = () => this.handleResize();

  /* eslint-disable wc/guard-super-call */
  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('resize', this.resizeHandler);
    this.handleResize();
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('resize', this.resizeHandler);
  }
  /* eslint-enable wc/guard-super-call */

  resolveSize(
    svgwidth: number,
    svgheight: number,
    moonheight: number
  ): Array<number> {
    const scale_by_width = this.width / svgwidth;
    const scale_by_height = this.height / svgheight;
    return scale_by_width < scale_by_height
      ? [
          svgwidth * scale_by_width,
          svgheight * scale_by_width,
          moonheight * scale_by_width,
        ]
      : [
          svgwidth * scale_by_height,
          svgheight * scale_by_height,
          moonheight * scale_by_height,
        ];
  }

  render() {
    const { months, days, border, scale } = this.params;
    const svgwidth = (border + days + border) * scale;
    const svgheight = (border + months + border) * scale;
    const [width, height, mheight] = this.resolveSize(
      svgwidth,
      svgheight,
      scale
    );
    if (!this.monthdata[0].done) this.startworker();
    return html`
	  <style>
	    div.frame {
	      position: absolute;
	      top: 0px;
	      left: 0px;
	      height: ${height}px;
	      width: ${width}px;
	      --moons-month-height: ${mheight}px;
	      --moons-month-width: ${width}px;
	    }
	  </style>
          <div class="frame">
              <moons-calendar-header .params=${this.params} .data=${
      this.monthdata
    }>
              </moons-calendar-header>
	    ${this.monthdata.map(
        md =>
          svg`<moons-calendar-month .params=${this.params} .data=${md}></moons-calendar-month>`
      )}
	    <moons-calendar-footer .params=${this.params} .data=${this.monthdata}>
	      </moons-calendar-footer>
	  </svg>
	`;
  }

  startworker() {
    console.log(`start worker`);
  }
}
