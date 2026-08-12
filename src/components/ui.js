/**
 * Classes reaproveitadas pela interface.
 *
 * Os nomes de classe ficam escritos por extenso de proposito: o Tailwind
 * so gera o que consegue enxergar no codigo, entao concatenar cor em runtime
 * produziria classes inexistentes.
 */

export const CARD = 'bg-white border border-line rounded-2xl';

export const BUTTON = {
  primary:
    'bg-blue text-white font-semibold px-6 py-3 rounded-xl hover:bg-black transition-colors disabled:bg-line disabled:text-black',
  secondary:
    'bg-white text-blue border border-blue font-semibold px-6 py-3 rounded-xl hover:bg-canvas transition-colors',
  accent:
    'bg-orange text-black font-semibold px-6 py-3 rounded-xl hover:bg-ember hover:text-white transition-colors disabled:bg-line',
  success:
    'bg-green text-black font-semibold px-6 py-3 rounded-xl hover:bg-lime transition-colors disabled:bg-line',
  quiet:
    'bg-white text-black border border-line font-semibold px-4 py-2 rounded-xl hover:border-blue transition-colors',
};

export const ACCENT_BG = {
  lime: 'bg-lime',
  green: 'bg-green',
  sky: 'bg-sky',
  blue: 'bg-blue',
  orange: 'bg-orange',
  ember: 'bg-ember',
};

export const ACCENT_TEXT = {
  lime: 'text-black',
  green: 'text-black',
  sky: 'text-black',
  blue: 'text-blue',
  orange: 'text-orange',
  ember: 'text-ember',
};

export const INPUT =
  'w-full border border-line rounded-xl bg-white px-4 py-3 text-black placeholder:text-line focus:border-blue';

export function classNames(...values) {
  return values.filter(Boolean).join(' ');
}
