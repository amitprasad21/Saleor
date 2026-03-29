import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@clerk/nextjs/server'
import { SignInButton, SignUpButton, Show, UserButton } from "@clerk/nextjs";

const navIcons = [
  { src: '/assets/icons/search.svg', alt: 'search' },
  { src: '/assets/icons/black-heart.svg', alt: 'heart' },
]

const Navbar = async () => {
  const { userId } = await auth();

  return (
    <header className="w-full">
      <nav className="nav max-w-7xl mx-auto">
        <Link href="/" className="flex items-center gap-0">
          <Image 
            src="/logo.png"
            width={60}
            height={60}
            className="object-contain -mr-2"
            style={{ width: 'auto', height: 'auto', maxHeight: '60px' }}
            alt="Saleor logo"
          />

          <p className="font-spaceGrotesk text-[34px] font-bold">
           <span className='text-primary'>Saleor</span>
          </p>
        </Link>

        <div className="flex items-center gap-5">
          {/* Functional Icons jumping directly to App Sections */}
          <Link href="#searchbar" className="hover:opacity-70 transition-opacity">
            <Image 
              src="/assets/icons/search.svg"
              alt="search"
              width={28}
              height={28}
              className="object-contain"
            />
          </Link>
          <Link href="#trending" className="hover:opacity-70 transition-opacity">
            <Image 
              src="/assets/icons/black-heart.svg"
              alt="favorites"
              width={28}
              height={28}
              className="object-contain"
            />
          </Link>



          {/* Inline Auth Buttons */}
          <Show when="signed-out">
            <div className="flex gap-4 font-semibold text-gray-700 ml-4">
              <SignInButton />
              <SignUpButton />
            </div>
          </Show>
          <Show when="signed-in">
            <div className="ml-4">
              <UserButton />
            </div>
          </Show>
        </div>
      </nav>
    </header>
  )
}

export default Navbar