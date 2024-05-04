/* eslint-disable camelcase */

import { svg } from 'lit';
import { SVGTemplateResult } from 'lit-html';

export const draw_nil = (): SVGTemplateResult => svg``;
export const line_node_vertical = (
  x: number,
  y1: number,
  y2: number
): SVGTemplateResult =>
  svg`<line x1$="${x}" y1$="${y1}" x2$="${x}" y2$="${y2}" />`;
const triangle_node = (
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  x3: number,
  y3: number,
  className: string
): SVGTemplateResult =>
  svg`<path d$="M${x1},${y1}L${x2},${y2} ${x3},${y3}Z" class$="${className}" />`;
export const text_node = (
  x: number,
  y: number,
  className: string,
  text: string
): SVGTemplateResult =>
  svg`<text x$="${x}" y$="${y}" class$="${className}">${text}</text>`;
export const top_tick_node = (
  x: number,
  h: number,
  className: string
): SVGTemplateResult =>
  triangle_node(x, 0.1 * h, x, 0, x - 0.1 * h, 0, className);
export const btm_tick_node = (
  x: number,
  h: number,
  className: string
): SVGTemplateResult =>
  triangle_node(x, 0.9 * h, x, h, x - 0.1 * h, h, className);
export const top_text_node = (
  x: number,
  h: number,
  className: string,
  text: string
): SVGTemplateResult => text_node(x - 100, 250, className, text);
export const btm_text_node = (
  x: number,
  h: number,
  className: string,
  text: string
): SVGTemplateResult => text_node(x - 100, h - 100, className, text);

// returns a string formatted date
export const format_date = (_d: number): string => {
  const d = new Date(_d);
  return `${d.getUTCFullYear()}.${1 + d.getUTCMonth()}.${d.getUTCDate()}`;
};

//
// generate the <path> for a polygon that represents
// a moon with elongation from the sun: phase; centered
// at: 0, 0; with radius: r; and using n points.
//
export const phase_path_points = (
  phase: number,
  r: number,
  n: number
): string => {
  let xy = '';
  const cosphase = Math.cos(((180 - phase) * 2 * 3.14159) / 360);
  let cmd = 'M';
  for (let i = 0; i < n; i += 1) {
    const radians = (2 * 3.14159 * (i % n)) / n;
    let x = r * Math.sin(radians);
    const y = -r * Math.cos(radians);
    if (
      phase !== 0 &&
      ((phase < 180 && i > n / 2) || (phase > 180 && i < n / 2))
    )
      x *= cosphase;
    xy += `${cmd}${Math.round(x)},${Math.round(y)}`;
    cmd = 'L';
  }
  xy += 'Z';
  return xy;
};
// import {draw_nil, line_node_vertical, triangle_node, text_node, top_tick_node, btm_tick_node, top_text_node, btm_text_node, format_date, phase_path_points} from './moons-svg.js';
