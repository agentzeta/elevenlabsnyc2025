
import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { SidebarProvider, Sidebar, SidebarContent, SidebarHeader, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarFooter } from "@/components/ui/sidebar";
import { Home, Briefcase, Settings, User, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { AppHeader } from "@/components/shared/AppHeader";

interface UserProfile {
  id: string;
  email?: string;
  avatar_url?: string;
  full_name?: string;
  role?: 'recruiter' | 'candidate';
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<'recruiter' | 'candidate'>('recruiter');

  useEffect(() => {
    fetchUserProfile();
  }, []);

  async function fetchUserProfile() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      setUserProfile({
        id: user.id,
        email: user.email,
        avatar_url: profile?.avatar_url,
        full_name: profile?.full_name,
        role: profile?.role
      });

      if (profile?.role) {
        setRole(profile.role);
      }
    } catch (error: any) {
      toast({
        title: "Error fetching profile",
        description: error.message,
        variant: "destructive"
      });
    }
  }

  const handleRoleChange = async (newRole: 'recruiter' | 'candidate') => {
    try {
      if (!userProfile?.id) return;

      const { error } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userProfile.id);

      if (error) throw error;

      setRole(newRole);
      toast({
        title: "Role Updated",
        description: `You are now viewing as a ${newRole}`,
      });

      // Redirect based on role
      if (newRole === 'recruiter') {
        navigate('/recruiter-dashboard');
      } else {
        navigate('/joblist'); // Navigate to JobList for candidates
      }
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleJobsClick = () => {
    if (role === 'recruiter') {
      navigate('/jobs');
    } else {
      navigate('/joblist');
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background to-background/80">
        <Sidebar className="border-r border-border/50">
          <AppHeader showBackButton={false} />
          <SidebarContent>
            <div className="px-4 py-4">
              <div className="space-y-4">
                {userProfile && (
                  <div className="flex items-center space-x-3 px-2">
                    <Avatar>
                      <AvatarImage src={userProfile.avatar_url || ''} />
                      <AvatarFallback>
                        {userProfile.full_name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{userProfile.full_name}</p>
                      <p className="text-xs text-muted-foreground">{userProfile.email}</p>
                    </div>
                  </div>
                )}
                <div className="px-2 py-2">
                  <Label className="text-xs font-medium">View as</Label>
                  <RadioGroup
                    value={role}
                    onValueChange={(value: 'recruiter' | 'candidate') => handleRoleChange(value)}
                    className="mt-2 space-y-1"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="recruiter" id="recruiter" />
                      <Label htmlFor="recruiter" className="text-sm">Recruiter</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="candidate" id="candidate" />
                      <Label htmlFor="candidate" className="text-sm">Job Seeker</Label>
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
            <Separator className="my-2" />
            <SidebarMenu>
              {role === 'recruiter' && (
                <SidebarMenuItem>
                  <SidebarMenuButton 
                    asChild 
                    isActive={location.pathname === '/recruiter-dashboard'}
                  >
                    <button onClick={() => navigate('/recruiter-dashboard')} className="w-full">
                      <Home className="h-4 w-4" />
                      <span>Dashboard</span>
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={location.pathname === '/jobs' || location.pathname === '/joblist'}
                >
                  <button onClick={handleJobsClick} className="w-full">
                    <Briefcase className="h-4 w-4" />
                    <span>Jobs</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>

              <SidebarMenuItem>
                <SidebarMenuButton 
                  asChild
                  isActive={location.pathname === '/settings'}
                >
                  <button onClick={() => navigate('/settings')} className="w-full">
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
          <SidebarFooter className="border-t border-border/50 p-4">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-muted-foreground hover:text-foreground"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-4 w-4" />
              Sign Out
            </Button>
          </SidebarFooter>
        </Sidebar>
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
