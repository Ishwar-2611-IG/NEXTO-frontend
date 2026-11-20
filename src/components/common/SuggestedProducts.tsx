import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';
import { SUGGESTED_PRODUCTS } from '../../data/products';
import { LINK_BUTTON_CLASS, SectionHeading } from './SectionHeading';
import { ProductGrid } from './ProductGrid';

/** "You Might Also Like" rail shared by the cart and order-confirmation pages. */
export function SuggestedProducts() {
  return (
    <div className="space-y-6">
      <SectionHeading
        as="h3"
        title="You Might Also Like"
        titleClassName="text-2xl"
        actions={
          <Link to={ROUTES.collections} className={LINK_BUTTON_CLASS}>
            View All →
          </Link>
        }
      />
      <ProductGrid
        products={SUGGESTED_PRODUCTS}
        variant="compact"
        addLabel="+ Add to Bag"
        gridClassName="grid-cols-2 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-6"
      />
    </div>
  );
}
