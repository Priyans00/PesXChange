"use client";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Star, 
  MapPin, 
  Calendar, 
  ShoppingBag, 
  Heart, 
  Eye, 
  Package,
  TrendingUp,
  Award,
  Phone,
  Book,
  Edit3
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  rating: number;
  verified: boolean;
  phone?: string;
  bio?: string;
  avatar_url?: string;
  location: string;
  year_of_study?: number;
  branch?: string;
  created_at: string;
}

interface Item {
  id: string;
  title: string;
  price: number;
  location: string;
  condition: string;
  category: string;
  images: string[];
  views: number;
  likes: number;
  created_at: string;
  is_available: boolean;
}

interface ProfileStats {
  totalItemsSold: number;
  totalItemsBought: number;
  totalViews: number;
  totalLikes: number;
  averageRating: number;
  joinedDate: string;
}

export function ProfileComponent() {
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [itemsSold, setItemsSold] = useState<Item[]>([]);
  const [itemsSelling, setItemsSelling] = useState<Item[]>([]);
  const [stats, setStats] = useState<ProfileStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'sold' | 'bought' | 'selling'>('selling');
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    bio: '',
    phone: '',
    year_of_study: '',
    branch: '',
    location: ''
  });
  const router = useRouter();

  useEffect(() => {
    const supabase = createClient();
    
    // Check if user is authenticated
    supabase.auth.getUser().then(({ data, error }) => {
      if (error || !data.user) {
        router.push('/auth/login');
        return;
      }
      fetchProfileData();
    });
  }, [router]);

  const fetchProfileData = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/profile');
      if (!response.ok) {
        throw new Error('Failed to fetch profile data');
      }
      
      const data = await response.json();
      setUserProfile(data.profile);
      setItemsSold(data.items);
      setItemsSelling(data.itemsSelling || []);
      setStats({
        ...data.stats,
        joinedDate: data.profile.created_at
      });
      
      // Populate edit form
      setEditForm({
        name: data.profile.name || '',
        bio: data.profile.bio || '',
        phone: data.profile.phone || '',
        year_of_study: data.profile.year_of_study?.toString() || '',
        branch: data.profile.branch || '',
        location: data.profile.location || 'PES University, Bangalore'
      });
    } catch (error) {
      console.error('Error fetching profile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfile = async () => {
    setEditLoading(true);
    try {
      const response = await fetch('/api/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...editForm,
          year_of_study: editForm.year_of_study ? parseInt(editForm.year_of_study) : null
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update profile');
      }

      // Refresh profile data
      await fetchProfileData();
      setEditDialogOpen(false);
    } catch (error) {
      console.error('Error updating profile:', error);
    } finally {
      setEditLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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

  if (loading || !userProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Header */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              {/* Avatar */}
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                  {userProfile.avatar_url ? (
                    <Image
                      src={userProfile.avatar_url}
                      alt={userProfile.name}
                      width={96}
                      height={96}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    userProfile.name.charAt(0).toUpperCase()
                  )}
                </div>
                {userProfile.verified && (
                  <div className="absolute -bottom-1 -right-1 bg-blue-600 rounded-full p-1">
                    <Award className="w-4 h-4 text-white" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                      {userProfile.name}
                      {userProfile.verified && (
                        <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                          Verified
                        </Badge>
                      )}
                    </h1>
                    <div className="flex items-center gap-4 mt-2 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span>{userProfile.rating.toFixed(1)} rating</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4" />
                        <span>{userProfile.location}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        <span>Joined {formatDate(userProfile.created_at)}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="flex items-center gap-2">
                        <Edit3 className="w-4 h-4" />
                        Edit Profile
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Edit Profile</DialogTitle>
                        <DialogDescription>
                          Update your profile information here.
                        </DialogDescription>
                      </DialogHeader>
                      <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="name" className="text-right">
                            Name
                          </Label>
                          <Input
                            id="name"
                            value={editForm.name}
                            onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="phone" className="text-right">
                            Phone
                          </Label>
                          <Input
                            id="phone"
                            value={editForm.phone}
                            onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="year" className="text-right">
                            Year
                          </Label>
                          <Input
                            id="year"
                            type="number"
                            min="1"
                            max="4"
                            value={editForm.year_of_study}
                            onChange={(e) => setEditForm({...editForm, year_of_study: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="branch" className="text-right">
                            Branch
                          </Label>
                          <Input
                            id="branch"
                            value={editForm.branch}
                            onChange={(e) => setEditForm({...editForm, branch: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="location" className="text-right">
                            Location
                          </Label>
                          <Input
                            id="location"
                            value={editForm.location}
                            onChange={(e) => setEditForm({...editForm, location: e.target.value})}
                            className="col-span-3"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                          <Label htmlFor="bio" className="text-right">
                            Bio
                          </Label>
                          <Textarea
                            id="bio"
                            value={editForm.bio}
                            onChange={(e) => setEditForm({...editForm, bio: e.target.value})}
                            className="col-span-3"
                            rows={3}
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button onClick={handleEditProfile} disabled={editLoading}>
                          {editLoading ? "Saving..." : "Save Changes"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                {/* Profile Details */}
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {userProfile.year_of_study && (
                    <div className="flex items-center gap-2 text-sm">
                      <Book className="w-4 h-4 text-gray-500" />
                      <span>Year {userProfile.year_of_study}</span>
                      {userProfile.branch && <span>• {userProfile.branch}</span>}
                    </div>
                  )}
                  {userProfile.phone && (
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-4 h-4 text-gray-500" />
                      <span>{userProfile.phone}</span>
                    </div>
                  )}
                </div>

                {userProfile.bio && (
                  <p className="mt-4 text-gray-700 dark:text-gray-300">{userProfile.bio}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg mx-auto mb-2">
                  <Package className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalItemsSold}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Items Sold</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg mx-auto mb-2">
                  <ShoppingBag className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalItemsBought}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Items Bought</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg mx-auto mb-2">
                  <Eye className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalViews}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Views</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg mx-auto mb-2">
                  <Heart className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.totalLikes}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Likes</p>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Items Section */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>My Items</CardTitle>
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  variant={activeTab === 'selling' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('selling')}
                  className="text-sm flex-1"
                >
                  Currently Selling ({itemsSelling.length})
                </Button>
                <Button
                  variant={activeTab === 'sold' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('sold')}
                  className="text-sm flex-1"
                >
                  Items Sold ({itemsSold.length})
                </Button>
                <Button
                  variant={activeTab === 'bought' ? 'default' : 'outline'}
                  onClick={() => setActiveTab('bought')}
                  className="text-sm flex-1"
                >
                  Items Bought (0)
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {activeTab === 'selling' && (
              <div>
                {itemsSelling.length === 0 ? (
                  <div className="text-center py-12">
                    <TrendingUp className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No items currently for sale
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      List an item to start selling
                    </p>
                    <Link href="/sell">
                      <Button>Sell an Item</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {itemsSelling.map((item) => (
                      <div key={item.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative h-48">
                          {item.images.length > 0 ? (
                            <Image
                              src={item.images[0]}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <Package className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge className={getConditionColor(item.condition)}>
                              {item.condition}
                            </Badge>
                          </div>
                          <div className="absolute top-2 left-2">
                            <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              For Sale
                            </Badge>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2 truncate">{item.title}</h3>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                            ₹{item.price.toLocaleString()}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>{item.category}</span>
                            <span>{formatDate(item.created_at)}</span>
                          </div>
                          <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                <span>{item.views}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                <span>{item.likes}</span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" disabled>
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'sold' && (
              <div>
                {itemsSold.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                      No items sold yet
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Start selling items to see them here
                    </p>
                    <Link href="/sell">
                      <Button>Sell an Item</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {itemsSold.map((item) => (
                      <div key={item.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                        <div className="relative h-48">
                          {item.images.length > 0 ? (
                            <Image
                              src={item.images[0]}
                              alt={item.title}
                              fill
                              className="object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                              <Package className="w-12 h-12 text-gray-400" />
                            </div>
                          )}
                          <div className="absolute top-2 right-2">
                            <Badge className={getConditionColor(item.condition)}>
                              {item.condition}
                            </Badge>
                          </div>
                          {!item.is_available && (
                            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                              <Badge className="bg-red-600 text-white">Sold</Badge>
                            </div>
                          )}
                        </div>
                        <div className="p-4">
                          <h3 className="font-semibold text-lg mb-2 truncate">{item.title}</h3>
                          <p className="text-2xl font-bold text-blue-600 dark:text-blue-400 mb-2">
                            ₹{item.price.toLocaleString()}
                          </p>
                          <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                            <span>{item.category}</span>
                            <span>{formatDate(item.created_at)}</span>
                          </div>
                          <div className="flex items-center justify-between mt-3 text-sm text-gray-500">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                <span>{item.views}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Heart className="w-4 h-4" />
                                <span>{item.likes}</span>
                              </div>
                            </div>
                            <Button variant="outline" size="sm" disabled>
                              View Details
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'bought' && (
              <div className="text-center py-12">
                <ShoppingBag className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                  No purchased items yet
                </h3>
                <p className="text-gray-600 dark:text-gray-400 mb-4">
                  Items you purchase will appear here
                </p>
                <Link href="/item-listing">
                  <Button>Browse Items</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
