import { Product } from '@/types';
import Image from 'next/image';
import Link from 'next/link';
import React from 'react'
import { getPlatformIcon } from '@/lib/utils';

interface Props {
  product: Product;
}
 
const ProductCard = ({ product }: Props) => {
  return (
    <Link href={`/products/${product._id}`} className="product-card">
      <div className="product-card_img-container group relative">
        <Image 
          src={product.image || '/logo.png'}
          alt={product.title || 'Product Image'}
          width={200}
          height={200}
          className="product-card_img transition-transform duration-300 group-hover:scale-105"
        />
        <div className="absolute top-2 left-2 bg-white/90 p-1.5 rounded-full shadow-sm backdrop-blur-sm z-10 hidden sm:block">
           <img src={getPlatformIcon(product.url)} alt="platform" className="w-5 h-5 object-contain" />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        <h3 className="product-title">{product.title}</h3>

        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <img src={getPlatformIcon(product.url)} alt="platform" className="w-4 h-4 object-contain sm:hidden" />
            <p className="text-black opacity-50 text-sm capitalize">
              {product.category || 'Deal'}
            </p>
          </div>

          <p className="text-black text-lg font-semibold">
            <span>{product?.currency}</span>
            <span>{product?.currentPrice}</span>
          </p>
        </div>
      </div>
    </Link>
  )
}

export default ProductCard