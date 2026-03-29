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
        <Link href="/" className="flex items-center gap-2">
          <Image 
            src="/logo.png"
            width={32}
            height={32}
            className="object-contain"
            style={{ width: 'auto', height: 'auto', maxHeight: '32px' }}
            alt="Saleor logo"
          />

          <p className="font-spaceGrotesk text-[32px] font-bold">
           <span className='text-primary'>Saleor</span>
          </p>
        </Link>

        <div className="flex items-center gap-5">
          {userId && (
            <Link 
              href={`https://t.me/trackprice21bot?start=${userId}`}
              target="_blank"
              className="bg-[#24A1DE] text-white px-4 py-2 rounded-full text-sm font-semibold hover:opacity-80 transition hidden sm:block"
            >
              Connect Telegram 🚀
            </Link>
          )}

          {navIcons.map((icon) => (
            <Image 
              key={icon.alt}
              src={icon.src}
              alt={icon.alt}
              width={28}
              height={28}
              className="object-contain"
            />
          ))}

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