/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';

@customElement('moons-settings')
export class MoonsSettings extends LitElement {
  static styles = css`
    :host {
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: flex-start;
      max-width: 80vw;
      margin: 0 auto;
      text-align: center;
    }

    main {
      flex-grow: 1;
    }
  `;

  render() {
    return html`
      <main>
        <h2>Settings</h2>
        <p>
          This app draws a moon calendar one month per row, days increasing from
          right to left, months increasing from top to bottom, the moon phases
          are drawn for each month at the time they occur in Boston.
        </p>
        <p>
          <i
            >Moon &amp; sun are passing figures of countless generations, and
            years coming or going wanderers too. Drifting life away on a boat or
            meeting age leading a horse by the mouth, each day is a journey and
            the journey itself home.</i
          >
        </p>
        <p>
          <small
            >Basho, <i>Back Roads To Far Towns</i>, translated by Cid Corman and
            Kamaike Susumu.</small
          >
        </p>
      </main>
    `;
  }
}
