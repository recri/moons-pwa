/*
 ** the data computed for each month of the calendar
 **
 ** the timezone is only relevant for placing the midnight markers
 ** the rest can be UTC time relative to any epoch
 */
export interface ParamOptions {
  year: number;
  month: number;
  day: number;
  months: number;
  phases: number;
  days: number;
  border: number;
  moon_per_cent: number;
  scale: number;
  [key: string]: number;
}

export interface DrawOptions {
  frame: boolean;
  moons: boolean;
  day_ticks: boolean;
  day_numbers: boolean;
  planets: boolean;
  orbital_gees: boolean;
  orbital_nodes: boolean;
  new_moon_dates: boolean;
  title: boolean;
  copyright: boolean;
  days: boolean;
  aries: boolean;
  zodiac: boolean;
  [key: string]: boolean;
}

export interface TaggedTime {
  tag: string;
  time: number;
}

export class MonthData {
  start!: number; // start time stamp

  draw!: DrawOptions; // draw options

  start0!: number; // time stamp of new moon near start

  min_date!: TaggedTime; // tagged time stamp of first new moon

  max_date!: TaggedTime; // tagged time stamp of last new moon

  month: number = 0; // month index

  days: Array<TaggedTime> = []; // time stamps of days

  phases: Array<TaggedTime> = []; // time stamps of phases

  planets: Array<TaggedTime> = []; // time stamps of planetary conjunctions

  gees: Array<TaggedTime> = []; // time stamps of perigee and apogee

  nodes: Array<TaggedTime> = []; // time stamps of ascending and descending nodes

  zodiac: Array<TaggedTime> = []; // time stamps of zodic sign entries

  done: boolean = false; // has the data been computed

  constructor(_month: number, _start: number, _nphases: number) {
    this.month = _month;
    this.start = _start;
    // initialize dummy day tick marks
    // initialize dummy moon positions: p0 .. p${_nphases}
    const dt = (29.5 * 24 * 60 * 60 * 1000) / _nphases;
    for (let p = 0; p <= _nphases; p += 1) {
      this.phases[p] = { tag: `${p}/${_nphases}`, time: _start + p * dt };
    }
    // this.min_date = this.phases[0];
    [this.min_date] = this.phases;
    // this.max_date = this.phases[_nphases]
    [, this.max_date] = this.phases;
    // initialize dummy planet positions
    // initialize dummy gee positions
    // initialize dummy node positions
    // initialize dummy zodiac positions
    this.done = false;
  }

  nphases() {
    return this.phases.length - 1;
  }

  start_date() {
    return this.phases[0];
  }

  end_date() {
    return this.phases[this.nphases() - 1];
  }
}

export interface MonthDataEvent {
  data: MonthData;
}
