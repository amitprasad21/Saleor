import HeroCarousel from "@/components/HeroCarousel"
import Searchbar from "@/components/Searchbar"
import Image from "next/image"
import { getTrendingProducts } from "@/lib/actions"
import ProductCard from "@/components/ProductCard"

const Home = async () => {
  const trendingProducts = await getTrendingProducts();

  return (
    <>
      <section className="px-6 md:px-20 py-24">
        <div className="flex max-xl:flex-col gap-16">
          <div className="flex flex-col justify-center" id="searchbar"> 
            <p className="small-text">
              Smart Tracking Starts Here:
              <Image 
                src="/assets/icons/arrow-right.svg"
                alt="arrow-right"
                width={16}
                height={16}
                style={{ width: 'auto', height: 'auto' }}
              />
            </p>

            <h1 className="head-text">
              Unleash the Power of
              <span className="text-primary"> Saleor</span>
            </h1>

            <p className="mt-6">
              Track your favorite products globally. Get instant push notifications via Email and Telegram whenever prices drop!
            </p>

            <Searchbar />
          </div>

          <HeroCarousel />
        </div>
      </section>

      <section className="trending-section" id="trending">
        <h2 className="section-text">Trending</h2>

        <div className="flex flex-wrap gap-x-8 gap-y-16">
          {trendingProducts?.map((product) => (
            <ProductCard key={product._id} product={product} />
          ))}
        </div>
      </section>
    </>
  )
}

export default Home