 import Modal from "@/components/Modal";
import PriceInfoCard from "@/components/PriceInfoCard";
import ProductCard from "@/components/ProductCard";
import { getProductById, getSimilarProducts } from "@/lib/actions"
import { formatNumber, addAffiliateTag, getPlatformIcon } from "@/lib/utils";
import { Product } from "@/types";
import { auth, clerkClient } from '@clerk/nextjs/server';
import { removeUserEmailFromProduct } from "@/lib/actions";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

type Props = {
  params: Promise<{ id: string }>
}

const ProductDetails = async ({ params }: Props) => {
  const resolvedParams = await params;
  const id = resolvedParams.id;

  const product: Product = await getProductById(id);

  if(!product) redirect('/');

  const { userId } = await auth();
  let userEmail = '';
  if (userId) {
    const client = await clerkClient();
    const userObj = await client.users.getUser(userId);
    userEmail = userObj.emailAddresses[0]?.emailAddress ?? '';
  }

  const isTracking = userEmail ? product.users?.some((user: any) => user.email === userEmail) : false;

  const similarProducts = await getSimilarProducts(id);

  return (
    <div className="product-container">
      <div className="flex flex-col gap-8 xl:flex-row xl:gap-28">
        <div className="product-image">
          <Image 
            src={product.image || '/logo.png'}
            alt={product.title || 'Product'}
            width={580}
            height={400}
            className="mx-auto object-contain w-full max-w-[580px] h-auto"
            style={{ maxHeight: '400px' }}
          />
        </div>

        <div className="flex-1 flex flex-col">
          <div className="flex justify-between items-start gap-5 flex-wrap pb-6">
            <div className="flex flex-col gap-3">
              <p className="text-[28px] text-secondary font-semibold">
                {product.title}
              </p>

              <Link
                href={addAffiliateTag(product.url)}
                target="_blank"
                className="text-base text-black opacity-50 flex items-center gap-2"
              >
                <img src={getPlatformIcon(product.url)} alt="platform" className="w-5 h-5 object-contain" />
                Visit {product?.category || 'Product'} on Store
              </Link>
            </div>

            <div className="flex items-center gap-3">
              <div className="product-hearts">
                <Image 
                  src="/assets/icons/red-heart.svg"
                  alt="heart"
                  width={20}
                  height={20}
                />

                <p className="text-base font-semibold text-[#D46F77]">
                  {product.reviewsCount}
                </p>
              </div>

              <Link href={addAffiliateTag(product.url)} target="_blank" className="p-2 bg-white-200 rounded-10 hover:bg-white-300 transition-colors">
                <Image 
                  src="/assets/icons/bookmark.svg"
                  alt="bookmark"
                  width={20}
                  height={20}
                />
              </Link>

              <a href={`mailto:?subject=Check out this deal on Saleor: ${product.title}&body=I found this massive price drop! Check it out here: ${product.url}`} className="p-2 bg-white-200 rounded-10 hover:bg-white-300 transition-colors">
                <Image 
                  src="/assets/icons/share.svg"
                  alt="share"
                  width={20}
                  height={20}
                />
              </a>
            </div>
          </div>

          <div className="product-info">
            <div className="flex flex-col gap-2">
              <p className="text-[34px] text-secondary font-bold">
                {product.currency} {formatNumber(product.currentPrice)}
              </p>
              <p className="text-[21px] text-black opacity-50 line-through">
                {product.currency} {formatNumber(product.originalPrice)}
              </p>
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex gap-3">
                <div className="product-stars">
                  <Image 
                    src="/assets/icons/star.svg"
                    alt="star"
                    width={16}
                    height={16}
                  />
                  <p className="text-sm text-primary-orange font-semibold">
                    {product.stars || '25'}
                  </p>
                </div>

                <div className="product-reviews">
                  <Image 
                    src="/assets/icons/comment.svg"
                    alt="comment"
                    width={16}
                    height={16}
                  />
                  <p className="text-sm text-secondary font-semibold">
                    {product.reviewsCount} Reviews
                  </p>
                </div>
              </div>

              <p className="text-sm text-black opacity-50">
                <span className="text-primary-green font-semibold">93% </span> of
                buyers have recommeded this.
              </p>
            </div>
          </div>

          <div className="my-7 flex flex-col gap-5">
            <div className="flex gap-5 flex-wrap">
              <PriceInfoCard 
                title="Current Price"
                iconSrc="/assets/icons/price-tag.svg"
                value={`${product.currency} ${formatNumber(product.currentPrice)}`}
              />
              <PriceInfoCard 
                title="Average Price"
                iconSrc="/assets/icons/chart.svg"
                value={`${product.currency} ${formatNumber(product.averagePrice)}`}
              />
              <PriceInfoCard 
                title="Highest Price"
                iconSrc="/assets/icons/arrow-up.svg"
                value={`${product.currency} ${formatNumber(product.highestPrice)}`}
              />
              <PriceInfoCard 
                title="Lowest Price"
                iconSrc="/assets/icons/arrow-down.svg"
                value={`${product.currency} ${formatNumber(product.lowestPrice)}`}
              />
            </div>
          </div>

          <div className="flex flex-col gap-4">
            {!isTracking && (
              <Modal productId={id} defaultEmail={userEmail} />
            )}

            {/* If Auth, inject the missing Telegram and Untrack features */}
            {userId && (
              <div className="flex flex-col gap-3">
                <Link 
                  href={`https://t.me/trackprice21bot?start=${userId}`}
                  target="_blank"
                  className="bg-[#24A1DE] text-white px-4 py-3 rounded-full text-center text-sm font-semibold hover:opacity-80 transition flex items-center justify-center gap-2"
                >
                  <Image src="/assets/icons/share.svg" alt="telegram" width={20} height={20} className="invert brightness-0" />
                  Connect Telegram Push Alerts
                </Link>

                {isTracking && (
                  <form action={async () => {
                    "use server"
                    if(userEmail) await removeUserEmailFromProduct(id, userEmail);
                  }}>
                    <button type="submit" className="w-full bg-red-500 text-white px-4 py-3 rounded-full text-sm font-semibold hover:bg-red-600 transition">
                      ❌ Untrack This Product
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-16">
        <div className="flex flex-col gap-5 w-full">
          <h3 className="text-2xl text-secondary font-semibold">
            Product History & Description
          </h3>

          {/* DYNAMIC PRICE BAR CHART */}
          {product && (
            <div className="w-full bg-white p-6 rounded-2xl border border-gray-200 my-4 shadow-sm">
              <p className="text-base font-semibold text-gray-800 mb-4">Price Tracking Graph</p>
              <div className="flex items-end gap-4 overflow-x-auto scrollbar-hide pb-2 h-[150px]">
                {(product.priceHistory && product.priceHistory.length > 0 ? product.priceHistory : [{ price: product.originalPrice || product.currentPrice }, { price: product.currentPrice }]).map((history: any, index: number) => {
                  const barHeight = Math.max(10, (history.price / (product.highestPrice || product.currentPrice || 1)) * 100);
                  
                  return (
                    <div key={index} className="flex flex-col items-center justify-end gap-2 min-w-[60px] h-full group">
                      <div className="w-full bg-blue-50 rounded-t-lg relative h-full flex items-end">
                         <div 
                            className="w-full bg-primary rounded-t-sm transition-all duration-300 group-hover:bg-[#ffb0b0]"
                            style={{ height: `${barHeight}%` }}
                         />
                      </div>
                      <p className="text-xs font-semibold text-gray-500">
                        {product.currency}{formatNumber(history.price)}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* BEAUTIFULLY CONTAINED DESCRIPTION */}
          <div className="flex flex-col gap-4 text-gray-600 bg-gray-50 p-6 rounded-2xl max-h-[400px] overflow-y-auto leading-relaxed shadow-inner">
            {product?.description?.split('\n').map((line: string, i: number) => (
               <p key={i}>{line}</p>
            ))}
          </div>
        </div>

        <Link 
          href={addAffiliateTag(product.url)} 
          target="_blank" 
          className="bg-secondary hover:bg-opacity-70 text-white rounded-full py-3 px-6 w-fit mx-auto flex items-center justify-center gap-3 min-w-[200px] transition-all font-semibold"
        >
          <Image 
            src="/assets/icons/bag.svg"
            alt="check"
            width={20}
            height={20}
            className="invert brightness-0"
          />
          Buy Now on Store
        </Link>
      </div>

      {similarProducts && similarProducts?.length > 0 && (
        <div className="py-14 flex flex-col gap-2 w-full">
          <p className="section-text">Similar Products</p>

          <div className="flex overflow-x-auto gap-5 mt-7 w-full pb-6 snap-x">
            {similarProducts.map((product) => (
              <div key={product._id} className="min-w-[260px] snap-center">
                 <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default ProductDetails