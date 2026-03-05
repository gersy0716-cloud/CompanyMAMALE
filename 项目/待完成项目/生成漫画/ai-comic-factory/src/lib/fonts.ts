const simsunStack = '"SimSun", "STSong", "serif"';

export const indieflower = {
  className: "font-simsun",
  variable: "--font-simsun",
  style: { fontFamily: simsunStack }
};
export const thegirlnextdoor = indieflower;
export const komika = indieflower;
export const actionman = indieflower;
export const karantula = indieflower;
export const manoskope = indieflower;
export const paeteround = indieflower;
export const qarmic = indieflower;
export const archrival = indieflower;
export const cartoonist = indieflower;
export const toontime = indieflower;
export const vtc = indieflower;
export const digitalstrip = indieflower;

export const fonts = {
  simsun: indieflower,
  indieflower,
  thegirlnextdoor,
  komika,
  actionman,
  karantula,
  manoskope,
  paeteround,
  qarmic,
  archrival,
  cartoonist,
  toontime,
  vtc,
  digitalstrip
}

export const fontList = Object.keys(fonts)
export type FontName = keyof typeof fonts
export const defaultFont = "simsun" as FontName
export const classNames = [indieflower.className]
export const className = indieflower.className

export type FontClass = "font-simsun"
