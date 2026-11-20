/** Curated Unsplash image IDs used across NEXTO. Widths are requested per component for responsive delivery. */
export const IMG = {
  // Editorial and apparel photography
  hoodie: '1556821840-3a63f95609a7',
  tee: '1521572163474-6864f9cf17ab',
  cargo: '1523398002811-999ca8dec234',
  denimJacket: '1551028719-00167b16eac5',
  greyHoodie: '1620799140408-edc6dcb6d633',
  sneakers: '1542291026-7eec264c27ff',
  sunglasses: '1511499767150-a48a237f0083',
  cap: '1588850561407-ed78c282e89b',
  bag: '1553062407-98eeb64c6a62',
  jewellery: '1599643478518-a784e5dc4c8f',
  socks: '1586350977771-b3b0abd50c82',
  varsity: '1495105787522-5334e3ffa0ef',
  dress: '1515372039744-b8f02a3ae446',
  jeans: '1541099649105-f69ad21f3246',
  shirt: '1602810318383-e386cc2a3ccf',
  croppedHoodie: '1556905055-8f358a7a47b2',
  avatar: '1534528741775-53994a69daeb',
  // Additional images to reduce repetition and better match each product type
  editorialStreetwear: '1529139574466-a303027c1d8b',
  streetwearModel: '1515886657613-9f3515b0c78f',
  fashionPortrait: '1539109136881-3be0616acf4b',
  clothingRack: '1551488831-00ddcb6c6bd3',
  denimDetail: '1542272604-787c3835535d',
  womensStreetwear: '1503342217505-b0a15ec3261c',
  womensStyle: '1483985988355-763728e1935b',
  mensStreetwear: '1543076447-215ad9ba6923',
  fashionBasics: '1576566588028-4147f3842f27',
  casualShirt: '1583743814966-8936f37f4678',
  apparelEditorial: '1551232864-3f0890e580d9',
  minimalistWardrobe: '1490481651871-ab68de25d43d',
  streetwearLook: '1551488831-00ddcb6c6bd3',
  croppedTop: '1521572267360-ee0c2909d518',
  footwearEditorial: '1542291026-7eec264c27ff',
} as const;

export const unsplash = (photoId: string, width: number): string =>
  `https://images.unsplash.com/photo-${photoId}?auto=format&fit=crop&q=82&w=${width}`;
