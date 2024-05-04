/* eslint-disable @typescript-eslint/no-unused-vars */
import { LitElement, html, css } from 'lit';
import { property, customElement } from 'lit/decorators.js';

@customElement('moons-about')
export class MoonsAbout extends LitElement {
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
        <h2>About</h2>
        <p>
          This app draws a moon calendar. There is one month per row with time
          increasing from right to left and from top down. The moon phases,
          planetary conjunctions, and other waypoints of the month are drawn at
          the time they occur in the browsers timezone.
        </p>
        <p>
          The original implementation of this calendar was produced in 1975 and
          hand drawn on brown wrapping paper.
        </p>
        <p>
          The second version was produced on a drum plotter driven by an IBM
          1130 running a FORTRAN ephemeris coded on punched cards in the Reed
          College computer center. The ephemeris was taken from the Explanatory
          Supplement to the American Ephemeris and Nautical Almanac.
        </p>
        <p>
          These showed the new, full, and quarter moons. The quarter moons were
          drawn backwards, as was only noticed and reported by Joan's father --
          the illuminated limb, the circular, lit edge of the moon, is always
          closer to the sun than the dark limb.
        </p>
        <p>
          The third version of the calendar was printed in the college printshop
          in black on grey, hand colored with white pencil, and sold in the Reed
          College student cafeteria. I believe I made enough to cover the
          printing cost.
        </p>
        <p>
          The fourth version was produced around 1999 with an ephemeris coded in
          C and loaded into Tcl/Tk as an extension. It was used to produce
          images for cafepress.com to print on posters, cards, tee-shirts, and
          coffee mugs.
        </p>
        <p>
          The fifth version converted the ephemeris into javascript and the
          calendar graphics into SVG to make a web page, https://elf.org/moons
          which lists a copyright of 2006 and 2009.
        </p>
        <p>
          The sixth version, which is live on the web as I write this, lists a
          copyright of 2018. It repackages the javascript and SVG into a
          progressive web application (PWA) following the guidance of Google's
          Polymer Project. Its source can be found at
          https://github.com/recri/moons.
        </p>
        <p>
          This, the seventh version, rewrites the app according to the guidance
          of the Open Web Components (https://open-wc.org/). Its source can be
          found at https://github.com/recri/moons-app.
        </p>
        <p>
          All the computations for the calendar are performed in your browser in
          javascript. The graphical depiction of the calendar is done with
          structured vector graphics (SVG).
        </p>
        <p>
          The <a href="js/ephemerides.js">ephemeris</a> is taken from Paul
          Schlyter's
          <a href="http://www.stjarnhimlen.se/comp/ppcomp.html">
            low precision ephemeris</a
          >, where you should go for a more detailed explanation. This
          computation is good to 1-2 arc minutes accuracy, and that accuracy is
          good for some period of years around 2000.
        </p>
        <p>
          This code is copyright &copy; 1975-2024 by Roger E Critchlow Jr, Las
          Cruces, New Mexico, USA.
        </p>
        <p>
          This program is free software; you can redistribute it and/or modify
          it under the terms of the GNU General Public License as published by
          the Free Software Foundation; either version 2 of the License, or (at
          your option) any later version.
        </p>
        <p>
          This program is distributed in the hope that it will be useful, but
          <strong>WITHOUT ANY WARRANTY</strong>; without even the implied
          warranty of <strong>MERCHANTABILITY</strong> or
          <strong>FITNESS FOR A PARTICULAR PURPOSE</strong>. See the GNU General
          Public License for more details.
        </p>
        <p>
          A copy of the GNU General Public License may be found at:
          <a href="http://www.gnu.org/copyleft/gpl.html">gnu.org</a>.
        </p>
        <p>
          The Moons Calendar is Copyright &#169; 1975, 1999, 2018, and 2024 by
          Roger E Critchlow Jr, Las Cruces, New Mexico, USA. All rights
          reserved. Permission granted for reproduction for personal or
          educational use.
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
