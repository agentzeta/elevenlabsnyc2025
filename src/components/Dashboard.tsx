import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { RoleSwitch } from './RoleSwitch';
import { Plus, User } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
} from "@/components/ui/sidebar";

type Profile = {
  id: string;
  role: 'recruiter' | 'candidate';
  full_name: string | null;
  avatar_url: string | null;
};

export function Dashboard() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    async function getProfile() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          setProfile(profile);
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, []);

  const handleRoleChange = (newRole: 'recruiter' | 'candidate') => {
    if (profile) {
      setProfile({ ...profile, role: newRole });
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  if (!profile) {
    return <div className="flex justify-center items-center min-h-screen">Profile not found</div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar>
          <SidebarHeader className="border-b px-6 py-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl">Talented AI</span>
            </div>
          </SidebarHeader>
          <SidebarContent className="p-4">
            <nav className="space-y-2">
              <RoleSwitch currentRole={profile.role} onRoleChange={handleRoleChange} />
            </nav>
          </SidebarContent>
          <SidebarFooter className="p-4 border-t">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                {profile.full_name?.charAt(0) || 'U'}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{profile.full_name || 'User'}</p>
                <p className="text-xs text-gray-500">Manage Profile</p>
              </div>
            </div>
          </SidebarFooter>
        </Sidebar>
        
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto">
            <div className="mb-8">
              <h1 className="text-2xl font-bold">Welcome{profile.full_name ? `, ${profile.full_name}` : ''}!</h1>
              <p className="text-gray-500">Here's what's happening with your account.</p>
            </div>
            
            {profile.role === 'recruiter' ? (
              <div className="grid gap-6 md:grid-cols-2">
                <Card 
                  className="cursor-pointer hover:shadow-lg transition-shadow bg-white relative overflow-hidden" 
                  onClick={() => navigate('/jobs')}
                >
                  <CardHeader>
                    <CardTitle>Job Descriptions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Manage your job listings and review candidate requirements.</p>
                    <Button
                      className="mt-4"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/create-job');
                      }}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Create New Job
                    </Button>
                  </CardContent>
                </Card>
                <Card className="cursor-pointer hover:shadow-lg transition-shadow bg-white" onClick={() => navigate('/recruiter-dashboard')}>
                  <CardHeader>
                    <CardTitle>Applications Dashboard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Review and manage candidate applications and assessments.</p>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>Find Jobs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Explore job opportunities that match your skills.</p>
                  </CardContent>
                </Card>
                <Card className="bg-white">
                  <CardHeader>
                    <CardTitle>My Applications</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Track your job applications and their status.</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
