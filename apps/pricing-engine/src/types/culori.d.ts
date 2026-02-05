declare module "culori" {
  export interface Color {
    mode: string;
    [key: string]: unknown;
  }

  export interface Hsl extends Color {
    mode: "hsl";
    h?: number;
    s: number;
    l: number;
    alpha?: number;
  }

  export interface Rgb extends Color {
    mode: "rgb";
    r: number;
    g: number;
    b: number;
    alpha?: number;
  }

  export interface Lch extends Color {
    mode: "lch";
    l: number;
    c: number;
    h?: number;
    alpha?: number;
  }

  export interface Oklch extends Color {
    mode: "oklch";
    l: number;
    c: number;
    h?: number;
    alpha?: number;
  }

  export function hsl(color: string | Color | Hsl): Hsl | undefined;
  export function rgb(color: string | Color | Rgb): Rgb | undefined;
  export function lch(color: string | Color | Lch): Lch | undefined;
  export function oklch(color: string | Color | Oklch): Oklch | undefined;
  export function formatHex(color: Color | string | undefined): string | undefined;
  export function formatHsl(color: Color | string | undefined): string | undefined;
  export function formatRgb(color: Color | string | undefined): string | undefined;
  export function parse(color: string): Color | undefined;
}
