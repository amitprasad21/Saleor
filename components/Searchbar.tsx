"use client"

import { scrapeAndStoreProduct } from '@/lib/actions';
import { FormEvent, useState } from 'react'

import { useRouter } from 'next/navigation';

const isValidProductURL = (url: string) => {
  try {
    const parsedURL = new URL(url);
    const hostname = parsedURL.hostname.toLowerCase();

    // List of Indian e-commerce and quick commerce platforms
    const validPlatforms = [
      'amazon',
      'flipkart',
      'myntra',
      'ajio',
      'meesho',
      'nykaa',
      'reliancedigital',
      'croma',
      'tatacliq',
      'jiomart',
      'zeptonow',
      'blinkit',
      'swiggy',
      'bigbasket'
    ];

    return validPlatforms.some(platform => hostname.includes(platform));
  } catch (error) {
    return false;
  }

  return false;
}

const Searchbar = () => {
  const [searchPrompt, setSearchPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const isValidLink = isValidProductURL(searchPrompt);

    if(!isValidLink) return alert('Please provide a valid product link');

    try {
      setIsLoading(true);

      // Scrape the product page through Apify
      const productId = await scrapeAndStoreProduct(searchPrompt);

      if (productId) {
         router.push(`/products/${productId}`);
      } else {
         alert("Scraping finished, but product ID was not returned. The scraper may have failed to extract data.");
      }
    } catch (error: any) {
      console.error(error);
      alert(`Scrape Error: ${error.message || 'Unknown network error has occurred!'}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <form 
      className="flex flex-wrap gap-4 mt-12" 
      onSubmit={handleSubmit}
    >
      <input 
        type="text"
        value={searchPrompt}
        onChange={(e) => setSearchPrompt(e.target.value)}
        placeholder="Enter product link"
        className="searchbar-input"
      />

      <button 
        type="submit" 
        className="searchbar-btn"
        disabled={searchPrompt === ''}
      >
        {isLoading ? 'Scraping... (wait 10s)' : 'Search'}
      </button>
    </form>
  )
}

export default Searchbar