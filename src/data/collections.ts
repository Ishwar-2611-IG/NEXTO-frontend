import { IMG, unsplash } from '../constants/images';

export const COLLECTION_TILES = [
  { title: 'All Collections', img: unsplash(IMG.editorialStreetwear, 400) },
  { title: "Spring '25", img: unsplash(IMG.womensStyle, 400) },
  { title: "Summer '25", img: unsplash(IMG.mensStreetwear, 400) },
  { title: 'Monsoon Edit', img: unsplash(IMG.footwearEditorial, 400) },
  { title: "Winter '25", img: unsplash(IMG.minimalistWardrobe, 400) },
];

export const LOOKBOOK = [
  { title: 'CITY MOVES', subtitle: "SPRING '25", img: unsplash(IMG.editorialStreetwear, 600) },
  { title: 'BOLD FEMININE', subtitle: "SUMMER '25", img: unsplash(IMG.womensStyle, 600) },
  { title: 'THE STREETS', subtitle: 'MONSOON EDIT', img: unsplash(IMG.mensStreetwear, 600) },
  { title: 'LAYERED PERSPECTIVE', subtitle: "WINTER '25", img: unsplash(IMG.footwearEditorial, 600) },
];

export const CURATED_LOOKS = [
  { name: 'Urban Explorer', items: '5 Items', price: 12999, img: unsplash(IMG.editorialStreetwear, 600) },
  { name: 'Minimal Street Fit', items: '4 Items', price: 10999, img: unsplash(IMG.womensStyle, 600) },
  { name: 'City Comfort', items: '5 Items', price: 13499, img: unsplash(IMG.mensStreetwear, 600) },
  { name: 'Bold & Relaxed', items: '5 Items', price: 14499, img: unsplash(IMG.footwearEditorial, 600) },
];
