import { StoreImage } from './StoreImage';
import { Container } from './Container';

export interface Tile {
  title: string;
  img: string;
}

interface TileGridProps<T extends Tile> {
  tiles: T[];
  gridClassName: string;
  tileClassName: string;
  rowClassName?: string;
  imageClassName: string;
  onSelect: (tile: T) => void;
}

/** A row of image tiles with a title and arrow (category pills, collection chips, ...). */
export function TileGrid<T extends Tile>({ tiles, gridClassName, tileClassName, rowClassName = 'items-end', imageClassName, onSelect }: TileGridProps<T>) {
  return (
    <Container className={gridClassName}>
      {tiles.map((tile) => (
        <button
          key={tile.title}
          type="button"
          onClick={() => onSelect(tile)}
          className={`relative rounded-lg bg-[#F0EBE2] border border-[#7E7C77]/20 group cursor-pointer overflow-hidden text-left shadow-[0_10px_30px_-10px_rgba(46,45,43,0.05)] ${tileClassName}`}
        >
          <StoreImage src={tile.img} alt="" sizes="(max-width: 640px) 50vw, (max-width: 1024px) 25vw, 20vw" className={`absolute inset-0 ${imageClassName}`} />
          <span className={`relative z-10 flex justify-between w-full ${rowClassName}`}>
            <span className="text-xs font-extrabold uppercase tracking-[0.1em] text-white">{tile.title}</span>
            <span className="text-xs text-white" aria-hidden="true">→</span>
          </span>
        </button>
      ))}
    </Container>
  );
}
