import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { designerSignupSchema } from '@/lib/validations';

interface ProfileData {
  name: string;
  email: string;
  phone_number: string;
  portfolio_url: string;
  design_background: string;
  furniture_interests: string;
}

const CreatorProfile = () => {
  const [profile, setProfile] = useState<ProfileData>({
    name: '',
    email: '',
    phone_number: '',
    portfolio_url: '',
    design_background: '',
    furniture_interests: '',
  });
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('designer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;

      if (data) {
        setProfile({
          name: data.name || '',
          email: data.email || '',
          phone_number: data.phone_number || '',
          portfolio_url: data.portfolio_url || '',
          design_background: data.design_background || '',
          furniture_interests: data.furniture_interests || '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to load profile',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Validate data
      designerSignupSchema.parse({
        ...profile,
        phone: profile.phone_number,
        portfolio: profile.portfolio_url,
        background: profile.design_background,
        interests: profile.furniture_interests,
        termsAccepted: true, // Already accepted
      });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('designer_profiles')
        .update({
          name: profile.name,
          email: profile.email,
          phone_number: profile.phone_number,
          portfolio_url: profile.portfolio_url,
          design_background: profile.design_background,
          furniture_interests: profile.furniture_interests,
        })
        .eq('user_id', user.id);

      if (error) throw error;

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been updated successfully',
      });
      setIsEditing(false);
    } catch (error: any) {
      if (error.name === 'ZodError') {
        toast({
          title: 'Validation Error',
          description: error.errors[0]?.message || 'Please check your input',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to update profile',
          variant: 'destructive',
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Loading profile...</p>
      </div>
    );
  }

  return (
    <Card className="max-w-4xl">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Profile Information</CardTitle>
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={handleSave} disabled={isSaving}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button onClick={() => {
              setIsEditing(false);
              fetchProfile();
            }} variant="outline">
              Cancel
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">Full Name</label>
                  {isEditing ? (
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                    />
                  ) : (
                    <p className="text-foreground">{profile.name}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Email</label>
                  {isEditing ? (
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    />
                  ) : (
                    <p className="text-foreground">{profile.email}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll receive order notifications at this email
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Phone Number</label>
                  {isEditing ? (
                    <Input
                      type="tel"
                      value={profile.phone_number}
                      onChange={(e) => setProfile({ ...profile, phone_number: e.target.value })}
                    />
                  ) : (
                    <p className="text-foreground">{profile.phone_number}</p>
                  )}
                  <p className="text-xs text-muted-foreground mt-1">
                    You'll receive order notifications via SMS
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Portfolio URL</label>
                  {isEditing ? (
                    <Input
                      value={profile.portfolio_url}
                      onChange={(e) => setProfile({ ...profile, portfolio_url: e.target.value })}
                    />
                  ) : (
                    <p className="text-foreground">{profile.portfolio_url || 'Not provided'}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Design Background</label>
                  {isEditing ? (
                    <Textarea
                      value={profile.design_background}
                      onChange={(e) => setProfile({ ...profile, design_background: e.target.value })}
                      className="min-h-[100px]"
                    />
                  ) : (
                    <p className="text-foreground whitespace-pre-wrap">{profile.design_background}</p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Furniture Interests</label>
                  {isEditing ? (
                    <Textarea
                      value={profile.furniture_interests}
                      onChange={(e) => setProfile({ ...profile, furniture_interests: e.target.value })}
                      className="min-h-[80px]"
                    />
                  ) : (
                    <p className="text-foreground whitespace-pre-wrap">{profile.furniture_interests}</p>
                  )}
                </div>

                <div className="pt-4 border-t">
                  <p className="text-xs text-muted-foreground">
                    This information is displayed on the creator leaderboard and your public profile
                  </p>
                </div>
              </CardContent>
            </Card>
  );
};

export default CreatorProfile;