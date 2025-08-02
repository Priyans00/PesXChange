"use client";
import { useState, useEffect, useCallback } from "react";
import { Search, MapPin, Star, MessageCircle, Heart, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Item {
  id: string;
  title: string;
  price: number;
  location: string;
  year?: number;
  condition: string;
  seller: {
    id: string;
    name: string;
    rating: number;
    verified: boolean;
  };
  images: string[];
  category: string;
  views: number;
  likes: number;
  description: string;
  createdAt: string;
}

interface CurrentUser{
    id: string;
    name?: string;
}

const categories = [
  "All",
  "Electronics",
  "Books",
  "Clothing",
  "Furniture",
  "Sports",
  "Vehicles",
  "Others"
];

const conditions = ["All", "New", "Like New", "Good", "Fair"];
const priceRanges = [
  "All",
  "Under ₹500",
  "₹500 - ₹1,000",
  "₹1,000 - ₹5,000",
  "₹5,000 - ₹10,000",
  "Above ₹10,000"
];

export function ItemListingContents() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedCondition, setSelectedCondition] = useState("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState("All");
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  // Get current user
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setCurrentUser(data.user);
    });
  }, []);

  // Memoize fetchItems to prevent unnecessary re-renders
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      
      if (selectedCategory !== "All") params.append("category", selectedCategory);
      if (selectedCondition !== "All") params.append("condition", selectedCondition);
      if (searchQuery) params.append("search", searchQuery);
      
      // Handle price range
      if (selectedPriceRange !== "All") {
        switch (selectedPriceRange) {
          case "Under ₹500":
            params.append("maxPrice", "500");
            break;
          case "₹500 - ₹1,000":
            params.append("minPrice", "500");
            params.append("maxPrice", "1000");
            break;
          case "₹1,000 - ₹5,000":
            params.append("minPrice", "1000");
            params.append("maxPrice", "5000");
            break;
          case "₹5,000 - ₹10,000":
            params.append("minPrice", "5000");
            params.append("maxPrice", "10000");
            break;
          case "Above ₹10,000":
            params.append("minPrice", "10000");
            break;
        }
      }

      const response = await fetch(`/api/items?${params.toString()}`);
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch items');
      }
      
      setItems(data);
    } catch (error) {
      console.error('Error fetching items:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedCondition, selectedPriceRange]);

  // Fetch items when dependencies change
  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Buy Second-hand Items at PES University
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Find great deals on books, electronics, furniture and more from fellow students
        </p>
      </div>

      {/* Search and Filter Bar */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4 mb-6">
        <div className="flex flex-col lg:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search for items..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

            <select
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={selectedCondition}
              onChange={(e) => setSelectedCondition(e.target.value)}
            >
              {conditions.map(condition => (
                <option key={condition} value={condition}>{condition}</option>
              ))}
            </select>

            <select
              className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              value={selectedPriceRange}
              onChange={(e) => setSelectedPriceRange(e.target.value)}
            >
              {priceRanges.map(range => (
                <option key={range} value={range}>{range}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Results Summary */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-gray-600 dark:text-gray-400">
          Showing {items.length} items
        </p>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchItems()}>
            Refresh
          </Button>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 p-4 animate-pulse">
              <div className="h-48 bg-gray-300 dark:bg-gray-600 rounded-lg mb-4"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-4"></div>
              <div className="flex gap-2">
                <div className="flex-1 h-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
                <div className="h-8 w-8 bg-gray-300 dark:bg-gray-600 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Items Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} currentUser={currentUser} />
          ))}
        </div>
      )}

      {/* No Results */}
      {!loading && items.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 text-lg">No items found matching your criteria</p>
          <Button 
            variant="outline" 
            className="mt-4"
            onClick={() => {
              setSearchQuery("");
              setSelectedCategory("All");
              setSelectedCondition("All");
              setSelectedPriceRange("All");
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}

// Item Card Component - Updated with dark mode support
function ItemCard({ item, currentUser }: { item: Item; currentUser: CurrentUser | null }) {
  const [isLiked, setIsLiked] = useState(false);
  const [likesCount, setLikesCount] = useState(item.likes);

  const handleLike = async () => {
    if (!currentUser) return;

    try {
      const response = await fetch(`/api/items/${item.id}/like`, {
        method: 'POST',
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setIsLiked(data.liked);
        setLikesCount(prev => data.liked ? prev + 1 : prev - 1);
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border dark:border-gray-700 hover:shadow-md transition-shadow duration-200">
      {/* Image */}
      <div className="relative">
        <Image
          src={item.images[0] || "/api/placeholder/300/200"}
          alt={item.title}
          width={300}
          height={200}
          className="w-full h-48 object-cover rounded-t-lg"
        />
        <button
          className={`absolute top-3 right-3 p-2 rounded-full ${
            isLiked ? 'bg-red-500 text-white' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300'
          } hover:scale-110 transition-transform`}
          onClick={handleLike}
          disabled={!currentUser}
        >
          <Heart className="h-4 w-4" fill={isLiked ? 'currentColor' : 'none'} />
        </button>
        
        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className="bg-blue-600 text-white text-xs px-2 py-1 rounded-full">
            {item.category}
          </span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2 line-clamp-2">
          {item.title}
        </h3>

        {/* Price */}
        <div className="mb-2">
          <span className="text-xl font-bold text-green-600 dark:text-green-400">
            ₹{item.price.toLocaleString()}
          </span>
          {item.year && (
            <span className="text-gray-500 dark:text-gray-400 text-sm ml-2">• {item.year}</span>
          )}
        </div>

        {/* Location */}
        <div className="flex items-center text-gray-500 dark:text-gray-400 text-sm mb-2">
          <MapPin className="h-4 w-4 mr-1" />
          {item.location}
        </div>

        {/* Condition */}
        <div className="mb-3">
          <span className={`text-xs px-2 py-1 rounded-full ${
            item.condition === 'New' ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' :
            item.condition === 'Like New' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
            item.condition === 'Good' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
            'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
          }`}>
            {item.condition}
          </span>
        </div>

        {/* Seller Info */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center">
            <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
              {item.seller.name.charAt(0)}
            </div>
            <div className="ml-2">
              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.seller.name}</p>
              <div className="flex items-center">
                <Star className="h-3 w-3 text-yellow-400 fill-current" />
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-1">{item.seller.rating}</span>
                {item.seller.verified && (
                  <span className="text-xs text-green-600 dark:text-green-400 ml-1">✓</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-gray-500 dark:text-gray-400 text-xs mb-3">
          <div className="flex items-center">
            <Eye className="h-3 w-3 mr-1" />
            {item.views}
          </div>
          <div className="flex items-center">
            <Heart className="h-3 w-3 mr-1" />
            {likesCount}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button className="flex-1" size="sm" asChild>
            <Link href={`/item/${item.id}`}>
              View Details
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href={`/protected?sellerId=${item.seller.id}`}>
              <MessageCircle className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}