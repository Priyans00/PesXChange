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
import { getDisplayName, getDisplayInitials, validateNickname } from "@/lib/utils";
import Image from "next/image";
import { profilesService } from "@/lib/services";
import { apiClient } from "@/lib/api-client";

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
  const { user, isLoading: authLoading } = useAuth();
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

      // Check cache first to avoid duplicate API calls
      const cacheKey = `profile_data_${user.id}`;
      const cached = localStorage.getItem(cacheKey);
      
      if (cached) {
        try {
          const cachedData = JSON.parse(cached);
          // Use cache if it's less than 5 minutes old
          if (Date.now() - cachedData.timestamp < 5 * 60 * 1000) {

            setProfileData(cachedData.data);
            setEditBio(cachedData.data.profile.bio || "");
            setEditPhone(cachedData.data.profile.phone || "");
            setEditNickname(cachedData.data.profile.nickname || "");
            return;
          }
        } catch (e) {
          // Invalid cache, proceed with API call
        }
      }

      // Direct API call to Go backend
      const apiResponse = await fetch(`http://localhost:8080/api/profile/${user.id}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!apiResponse.ok) {
        throw new Error(`HTTP ${apiResponse.status}: ${apiResponse.statusText}`);
      }
      
      const response = await apiResponse.json();
      
      if (!response.success || !response.data) {
        throw new Error('Invalid response from server');
      }
      
      // The Go backend returns the user profile directly in response.data
      const userProfile = response.data;
      
      // Fetch user's items to calculate real statistics
      let userItems: UserItem[] = [];
      let stats = {
        totalItemsSold: 0,
        totalItemsBought: 0, // Not implemented yet
        totalViews: 0,
        totalLikes: 0, // Not implemented yet
        averageRating: userProfile.rating || 0,
      };
      
      try {
        const itemsData = await apiClient.getItemsBySeller(user.id, 100, 0) as any;
        
        if (itemsData && itemsData.success && itemsData.data) {
          userItems = itemsData.data.map((item: any) => ({
            id: item.id,
            title: item.title,
            price: item.price,
            condition: item.condition,
            category: item.category || 'Uncategorized',
            images: item.images || [],
            views: item.views || 0,
            likes: 0, // Not implemented yet
            created_at: item.created_at,
            is_available: item.is_available,
          }));
          
          // Calculate real statistics
          stats = {
            totalItemsSold: userItems.filter(item => !item.is_available).length, // Sold = not available
            totalItemsBought: 0, // Would need to implement purchase tracking
            totalViews: userItems.reduce((sum, item) => sum + item.views, 0),
            totalLikes: userItems.reduce((sum, item) => sum + item.likes, 0),
            averageRating: userProfile.rating || 0,
          };
        }
      } catch (error) {
        console.error('Failed to fetch user items:', error);
        console.error('Error details:', error instanceof Error ? error.message : error);
      }
      
      // Convert to ProfileData format expected by the component
      const data: ProfileData = {
        profile: {
          id: userProfile.id,
          name: userProfile.name,
          srn: userProfile.srn,
          nickname: userProfile.nickname || null,
          bio: userProfile.bio || null,
          phone: userProfile.phone || null,
          rating: userProfile.rating || 0,
          verified: userProfile.verified || false,
          location: userProfile.location || null,
          year_of_study: null,
          branch: userProfile.branch || null,
          created_at: userProfile.created_at,
          email: userProfile.email,
        },
        items: userItems,
        stats: stats
      };
      
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
    
    // Wait for auth to finish loading before attempting to fetch data
    if (authLoading) {
      return; // Auth is still loading, don't do anything yet
    }
    
    if (user) {
      fetchProfileData();
    } else {
      setError("Please log in to view your profile.");
      setIsLoading(false);
    }
  }, [user, authLoading]); // Removed fetchProfileData from dependencies

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

    // Validate nickname using utility function
    const nicknameValidation = validateNickname(nicknameTrimmed);
    if (!nicknameValidation.isValid) {
      setError(nicknameValidation.error || 'Invalid nickname');
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      const updateData = {
        bio: bioTrimmed || undefined,
        phone: phoneTrimmed || undefined, // Go backend uses 'phone', not 'contact_number'
        nickname: nicknameTrimmed || undefined,
      };

      const response = await profilesService.updateProfile(user.id, updateData);

      const result = response.data;

      // Update the profile data with the new values
      if (profileData) {
        const updatedProfileData: ProfileData = {
          ...profileData,
          profile: {
            ...profileData.profile,
            bio: result.bio || null,
            phone: result.phone || null, // Go backend uses 'phone'
            nickname: result.nickname || null,
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
