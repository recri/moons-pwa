/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css } from 'lit';
import { property, state, customElement } from 'lit/decorators.js';

import { menuIcon } from './app-icons.js';

@customElement('moons-menu')
export class MoonsMenu extends LitElement {
  @state() private _shown: boolean = false;

  static styles = css`
    :host {
      display: inline-block;
      font-size: calc(10px + 2vmin);
      margin: 0 auto;
      text-align: center;
      z-index: 1;
      background-color: var(--moons-background-color);
      color: var(--moons-color);
    }

    div.menu {
      flex-grow: 1;
      position: absolute;
      top: 24px;
      left: 24px;
      background-color: var(--moons-background-color);
      color: var(--moons-color);
    }

    button {
      display: block;      
      margin: none;
      border: none;
      background-color: var(--moons-background-color);
      color: var(--moons-color);
    }

    svg { 
      height: 24px;
      width=24px;
      stroke: var(--moons-stroke);
      fill: var(--moons-fill);
      background-color: var(--moons-background-color);
      color: var(--moons-color);
    }
  `;

  toggleShown() {
    this._shown = !this._shown;
  }

  linkTo(path: string) {
    this.toggleShown();
    window.location.assign(
      `${window.location.protocol}//${window.location.host}${path}`
    );
  }

  linkMoons() {
    this.linkTo('/moons');
  }

  linkSettings() {
    this.linkTo('/settings');
  }

  linkAbout() {
    this.linkTo('/about');
  }

  render() {
    return html`
      <style>
        div.menubody {
          display: ${this._shown ? 'block' : 'none'};
        }
      </style>
      <div class="menu">
        <button class="menubutton" @click=${this.toggleShown}>
          ${menuIcon}
        </button>
        <div class="menubody">
          <button class="menuitem" @click=${this.linkMoons}>Moons</button>
          <button class="menuitem" @click=${this.linkSettings}>Settings</button>
          <button class="menuitem" @click=${this.linkAbout}>About</button>
        </div>
      </div>
    `;
  }
}
