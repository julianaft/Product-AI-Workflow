import businessmapLogo from '../assets/businessmap.svg';

export function BusinessmapBrand() {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <img
        src={businessmapLogo}
        alt="Businessmap"
        className="h-7 w-auto max-w-48"
      />
      <span className="bg-orange text-black rounded-full px-3 py-1 text-xs font-extrabold uppercase tracking-widest">
        WIP
      </span>
    </div>
  );
}
