"use client";

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { User as UserIcon, Mail, Calendar, Star } from 'lucide-react';

interface UserProfile {
  id: string;
  name: string | null;
  email: string | null;
  srn: string | null;
  phone: string | null;
  bio: string | null;
  program: string | null;
  branch: string | null;
  semester: string | null;
  rating: number;
  verified: boolean;
  location: string | null;
  created_at: string;
}

interface UserStats {
  items_sold: number;
  items_bought: number;
  total_items: number;
  rating: number;
}

export function ProfileComponent() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user) {
          setError('Not authenticated');
          return;
        }

        // Fetch profile
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (profileError) {
          console.error('Profile error:', profileError);
          setError('Failed to load profile');
          return;
        }

        setProfile(profileData);

        // Fetch stats
        const { data: itemsData } = await supabase
          .from('items')
          .select('id, is_available')
          .eq('seller_id', user.id);

        const stats: UserStats = {
          items_sold: itemsData?.filter(item => !item.is_available).length || 0,
          items_bought: 0, // Would need a purchases or transactions table
          total_items: itemsData?.length || 0,
          rating: profileData?.rating || 0
        };

        setStats(stats);
      } catch (err) {
        console.error('Error loading profile:', err);
        setError('Failed to load profile');
      } finally {
        setLoading(false);
      }
    }

    loadProfile();
  }, []);

  if (loading) {
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
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <div className="flex items-center space-x-4">
            <div className="h-16 w-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <UserIcon className="h-8 w-8 text-white" />
            </div>
            <div>
              <CardTitle className="text-2xl">{profile?.name || 'User'}</CardTitle>
              <CardDescription className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>{profile?.email}</span>
                {profile?.srn && (
                  <Badge variant="secondary">PESU Student</Badge>
                )}
                {profile?.verified && (
                  <Badge variant="default">Verified</Badge>
                )}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats?.total_items}</div>
                <div className="text-sm text-muted-foreground">Items Listed</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats?.items_sold}</div>
                <div className="text-sm text-muted-foreground">Items Sold</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 text-center">
                <div className="flex items-center justify-center space-x-1">
                  <Star className="h-5 w-5 text-yellow-500 fill-current" />
                  <span className="text-2xl font-bold">{stats?.rating}</span>
                </div>
                <div className="text-sm text-muted-foreground">Rating</div>
              </CardContent>
            </Card>
          </div>

          {/* Account Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Member Since:</span>
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">
                      {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'N/A'}
                    </span>
                  </div>
                </div>
                {profile?.srn && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">SRN:</span>
                    <Badge variant="outline">{profile.srn}</Badge>
                  </div>
                )}
                {profile?.program && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Program:</span>
                    <span className="text-sm">{profile.program}</span>
                  </div>
                )}
                {profile?.branch && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Branch:</span>
                    <span className="text-sm">{profile.branch}</span>
                  </div>
                )}
                {profile?.semester && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Semester:</span>
                    <span className="text-sm">{profile.semester}</span>
                  </div>
                )}
                {profile?.location && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium">Location:</span>
                    <span className="text-sm">{profile.location}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}
