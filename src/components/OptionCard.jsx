import { classNames } from './ui.js';

export function OptionCard({ selected, recommended, title, description, onSelect }) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      className={classNames(
        'relative text-left rounded-2xl p-5 border-2 transition-colors h-full',
        selected ? 'border-blue bg-canvas' : 'border-line bg-white hover:border-sky',
      )}
    >
      {recommended ? (
        <span className="absolute -top-3 right-3 bg-lime text-black text-xs font-extrabold px-3 py-1 rounded-full">
          Sugerido
        </span>
      ) : null}

      <h4 className={classNames('font-extrabold mb-2', selected ? 'text-blue' : 'text-black')}>
        {title}
      </h4>
      <p className="text-sm">{description}</p>
    </button>
  );
}
