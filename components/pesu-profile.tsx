"use client";
import { useState, useEffect, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Star, 
  Calendar, 
  ShoppingBag, 
  Heart, 
  Eye, 
  Package,
  TrendingUp,
  Phone,
  Book,
  Edit3,
  GraduationCap,
  Building,
  Mail,
  IdCard,
  Loader2,
  AlertCircle
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import Image from "next/image";

interface UserStats {
  itemsSold: number;
  activeListings: number;
  totalEarnings: number;
  totalViews: number;
  averageRating: number;
  totalFavorites: number;
}

interface Item {
  id: string;
  title: string;
  price: number;
  location: string;
  condition: string;
  category: string;
  images: string[];
  created_at: string;
  views: number;
  likes: number;
  is_available: boolean;
}

interface ProfileData {
  profile: {
    id: string;
    name: string;
    srn: string;
    bio: string | null;
    phone: string | null;
    rating: number;
    verified: boolean;
    location: string;
  };
  items: Item[];
  stats: UserStats;
}

// Local cache for profile data (5 minutes TTL, max 100 entries)
const profileDataCache = new Map<string, { data: ProfileData; expiry: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const CACHE_MAX_ENTRIES = 100;

// Helper to set cache with size limit and cleanup
function setProfileDataCache(key: string, value: { data: ProfileData; expiry: number }) {
  // Clean up expired entries
  for (const [k, v] of profileDataCache) {
    if (v.expiry < Date.now()) {
      profileDataCache.delete(k);
    }
  }
  
  // If cache is full, delete the oldest entry based on expiry time
  if (profileDataCache.size >= CACHE_MAX_ENTRIES) {
    // Find the key with the earliest expiry (oldest entry)
    let oldestKey: string | undefined;
    let oldestExpiry = Infinity;
    for (const [k, v] of profileDataCache) {
      if (v.expiry < oldestExpiry) {
        oldestExpiry = v.expiry;
        oldestKey = k;
      }
    }
    if (oldestKey !== undefined) {
      profileDataCache.delete(oldestKey);
    }
  }
  
  profileDataCache.set(key, value);
}

// Helper to get cache and cleanup expired
function getProfileDataCache(key: string): { data: ProfileData; expiry: number } | undefined {
  const entry = profileDataCache.get(key);
  if (entry && entry.expiry >= Date.now()) {
    return entry;
  } else if (entry) {
    profileDataCache.delete(key);
  }
  return undefined;
}

export function ProfileComponent() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editPhone, setEditPhone] = useState("");

  // Memoized currency formatter
  const formatCurrency = useMemo(() => {
    return (amount: number) => {
      return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
      }).format(amount);
    };
  }, []);

  // Memoized image source getter with better error handling
  const getImageSrc = useCallback((item: Item) => {
    if (!item.images || !Array.isArray(item.images) || item.images.length === 0) {
      return null;
    }

    const firstImage = item.images[0];
    if (!firstImage || typeof firstImage !== 'string') {
      return null;
    }

    // If it's a base64 image or URL
    if (firstImage.startsWith('data:image/') || firstImage.startsWith('http')) {
      return firstImage;
    }
    
    return null;
  }, []);

  // Fetch user profile data and stats with caching
  const fetchProfileData = useCallback(async () => {
    if (!user?.id) return;

    // Check cache first
    const cacheKey = `profile-${user.id}`;
    const cached = getProfileDataCache(cacheKey);
    if (cached) {
      setProfileData(cached.data);
      setEditBio(cached.data.profile.bio || "");
      setEditPhone(cached.data.profile.phone || "");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`/api/profile/pesu-stats?userId=${user.id}`, {
        headers: {
          'Cache-Control': 'no-cache',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in again');
        } else if (response.status === 403) {
          throw new Error('Access denied');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment.');
        }
        throw new Error('Failed to fetch profile data');
      }
      
      const data: ProfileData = await response.json();
      
      // Cache the data
      setProfileDataCache(cacheKey, {
        data,
        expiry: Date.now() + CACHE_TTL
      });
      
      setProfileData(data);
      setEditBio(data.profile.bio || "");
      setEditPhone(data.profile.phone || "");
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchProfileData();
  }, [fetchProfileData]);

  const handleUpdateProfile = async () => {
    if (!user?.id) return;

    // Input validation
    const bioTrimmed = editBio.trim();
    const phoneTrimmed = editPhone.trim();

    if (bioTrimmed.length > 500) {
      setError('Bio must be 500 characters or less');
      return;
    }

    const phoneRegex = /^[\d\s\-\+\(\)]{10,15}$/;
    if (phoneTrimmed && !phoneRegex.test(phoneTrimmed)) {
      setError('Please enter a valid phone number');
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);
      
      const response = await fetch('/api/profile/pesu-update', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          bio: bioTrimmed || null,
          phone: phoneTrimmed || null,
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Please log in again');
        } else if (response.status === 403) {
          throw new Error('Access denied');
        } else if (response.status === 429) {
          throw new Error('Too many requests. Please wait a moment.');
        }
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      
      // Update local state with new profile data
      if (profileData) {
        const updatedProfileData = {
          ...profileData,
          profile: {
            ...profileData.profile,
            bio: result.profile.bio,
            phone: result.profile.phone,
          }
        };
        setProfileData(updatedProfileData);
        
        // Update cache
        const cacheKey = `profile-${user.id}`;
        setProfileDataCache(cacheKey, {
          data: updatedProfileData,
          expiry: Date.now() + CACHE_TTL
        });
      }
      
      setIsEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Please log in to view your profile.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <p className="text-red-500 mb-4">{error || 'Failed to load profile'}</p>
          <Button onClick={fetchProfileData} variant="outline">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Info */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  {profileData.profile.name.charAt(0).toUpperCase()}
                </div>
              </div>
              <CardTitle className="flex items-center justify-center gap-2">
                {profileData.profile.name}
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  Verified PESU Student
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <IdCard className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">SRN:</span>
                  <span>{user.srn}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Email:</span>
                  <span>{user.email}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Building className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Campus:</span>
                  <span>{user.profile.campus} Campus</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <GraduationCap className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Branch:</span>
                  <span>{user.profile.branch}</span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Book className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Program:</span>
                  <span>{user.profile.program}</span>
                </div>
                {user.profile.semester && user.profile.semester !== "NA" && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Semester:</span>
                    <span>{user.profile.semester}</span>
                  </div>
                )}
                {profileData.profile.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Phone:</span>
                    <span>{profileData.profile.phone}</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-3">
                  {profileData.profile.bio || "No bio available."}
                </p>
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="w-full">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>
                        Update your bio and contact information
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {error && (
                        <div className="text-red-500 text-sm mb-2">
                          {error}
                        </div>
                      )}
                      <div>
                        <Label htmlFor="bio">Bio (max 500 characters)</Label>
                        <Textarea
                          id="bio"
                          placeholder="Tell others about yourself..."
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          maxLength={500}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {editBio.length}/500 characters
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="Your phone number"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button onClick={handleUpdateProfile} disabled={isUpdating}>
                          {isUpdating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                          Save Changes
                        </Button>
                        <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Stats and Items */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <ShoppingBag className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{profileData.stats.itemsSold}</p>
                <p className="text-sm text-muted-foreground">Items Sold</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <TrendingUp className="h-8 w-8 text-green-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{formatCurrency(profileData.stats.totalEarnings)}</p>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Eye className="h-8 w-8 text-purple-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{profileData.stats.totalViews}</p>
                <p className="text-sm text-muted-foreground">Total Views</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <Star className="h-8 w-8 text-yellow-600 mx-auto mb-2" />
                <p className="text-2xl font-bold">{profileData.stats.averageRating}</p>
                <p className="text-sm text-muted-foreground">Average Rating</p>
              </CardContent>
            </Card>
          </div>

          {/* Active Listings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Your Active Listings ({profileData.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profileData.items.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {profileData.items.map((item) => (
                    <Link key={item.id} href={`/item/${item.id}`}>
                      <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex gap-3">
                            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center overflow-hidden">
                              {getImageSrc(item) ? (
                                <Image
                                  src={getImageSrc(item)!}
                                  alt={item.title}
                                  width={64}
                                  height={64}
                                  className="object-cover w-full h-full"
                                />
                              ) : (
                                <Package className="h-8 w-8 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm mb-1 line-clamp-2">{item.title}</h3>
                              <p className="text-lg font-bold text-primary">{formatCurrency(item.price)}</p>
                              <div className="flex items-center gap-4 text-xs text-muted-foreground mt-2">
                                <span className="flex items-center gap-1">
                                  <Eye className="h-3 w-3" />
                                  {item.views}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Heart className="h-3 w-3" />
                                  {item.likes}
                                </span>
                                <Badge variant="outline" className="text-xs">
                                  {item.condition}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">You haven&apos;t listed any items yet.</p>
                  <Button asChild>
                    <Link href="/sell">Create Your First Listing</Link>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
