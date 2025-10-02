"use client";
import { useEffect, useState } from 'react';
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Heart, MessageCircle, Share2, User, MapPin, Calendar, Eye, Star, Package, Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Breadcrumb } from "@/components/ui/breadcrumb";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getDisplayName, getDisplayInitials } from "@/lib/utils";
import { itemsService } from "@/lib/services";

// Global request tracking to prevent duplicate API calls
const itemRequestsInProgress = new Set<string>();

interface Item {
  id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  year?: number;
  condition: string;
  category: string;
  images: string[];
  views: number;
  likes: number;
  is_available: boolean;
  created_at: string;
  updated_at: string;
  seller: {
    id: string;
    name: string;
    nickname?: string;
    rating: number;
    verified: boolean;
    avatar_url?: string;
    bio?: string;
    phone?: string;
    location: string;
    created_at: string;
  };
}

interface RelatedItem {
  id: string;
  title: string;
  price: number;
  images: string[];
  condition: string;
}

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const { user, isLoggedIn, isLoading: authLoading } = useAuth(); // Use PESU Auth
  const [item, setItem] = useState<Item | null>(null);
  const [relatedItems, setRelatedItems] = useState<RelatedItem[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showContactInfo, setShowContactInfo] = useState(false);
  
  useEffect(() => {
    const fetchItemDetails = async () => {
      const itemId = params.id as string;
      
      // Wait for auth to finish loading before making API calls
      if (authLoading) {
        return;
      }
      
      // Prevent multiple simultaneous requests using global tracking
      if (itemRequestsInProgress.has(itemId)) {
        return;
      }
      
      itemRequestsInProgress.add(itemId);
      
      try {
        // Fetch item details
        const response = await itemsService.getItem(params.id as string);
        const itemData = response.data;
        
        // Map the response to match the expected Item interface
        const mappedItem: Item = {
          id: itemData.id,
          title: itemData.title,
          description: itemData.description,
          price: itemData.price,
          location: itemData.location,
          condition: itemData.condition,
          category: itemData.categories?.[0] || 'Other', // Use first category
          images: itemData.image_urls || itemData.images || [],
          views: 0, // This would need to be implemented in backend
          likes: 0, // This would need to be implemented in backend
          is_available: itemData.status !== 'sold',
          created_at: itemData.created_at,
          updated_at: itemData.updated_at,
          seller: {
            id: itemData.seller?.id || itemData.seller_id,
            name: itemData.seller?.name || 'Unknown',
            nickname: itemData.seller?.nickname,
            rating: itemData.seller?.rating || 0,
            verified: itemData.seller?.verified || false,
            avatar_url: undefined,
            bio: undefined,
            phone: undefined,
            location: itemData.location,
            created_at: itemData.created_at,
          }
        };
        
        setItem(mappedItem);

        // Note: View count increment would need to be implemented in the Go backend
        // For now, we'll skip this feature or implement it as a separate API call

        // Check if user has liked this item (only if logged in with PESU Auth)
        if (user?.id) {
          try {
            const { createClient } = await import("@/lib/supabase/client");
            const supabase = createClient();
            const { data: likeData } = await supabase
              .from('item_likes')
              .select('id')
              .eq('user_id', user.id)
              .eq('item_id', params.id)
              .single();
            
            setIsLiked(!!likeData);
          } catch {
            // Ignore like check errors
          }
        }

        // Fetch related items from the same category
        try {
          const relatedResponse = await itemsService.getItems({
            category: itemData.categories?.[0],
            limit: 4
          });
          
          if (relatedResponse.data) {
            const mappedRelated: RelatedItem[] = relatedResponse.data
              .filter(relItem => relItem.id !== params.id)
              .map(relItem => ({
                id: relItem.id,
                title: relItem.title,
                price: relItem.price,
                images: relItem.image_urls || relItem.images || [],
                condition: relItem.condition,
              }));
            setRelatedItems(mappedRelated);
          }
        } catch {
          setRelatedItems([]);
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load item');
      } finally {
        setLoading(false);
        itemRequestsInProgress.delete(itemId);
      }
    };

    if (params.id) {
      fetchItemDetails();
    }
  }, [params.id, user?.id, authLoading]);

  // Cleanup function to clear requests when component unmounts
  useEffect(() => {
    return () => {
      if (params.id) {
        itemRequestsInProgress.delete(params.id as string);
      }
    };
  }, [params.id]);

  const handleLike = async () => {
    if (!isLoggedIn || !user) {
      router.push('/auth/login?redirectTo=' + encodeURIComponent(window.location.pathname));
      return;
    }

    try {
      // Note: Like functionality would need to be implemented in the Go backend
      // For now, we'll use direct Supabase calls or implement this API endpoint
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      
      if (isLiked) {
        // Remove like
        await supabase
          .from('item_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('item_id', params.id);
      } else {
        // Add like
        await supabase
          .from('item_likes')
          .insert({ user_id: user.id, item_id: params.id });
      }

      setIsLiked(!isLiked);
      if (item) {
        setItem({
          ...item,
          likes: isLiked ? item.likes - 1 : item.likes + 1
        });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
    }
  };

  const handleChatClick = () => {
    if (!isLoggedIn || !user) {
      router.push('/auth/login?redirectTo=' + encodeURIComponent(window.location.pathname));
      return;
    }
    
    if (item?.seller.id === user.id) {
      alert("You can't chat with yourself!");
      return;
    }

    router.push(`/chat?user=${item?.seller.id}`);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: item?.title,
          text: `Check out this ${item?.title} on PesXChange`,
          url: window.location.href,
        });
      } catch {
        // Ignore sharing errors
      }
    } else {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert('Link copied to clipboard!');
    }
  };

  const handleReport = () => {
    if (!isLoggedIn || !user) {
      router.push('/auth/login?redirectTo=' + encodeURIComponent(window.location.pathname));
      return;
    }
    
    // Simple alert for now - in production, this would open a proper report modal
    const reason = prompt('Please describe why you are reporting this item:');
    if (reason) {
      alert('Thank you for your report. Our team will review it shortly.');
      // Here you would send the report to your backend
    }
  };

  const getConditionColor = (condition: string) => {
    switch (condition) {
      case 'New': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'Like New': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'Good': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'Fair': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  if (error || !item) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            {error || 'Item not found'}
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            The item you&apos;re looking for doesn&apos;t exist or has been removed.
          </p>
          <Link href="/item-listing">
            <Button className="mt-4">Back to Items</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button
              variant="ghost"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Items
            </Button>
            
            {item && (
              <Breadcrumb 
                items={[
                  { label: 'Home', href: '/' },
                  { label: 'Items', href: '/item-listing' },
                  { label: item.category, href: `/item-listing?category=${item.category}` },
                  { label: item.title }
                ]}
              />
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-700">
              {item.images && item.images.length > 0 ? (
                <Image
                  src={item.images[currentImageIndex]}
                  alt={item.title}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-24 h-24 text-gray-400" />
                </div>
              )}
              
              {!item.is_available && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                  <Badge variant="destructive" className="text-lg px-4 py-2">
                    SOLD
                  </Badge>
                </div>
              )}
            </div>

            {/* Thumbnail Images */}
            {item.images && item.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {item.images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 border-2 ${
                      currentImageIndex === index
                        ? 'border-blue-500'
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <Image
                      src={image}
                      alt={`${item.title} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="space-y-6">
            {/* Title and Price */}
            <div>
              <div className="flex items-start justify-between">
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                  {item.title}
                </h1>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleShare}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <Share2 className="w-5 h-5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReport}
                    className="text-gray-500 hover:text-red-600"
                    title="Report this item"
                  >
                    <AlertTriangle className="w-5 h-5" />
                  </Button>
                </div>
              </div>
              <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">
                ₹{item.price.toLocaleString()}
              </p>
            </div>

            {/* Quick Info */}
            <div className="flex flex-wrap gap-3">
              <Badge className={getConditionColor(item.condition)}>
                <Shield className="w-3 h-3 mr-1" />
                {item.condition}
              </Badge>
              <Badge variant="outline">
                <MapPin className="w-3 h-3 mr-1" />
                {item.location}
              </Badge>
              {item.year && (
                <Badge variant="outline">
                  <Calendar className="w-3 h-3 mr-1" />
                  {item.year}
                </Badge>
              )}
              <Badge variant="outline">
                <Eye className="w-3 h-3 mr-1" />
                {item.views} views
              </Badge>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={handleChatClick}
                className="flex-1"
                disabled={!item.is_available || item.seller.id === user?.id}
              >
                <MessageCircle className="w-4 h-4 mr-2" />
                Chat with Seller
              </Button>
              <Button
                variant="outline"
                onClick={handleLike}
                className={isLiked ? "text-red-500 border-red-500" : ""}
              >
                <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />
                <span className="ml-2">{item.likes}</span>
              </Button>
            </div>

            {/* Seller Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Seller Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center overflow-hidden">
                    {item.seller.avatar_url ? (
                      <Image
                        src={item.seller.avatar_url}
                        alt={getDisplayName(item.seller)}
                        width={64}
                        height={64}
                        className="object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl font-bold">
                        {getDisplayInitials(item.seller)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {getDisplayName(item.seller, true)}
                      </h3>
                      {item.seller.verified && (
                        <Badge variant="secondary">
                          <Shield className="w-3 h-3 mr-1" />
                          Verified
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1 mt-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {item.seller.rating.toFixed(1)} rating
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      <MapPin className="w-3 h-3 inline mr-1" />
                      {item.seller.location}
                    </p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Member since {formatDate(item.seller.created_at)}
                    </p>
                    {item.seller.bio && (
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-2">
                        {item.seller.bio}
                      </p>
                    )}
                  </div>
                </div>
                
                {user && item.seller.id !== user.id && (
                  <div className="mt-4 pt-4 border-t">
                    <Dialog open={showContactInfo} onOpenChange={setShowContactInfo}>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          View Contact Information
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Contact {getDisplayName(item.seller)}</DialogTitle>
                          <DialogDescription>
                            Please be respectful when contacting the seller.
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-3">
                          {item.seller.phone && (
                            <div className="flex items-center gap-2">
                              <strong>Phone:</strong>
                              <a href={`tel:${item.seller.phone}`} className="text-blue-600 hover:underline">
                                {item.seller.phone}
                              </a>
                            </div>
                          )}
                          <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                            <p className="text-sm text-yellow-800 dark:text-yellow-200">
                              <strong>Safety Tip:</strong> Always meet in a public place and inspect the item before making payment.
                            </p>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Safety Tips */}
            <Card className="border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20 dark:border-yellow-800">
              <CardHeader>
                <CardTitle className="text-yellow-800 dark:text-yellow-200 flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Safety Guidelines
                </CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-yellow-700 dark:text-yellow-300">
                <ul className="space-y-1">
                  <li>• Meet in a safe, public location</li>
                  <li>• Inspect the item thoroughly before payment</li>
                  <li>• Use secure payment methods</li>
                  <li>• Trust your instincts - if something feels wrong, walk away</li>
                  <li>• Report suspicious behavior to platform administrators</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Description Section */}
        <div className="mt-12">
          <Card>
            <CardHeader>
              <CardTitle>Product Description</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="prose max-w-none dark:prose-invert">
                <p className="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                  {item.description || "No description provided."}
                </p>
              </div>
              
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold mb-3">Item Details</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Category:</span>
                    <p className="font-medium">{item.category}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Condition:</span>
                    <p className="font-medium">{item.condition}</p>
                  </div>
                  {item.year && (
                    <div>
                      <span className="text-gray-500 dark:text-gray-400">Year:</span>
                      <p className="font-medium">{item.year}</p>
                    </div>
                  )}
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Listed:</span>
                    <p className="font-medium">{formatDate(item.created_at)}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Related Items */}
        {relatedItems.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
              Related Items
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedItems.map((relatedItem) => (
                <Link key={relatedItem.id} href={`/item/${relatedItem.id}`}>
                  <Card className="hover:shadow-lg transition-shadow cursor-pointer">
                    <div className="relative aspect-square">
                      {relatedItem.images && relatedItem.images.length > 0 ? (
                        <Image
                          src={relatedItem.images[0]}
                          alt={relatedItem.title}
                          fill
                          className="object-cover rounded-t-lg"
                        />
                      ) : (
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center rounded-t-lg">
                          <Package className="w-12 h-12 text-gray-400" />
                        </div>
                      )}
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-sm line-clamp-2 mb-2">
                        {relatedItem.title}
                      </h3>
                      <p className="text-lg font-bold text-blue-600 dark:text-blue-400">
                        ₹{relatedItem.price.toLocaleString()}
                      </p>
                      <Badge className={`mt-2 text-xs ${getConditionColor(relatedItem.condition)}`}>
                        {relatedItem.condition}
                      </Badge>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}