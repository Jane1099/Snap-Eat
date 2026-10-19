export const DEFAULT_THEME_COLOR = '#10b981';
export const THEME_COLOR_KEY = 'snap-eat-accent';
export const DISPLAY_MODE_KEY = 'mind-eat-theme';

export function isThemeColor(value: string): boolean {
  return /^#[0-9a-f]{6}$/i.test(value);
}

export function getThemeColor(): string {
  try {
    const stored = localStorage.getItem(THEME_COLOR_KEY);
    return stored && isThemeColor(stored) ? stored : DEFAULT_THEME_COLOR;
  } catch {
    return DEFAULT_THEME_COLOR;
  }
}

function luminance(channels: number[]): number {
  return channels.map(value => {
    const channel = value / 255;
    return channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
}

function hslRgb(hue: number, saturation: number, lightness: number): number[] {
  const a = saturation / 100 * Math.min(lightness / 100, 1 - lightness / 100);
  return [0, 8, 4].map(offset => {
    const k = (offset + hue / 30) % 12;
    return 255 * (lightness / 100 - a * Math.max(-1, Math.min(k - 3, 9 - k, 1)));
  });
}

export function applyThemeColor(hex: string): void {
  if (!isThemeColor(hex)) return;
  const rgb = [1, 3, 5].map(offset => parseInt(hex.slice(offset, offset + 2), 16));
  const [red, green, blue] = rgb.map(value => value / 255);
  const max = Math.max(red, green, blue), min = Math.min(red, green, blue), delta = max - min;
  const lightness = (max + min) / 2;
  const saturation = delta === 0 ? 0 : delta / (1 - Math.abs(2 * lightness - 1));
  let hue = 0;
  if (delta) {
    hue = max === red ? ((green - blue) / delta) % 6 : max === green ? (blue - red) / delta + 2 : (red - green) / delta + 4;
    hue = (hue * 60 + 360) % 360;
  }
  const primary = `${hue.toFixed(2)} ${(saturation * 100).toFixed(2)}% ${(lightness * 100).toFixed(2)}%`;
  const root = document.documentElement;
  const light = root.classList.contains('light');
  const backgrounds = ['--background', '--card'].map(variable => {
    const [h, s, l] = getComputedStyle(root).getPropertyValue(variable).trim().split(/\s+/).map(parseFloat);
    return luminance(hslRgb(h, s, l));
  });
  let readableLightness = lightness * 100;
  // Keep accent text readable even when the selected colour is very pale or dark.
  for (let step = 0; step < 100; step++) {
    const value = luminance(hslRgb(hue, saturation * 100, readableLightness));
    if (backgrounds.every(background => (Math.max(value, background) + 0.05) / (Math.min(value, background) + 0.05) >= 4.5)) break;
    readableLightness = Math.min(100, Math.max(0, readableLightness + (light ? -1 : 1)));
  }
  const readable = `${hue.toFixed(2)} ${(saturation * 100).toFixed(2)}% ${readableLightness.toFixed(2)}%`;
  const value = luminance(rgb);
  const dark = luminance([17, 24, 39]);
  const foreground = (value + 0.05) / (dark + 0.05) >= 1.05 / (value + 0.05) ? '222 47% 11%' : '0 0% 100%';
  root.style.setProperty('--primary', primary);
  root.style.setProperty('--primary-foreground', foreground);
  root.style.setProperty('--primary-readable', readable);
  root.style.setProperty('--ring', readable);
  root.style.setProperty('--accent', `${hue.toFixed(2)} ${(saturation * 100).toFixed(2)}% ${light ? 92 : 17}%`);
  root.style.setProperty('--accent-foreground', readable);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex);
}

export function initializeTheme(): void {
  try {
    document.documentElement.classList.toggle('light', localStorage.getItem(DISPLAY_MODE_KEY) === 'light');
  } catch {
    document.documentElement.classList.remove('light');
  }
  applyThemeColor(getThemeColor());
}
