'use client';
import { ShoppingBag, MessageCircle, Zap, Heart } from "lucide-react";

export function Features() {
  const features = [
    {
      icon: ShoppingBag,
      title: "Buy & Sell Anything",
      description: "From textbooks to electronics, furniture to collectibles - find or sell unique items with ease.",
      color: "text-black dark:text-white"
    },
    {
      icon: MessageCircle,
      title: "Direct Communication",
      description: "Chat directly with buyers and sellers. Negotiate prices, ask questions, and build connections.",
      color: "text-black dark:text-white"
    },
    {
      icon: Zap,
      title: "Instant Listings",
      description: "List your items in seconds with our streamlined process. Photos, descriptions, and pricing made simple.",
      color: "text-black dark:text-white"
    },
    {
      icon: Heart,
      title: "Favorites & Wishlist",
      description: "Save items you love, track price changes, and get notified when similar items are listed.",
      color: "text-black dark:text-white"
    }
  ];

  return (
    <section className="py-20 px-4 bg-gray-50 dark:bg-gray-900/50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-black dark:text-white mb-4">
            Why Choose <span className="text-black dark:text-white">PesXChange</span>?
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            Swap, sell, and discover second-hand treasures right on campus - made for students, by students.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const IconComponent = feature.icon;
            return (
              <div
                key={index}
                className="bg-white dark:bg-black p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 border border-gray-200 dark:border-gray-800"
              >
                <div className={`${feature.color} mb-4`}>
                  <IconComponent size={40} />
                </div>
                <h3 className="text-xl font-semibold text-black dark:text-white mb-3">
                  {feature.title}
                </h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
