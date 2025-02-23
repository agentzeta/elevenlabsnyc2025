
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Mail, User } from "lucide-react";

interface UserProfile {
  id: string;
  email?: string;
  avatar_url?: string;
  full_name?: string;
  role?: 'recruiter' | 'candidate';
}

export default function Index() {
  const navigate = useNavigate();
  const [selectedRole, setSelectedRole] = useState<'recruiter' | 'candidate'>('candidate');
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (!error) {
          setUserProfile({
            id: session.user.id,
            email: session.user.email,
            avatar_url: profileData?.avatar_url,
            full_name: profileData?.full_name,
            role: profileData?.role
          });
        }
      }
    };
    checkUser();
  }, [navigate]);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/recruiter-dashboard`,
          queryParams: {
            role: selectedRole,
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error('Login Error:', error);
    }
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserProfile(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Header */}
      <header className="relative z-10">
        <nav className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-primary p-2 rounded-lg">
                <User className="h-6 w-6 text-white" />
              </div>
              <span className="font-bold text-xl">Talented AI</span>
            </div>
            {userProfile && (
              <Button variant="outline" onClick={handleSignOut}>
                Sign Out
              </Button>
            )}
          </div>
        </nav>
      </header>

      {/* Main Content */}
      <main className="relative">
        {/* Background decorative elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-32 w-96 h-96 rounded-full bg-primary/5" />
          <div className="absolute top-20 -left-40 w-96 h-96 rounded-full bg-primary/5" />
        </div>

        {/* Content */}
        <div className="container mx-auto px-6 pt-20 pb-32">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left column */}
            <div className="space-y-8">
              {userProfile ? (
                <Card className="w-full max-w-md mx-auto bg-white/80 backdrop-blur-sm">
                  <CardHeader className="pb-4">
                    <div className="flex items-center space-x-4">
                      <Avatar className="h-16 w-16">
                        <AvatarImage src={userProfile.avatar_url || ''} />
                        <AvatarFallback>
                          {userProfile.full_name
                            ?.split(' ')
                            .map(n => n[0])
                            .join('')
                            .toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h2 className="text-2xl font-semibold">{userProfile.full_name || 'User'}</h2>
                        <p className="text-muted-foreground capitalize">{userProfile.role || 'User'}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-2 text-sm">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span>{userProfile.email}</span>
                    </div>
                    <div className="pt-4">
                      <Button 
                        className="w-full"
                        onClick={() => navigate(userProfile.role === 'recruiter' ? '/recruiter-dashboard' : '/jobs')}
                      >
                        Go to Dashboard
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <>
                  <div className="space-y-6">
                    <h1 className="text-5xl font-bold leading-tight">
                      Transforming Talent Acquisition with AI
                    </h1>
                    <p className="text-2xl font-semibold text-primary">
                      The Secret Behind Every Successful Company? Exceptional Talent.
                    </p>
                    <div className="space-y-6 text-xl text-gray-600">
                      <p className="leading-relaxed">
                        For Companies: Discover and attract top talent with our AI-powered platform that understands your unique needs.
                      </p>
                      <p className="leading-relaxed">
                        For Job Seekers: Take the next step in your career journey with personalized opportunities that match your potential.
                      </p>
                    </div>
                  </div>
                  
                  {/* Login Form */}
                  <div className="max-w-md space-y-6 bg-white/80 backdrop-blur-sm p-8 rounded-2xl shadow-lg border border-gray-100">
                    <h2 className="text-2xl font-semibold">Begin Your Journey</h2>
                    <div className="space-y-4">
                      <div className="space-y-3">
                        <Label className="text-base">I am a...</Label>
                        <RadioGroup
                          value={selectedRole}
                          onValueChange={(value: 'recruiter' | 'candidate') => setSelectedRole(value)}
                          className="grid grid-cols-2 gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="candidate" id="candidate" />
                            <Label htmlFor="candidate">Job Seeker</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="recruiter" id="recruiter" />
                            <Label htmlFor="recruiter">Recruiter</Label>
                          </div>
                        </RadioGroup>
                      </div>
                      <Button 
                        className="w-full"
                        onClick={handleGoogleLogin}
                      >
                        Continue with Google
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Right column - Features */}
            <div className="space-y-8 lg:pl-12">
              <div className="grid gap-6">
                <FeatureCard 
                  title="AI-Powered Matching"
                  description="Our sophisticated AI algorithms ensure perfect alignment between talent and opportunities, revolutionizing how connections are made."
                />
                <FeatureCard 
                  title="Smart Video Interviews"
                  description="Transform your hiring process with AI-analyzed video interviews that reveal true potential beyond the resume."
                />
                <FeatureCard 
                  title="Intelligent Assessment"
                  description="Make data-driven decisions with our comprehensive AI evaluation system that identifies the best matches for your organization."
                />
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="bg-white/80 backdrop-blur-sm p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <h3 className="font-semibold text-lg mb-2">{title}</h3>
      <p className="text-gray-600">{description}</p>
    </div>
  );
}
