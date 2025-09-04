"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Mail,
  Calendar,
  Star,
  Edit3,
  Phone,
  MapPin,
  Eye,
  Heart,
  Package,
  ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/auth-context";
import { getDisplayName, getDisplayInitials } from "@/lib/utils";
import Image from "next/image";

interface UserStats {
  totalItemsSold: number;
  totalItemsBought: number;
  totalViews: number;
  totalLikes: number;
  averageRating: number;
}

interface UserItem {
  id: string;
  title: string;
  price: number;
  condition: string;
  category: string;
  images: string[];
  views: number;
  likes: number;
  created_at: string;
  is_available: boolean;
}

interface ProfileData {
  profile: {
    id: string;
    name: string;
    srn: string;
    nickname: string | null;
    bio: string | null;
    phone: string | null;
    rating: number;
    verified: boolean;
    location: string | null;
    year_of_study: number | null;
    branch: string | null;
    created_at: string;
    email?: string;
  };
  items: UserItem[];
  stats: UserStats;
}

export function ProfileComponent() {
  const { user } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [editBio, setEditBio] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editNickname, setEditNickname] = useState("");

  // Memoized currency formatter
  const formatCurrency = useMemo(() => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  }, []);

  const fetchProfileData = useCallback(async () => {
    if (!user) {
      setError("Please log in to view your profile.");
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Check cache first
      const cacheKey = `profile_data_${user.id}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const parsedCache = JSON.parse(cached);
        const cacheAge = Date.now() - parsedCache.timestamp;
        // Use cache if less than 5 minutes old
        if (cacheAge < 5 * 60 * 1000) {
          setProfileData(parsedCache.data);
          setEditBio(parsedCache.data.profile.bio || "");
          setEditPhone(parsedCache.data.profile.phone || "");
          setEditNickname(parsedCache.data.profile.nickname || "");
          setIsLoading(false);
          return;
        }
      }

      const response = await fetch(`/api/profile?userId=${user.id}`, {
        headers: {
          'X-User-ID': user.id,
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }
      
      const data: ProfileData = await response.json();
      
      // Cache the data
      localStorage.setItem(cacheKey, JSON.stringify({
        data,
        timestamp: Date.now()
      }));
      
      setProfileData(data);
      setEditBio(data.profile.bio || "");
      setEditPhone(data.profile.phone || "");
      setEditNickname(data.profile.nickname || "");
    } catch (error) {
      console.error('Error fetching profile data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load profile');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchProfileData();
    } else {
      setError("Please log in to view your profile.");
      setIsLoading(false);
    }
  }, [user, fetchProfileData]);

  const handleUpdateProfile = async () => {
    if (!profileData || !user) return;
    
    // Input validation
    const bioTrimmed = editBio.trim();
    const phoneTrimmed = editPhone.trim();
    const nicknameTrimmed = editNickname.trim();

    if (bioTrimmed.length > 500) {
      setError('Bio must be 500 characters or less');
      return;
    }

    if (phoneTrimmed && !/^\+?[\d\s\-\(\)]{10,15}$/.test(phoneTrimmed)) {
      setError('Please enter a valid phone number');
      return;
    }

    if (nicknameTrimmed && (nicknameTrimmed.length < 2 || nicknameTrimmed.length > 50)) {
      setError('Nickname must be between 2 and 50 characters');
      return;
    }

    // Check for potentially inappropriate content in nickname
    const inappropriateWords = ['admin', 'moderator', 'official', 'pesu', 'university'];
    if (nicknameTrimmed && inappropriateWords.some(word => 
      nicknameTrimmed.toLowerCase().includes(word.toLowerCase())
    )) {
      setError('Please choose a different nickname');
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      const response = await fetch(`/api/profile?userId=${user.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'X-User-ID': user.id,
        },
        body: JSON.stringify({
          bio: bioTrimmed || null,
          phone: phoneTrimmed || null,
          nickname: nicknameTrimmed || null,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();

      // Update the profile data with the new values
      if (profileData) {
        const updatedProfileData: ProfileData = {
          ...profileData,
          profile: {
            ...profileData.profile,
            bio: result.bio,
            phone: result.phone,
            nickname: result.nickname,
          }
        };
        setProfileData(updatedProfileData);
        
        // Update cache
        const cacheKey = `profile_data_${user.id}`;
        localStorage.setItem(cacheKey, JSON.stringify({
          data: updatedProfileData,
          timestamp: Date.now()
        }));
      }

      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      setError(error instanceof Error ? error.message : 'Failed to update profile');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardHeader>
            <div className="flex items-center space-x-4">
              <Skeleton className="h-16 w-16 rounded-full" />
              <div>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-48" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <Card key={i}>
                  <CardContent className="p-4">
                    <Skeleton className="h-8 w-16 mb-2" />
                    <Skeleton className="h-4 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card>
          <CardContent className="p-8 text-center">
            <p className="text-red-600">{error}</p>
            <Button onClick={fetchProfileData} className="mt-4">
              Try Again
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profileData) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-3xl font-bold">
                  {getDisplayInitials(profileData.profile)}
                </div>
              </div>
              <CardTitle className="flex items-center justify-center gap-2">
                <div className="flex flex-col items-center">
                  <span>{getDisplayName(profileData.profile)}</span>
                  {profileData.profile.nickname && (
                    <span className="text-sm text-muted-foreground font-normal">
                      ({profileData.profile.name})
                    </span>
                  )}
                </div>
                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                  Verified PESU Student
                </Badge>
              </CardTitle>
              <CardDescription>
                {profileData.profile.bio || "No bio available"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">{profileData.profile.email}</span>
                </div>
                {profileData.profile.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profileData.profile.phone}</span>
                  </div>
                )}
                {profileData.profile.location && (
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">{profileData.profile.location}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm">
                    Member since {new Date(profileData.profile.created_at).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-4 w-4 text-yellow-500 fill-current" />
                  <span className="text-sm">{profileData.profile.rating.toFixed(1)} rating</span>
                </div>
              </div>

              <div className="mt-6">
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="w-full" variant="outline">
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-md">
                    <DialogHeader>
                      <DialogTitle>Edit Profile</DialogTitle>
                      <DialogDescription>
                        Update your display name, bio and contact information. Use a nickname for enhanced privacy.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      {error && (
                        <div className="text-sm text-red-600 bg-red-50 p-2 rounded">
                          {error}
                        </div>
                      )}
                      <div>
                        <Label htmlFor="nickname">Display Name (Nickname)</Label>
                        <Input
                          id="nickname"
                          placeholder="Enter a nickname for privacy (optional)"
                          value={editNickname}
                          onChange={(e) => setEditNickname(e.target.value)}
                          maxLength={50}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          This will be shown instead of your real name. Leave empty to use your real name.
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="bio">Bio (max 500 characters)</Label>
                        <Textarea
                          id="bio"
                          placeholder="Tell others about yourself..."
                          value={editBio}
                          onChange={(e) => setEditBio(e.target.value)}
                          maxLength={500}
                          rows={3}
                        />
                        <div className="text-xs text-muted-foreground mt-1">
                          {editBio.length}/500 characters
                        </div>
                      </div>
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          placeholder="+91 98765 43210"
                          value={editPhone}
                          onChange={(e) => setEditPhone(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          onClick={handleUpdateProfile} 
                          disabled={isUpdating}
                          className="flex-1"
                        >
                          {isUpdating ? 'Updating...' : 'Save Changes'}
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setIsDialogOpen(false);
                            setError(null);
                          }}
                          disabled={isUpdating}
                        >
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
        <div className="lg:col-span-2 space-y-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{profileData.items.length}</div>
                <div className="text-sm text-muted-foreground">Items Listed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">
                  {profileData.items.filter(item => !item.is_available).length}
                </div>
                <div className="text-sm text-muted-foreground">Items Sold</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{profileData.stats.totalViews}</div>
                <div className="text-sm text-muted-foreground">Total Views</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-red-600">{profileData.stats.totalLikes}</div>
                <div className="text-sm text-muted-foreground">Total Likes</div>
              </CardContent>
            </Card>
          </div>

          {/* Items List */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Your Items ({profileData.items.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {profileData.items.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">You haven&apos;t listed any items yet.</p>
                  <Link href="/sell">
                    <Button className="mt-4">
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      List Your First Item
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-4">
                  {profileData.items.slice(0, 6).map((item) => (
                    <Link key={item.id} href={`/item/${item.id}`}>
                      <Card className="hover:shadow-md transition-shadow cursor-pointer">
                        <CardContent className="p-4">
                          <div className="flex items-center gap-4">
                            <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                              {item.images[0] ? (
                                <Image
                                  src={item.images[0]}
                                  alt={item.title}
                                  width={64}
                                  height={64}
                                  className="w-full h-full object-cover rounded-lg"
                                />
                              ) : (
                                <Package className="h-8 w-8 text-muted-foreground" />
                              )}
                            </div>
                            <div className="flex-1">
                              <h3 className="font-medium">{item.title}</h3>
                              <p className="text-sm text-muted-foreground">{item.category}</p>
                              <div className="flex items-center gap-4 mt-2">
                                <span className="font-bold text-lg">
                                  {formatCurrency.format(item.price)}
                                </span>
                                <Badge variant={item.is_available ? "default" : "secondary"}>
                                  {item.is_available ? "Available" : "Sold"}
                                </Badge>
                              </div>
                            </div>
                            <div className="text-right space-y-1">
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Eye className="h-4 w-4" />
                                {item.views}
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Heart className="h-4 w-4" />
                                {item.likes}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  ))}
                  {profileData.items.length > 6 && (
                    <div className="text-center">
                      <Link href="/item-listing">
                        <Button variant="outline">
                          View All Items ({profileData.items.length})
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
