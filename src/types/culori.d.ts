declare module "culori" {
  export interface Color {
    mode: string;
    [key: string]: unknown;
  }

  export interface RgbColor extends Color {
    mode: "rgb";
    r: number;
    g: number;
    b: number;
    alpha?: number;
  }

  export interface HslColor extends Color {
    mode: "hsl";
    h?: number;
    s: number;
    l: number;
    alpha?: number;
  }

  export interface LchColor extends Color {
    mode: "lch";
    l: number;
    c: number;
    h?: number;
    alpha?: number;
  }

  export interface OklchColor extends Color {
    mode: "oklch";
    l: number;
    c: number;
    h?: number;
    alpha?: number;
  }

  export function parse(color: string): Color | undefined;
  export function formatHex(color: Color | string | undefined): string;
  export function formatHsl(color: Color | string | undefined): string;
  export function rgb(color: Color | string | RgbColor): RgbColor;
  export function hsl(color: Color | string | HslColor): HslColor;
  export function lch(color: Color | string | LchColor): LchColor;
  export function oklch(color: Color | string | OklchColor): OklchColor;
}
