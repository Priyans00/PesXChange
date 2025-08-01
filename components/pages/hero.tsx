'use client';
import Image from 'next/image';

export function Hero() {
  return (
    <div className="flex flex-col justify-center items-center text-center gap-6 px-4 py-12 min-h-screen overflow-hidden">
      <h1 className="text-4xl sm:text-5xl font-bold leading-tight">
        Welcome to{' '}
        <span className="relative inline-block">
          {/* Light mode */}
          <span className="bg-gradient-to-r from-orange-500 via-blue-400 to-blue-800 bg-clip-text text-transparent dark:hidden">
            PESXChange
          </span>
          {/* Dark mode */}
          <span className="bg-gradient-to-r from-orange-500 via-gray-100 to-blue-800 bg-clip-text text-transparent hidden dark:inline">
            PESXChange
          </span>
        </span>
      </h1>

      <p className="text-muted-foreground max-w-xl text-base sm:text-lg">
        Buy, sell, or rent anything within Campus — textbooks, gadgets, furniture, merch.
      </p>

      {/* Light Mode Banner */}
      <div className="relative w-full max-w-4xl max-h-[40vh] dark:hidden h-[40vh]">
        <Image
          src="/banner-light.png"
          alt="Banner Light"
          fill
          className="object-contain rounded-xl shadow"
          priority
        />
      </div>

      {/* Dark Mode Banner */}
      <div className="relative w-full max-w-4xl max-h-[40vh] hidden dark:block h-[40vh]">
        <Image
          src="/banner-dark.png"
          alt="Banner Dark"
          fill
          className="object-contain rounded-xl shadow"
          priority
        />
      </div>

      <div className="w-full p-[5px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent my-6" />
    </div>
  );
}