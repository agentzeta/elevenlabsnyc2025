
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export default function Auth() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [selectedRole, setSelectedRole] = useState<'recruiter' | 'candidate'>('candidate');

  useEffect(() => {
    // Check for error parameters in URL
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error) {
      console.error('Auth Error:', { error, description: errorDescription });
      toast({
        title: "Authentication Error",
        description: errorDescription || "Failed to authenticate",
        variant: "destructive"
      });
    }

    const checkUser = async () => {
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session Error:', sessionError);
      }
      if (session) {
        navigate("/");
      }
    };
    checkUser();
  }, [navigate, toast]);

  const handleGoogleLogin = async () => {
    try {
      console.log('Starting Google login...');
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            role: selectedRole,
            access_type: 'offline',
            prompt: 'consent'
          }
        }
      });
      
      console.log('OAuth response:', { data, error });
      
      if (error) {
        console.error('OAuth Error:', error);
        throw error;
      }
    } catch (error: any) {
      console.error('Login Error:', error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-md p-6 space-y-6">
        <h1 className="text-2xl font-bold text-center gradient-text">
          Welcome to TalentTalk
        </h1>
        <p className="text-center text-muted-foreground">
          Connect with professionals and find opportunities
        </p>
        
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
            variant="outline" 
            className="w-full" 
            onClick={handleGoogleLogin}
          >
            Continue with Google
          </Button>
        </div>
      </Card>
    </div>
  );
}
