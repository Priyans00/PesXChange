'use client';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { PaperPlaneIcon, ShoppingBagIcon, PackageIcon, HandshakeIcon, AtomIcon } from "./Icons";

export function Hero() {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Dotted Background Pattern */}
      <div className="absolute inset-0 bg-white dark:bg-black">
        <div className="absolute inset-0 dotted-bg" />
      </div>

      {/* Style illustrations */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top left - Paper plane */}
        <div className="absolute top-32 left-8 md:left-32 transform -rotate-12">
          <PaperPlaneIcon />
        </div>

        {/* Top right - Shopping bag */}
        <div className="absolute top-40 right-8 md:right-32 transform rotate-12">
          <ShoppingBagIcon />
        </div>

        {/* Bottom left - Package */}
        <div className="absolute bottom-40 left-16 md:left-40 transform rotate-6">
          <PackageIcon />
        </div>

        {/* Bottom right - Handshake */}
        <div className="absolute bottom-32 right-16 md:right-40 transform -rotate-6">
          <HandshakeIcon />
        </div>

        {/* E = mc² - top left */}
        <div className="absolute top-20 left-4 md:left-20 text-gray-300 dark:text-gray-700 font-mono text-sm transform -rotate-12">
          E = mc²
        </div>

        {/* Atom - right side */}
        <div className="absolute top-1/2 right-4 md:right-20 transform translate-y-[-50%] rotate-12">
          <AtomIcon />
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-20">

        {/* Main Heading */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-extrabold text-center mb-6 text-gray-900 dark:text-white max-w-3xl mx-auto leading-snug">
          Buy, sell, and trade second-hand items right here on campus.
        </h1>

        {/* Subtitle */}
        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 text-center max-w-2xl mb-12 leading-relaxed">
          Discover unique, one-of-a-kind goods. Buy and sell directly with people around you.
        </p>

        {/* CTA */}
        <div className="mb-20">
          <Button
            asChild
            size="lg"
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-8 py-4 text-lg font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Link href="/item-listing">
              Get Started
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}