import Image from 'next/image';

const Loading = () => {
  return (
    <div className="flex w-full min-h-[50vh] items-center justify-center flex-col gap-6">
      <div className="relative w-16 h-16 flex items-center justify-center">
        <div className="absolute w-full h-full border-4 border-[#E21D48] rounded-full animate-ping opacity-20"></div>
        <div className="absolute w-full h-full border-4 border-t-[#E21D48] border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin"></div>
        <Image 
          src="/logo.png" 
          alt="loading" 
          width={32} 
          height={32} 
          className="object-contain"
          style={{ width: 'auto', height: 'auto', maxHeight: '32px' }}
        />
      </div>
      <p className="text-primary font-spaceGrotesk text-xl font-bold animate-pulse">
        Saleor is working...
      </p>
    </div>
  )
}

export default Loading;
