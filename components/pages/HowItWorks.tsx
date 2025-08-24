'use client';
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Search, Camera, MessageSquare, HandHeart } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      icon: Search,
      step: "01",
      title: "Discover",
      description: "Browse thousands of unique items or use our smart search to find exactly what you're looking for.",
      color: "bg-black dark:bg-white"
    },
    {
      icon: Camera,
      step: "02", 
      title: "List",
      description: "Take a photo, add a description, set your price. Your item goes live instantly to our community.",
      color: "bg-black dark:bg-white"
    },
    {
      icon: MessageSquare,
      step: "03",
      title: "Connect",
      description: "Chat with interested buyers or sellers. Negotiate, ask questions, and build trust through conversation.",
      color: "bg-black dark:bg-white"
    },
    {
      icon: HandHeart,
      step: "04",
      title: "Exchange",
      description: "Meet locally, complete payments, ship securely.",
      color: "bg-black dark:bg-white"
    }
  ];

  return (
    <section className="py-20 px-4 bg-white dark:bg-black">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
            How It <span className="text-black dark:text-white">Works</span>
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Getting started is simple. Follow these four easy steps to begin your journey in our marketplace.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {steps.map((step, index) => {
            const IconComponent = step.icon;
            return (
              <div key={index} className="text-center group">
                {/* Step Number */}
                <div className="relative mb-6">
                  <div className={`${step.color} w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <IconComponent className="text-white dark:text-black" size={24} />
                  </div>
                  <div className="absolute -top-2 -right-2 w-8 h-8 bg-black dark:bg-white text-white dark:text-black rounded-full flex items-center justify-center text-sm font-bold">
                    {step.step}
                  </div>
                </div>

                {/* Step Content */}
                <h3 className="text-xl font-semibold text-black dark:text-white mb-3">
                  {step.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {step.description}
                </p>

                {/* Connector Line (hidden on last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-gradient-to-r from-gray-300 to-gray-300 dark:from-gray-700 dark:to-gray-700 transform translate-x-8" />
                )}
              </div>
            );
          })}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Button 
            asChild
            size="lg"
            className="bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-gray-200 px-8 py-4 text-lg font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <Link href="/auth/sign-up">
              Start Selling Today
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
