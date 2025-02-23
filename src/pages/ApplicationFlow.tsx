import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, RotateCcw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { ResumeUpload } from "@/components/application/ResumeUpload";
import { VideoRecorder } from "@/components/application/VideoRecorder";
import { AIInterview } from "@/components/application/AIInterview";
import { ApplicationStep } from "@/types/application";
import { AppHeader } from "@/components/shared/AppHeader";
import { Button } from "@/components/ui/button";

export default function ApplicationFlow() {
  const { id: jobId } = useParams<{ id: string }>();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<ApplicationStep>('resume');
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [existingApplication, setExistingApplication] = useState<any>(null);

  useEffect(() => {
    const checkAuthAndLoadApplication = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (!session) {
          toast({
            title: "Authentication required",
            description: "Please sign in to apply for this position",
            variant: "destructive",
          });
          navigate('/auth');
          return;
        }

        const userId = session.user.id;
        setUserId(userId);

        if (!jobId) {
          toast({
            title: "Error",
            description: "Invalid job ID",
            variant: "destructive",
          });
          navigate('/');
          return;
        }

        const { data: applications, error } = await supabase
          .from('applications')
          .select('*')
          .eq('job_id', jobId)
          .eq('candidate_id', userId)
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) throw error;

        const application = applications?.[0];
        if (application) {
          console.log('Found existing application:', application);
          setExistingApplication(application);
          setApplicationId(application.id);
          toast({
            title: "Existing Application Found",
            description: "Continuing your previous application",
          });
          
          if (application.status === 'video_processed' || 
              application.status === 'video_uploaded' || 
              application.status === 'interview_started' ||
              application.status === 'interview_completed') {
            setCurrentStep('interview');
          } else if (application.status === 'resume_uploaded') {
            setCurrentStep('video');
          }
        }
      } catch (error: any) {
        console.error('Error in initialization:', error);
        toast({
          title: "Error",
          description: error.message || "Failed to initialize application",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
        setIsInitialized(true);
      }
    };

    checkAuthAndLoadApplication();
  }, [jobId, navigate, toast]);

  const isApplicationCompleted = existingApplication?.status === 'interview_completed';

  const handleRestart = async () => {
    if (!jobId || !userId) return;
    
    try {
      const { data: newApplication, error } = await supabase
        .from('applications')
        .insert({
          job_id: jobId,
          candidate_id: userId,
          status: 'in_progress'
        })
        .select()
        .single();

      if (error) throw error;

      setApplicationId(newApplication.id);
      setCurrentStep('resume');
      setExistingApplication(null);
      
      toast({
        title: "Application Restarted",
        description: "You can now submit a new application",
      });
    } catch (error: any) {
      console.error('Error restarting application:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to restart application",
        variant: "destructive",
      });
    }
  };

  if (!isInitialized || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="container mx-auto p-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>
                {isApplicationCompleted ? 'Application Submitted' : (existingApplication ? 'Continue Your Application' : 'Start Your Application')}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isApplicationCompleted ? (
                <div className="text-center space-y-4 py-8">
                  <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto" />
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-gray-900">Thank you for completing your interview!</h3>
                    <p className="text-gray-600">
                      Your answers have been submitted. We will review your application and let you know if you have been selected for this role.
                    </p>
                  </div>
                </div>
              ) : (
                <>
                  <div className={`space-y-4 ${currentStep !== 'resume' ? 'opacity-50' : ''}`}>
                    <h3 className="font-semibold flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">1</span>
                      {existingApplication?.resume_path ? 'Update Your Resume' : 'Upload Your Resume'}
                    </h3>
                    {currentStep === 'resume' && jobId && userId && (
                      <ResumeUpload
                        jobId={jobId}
                        userId={userId}
                        onUploadComplete={(id) => {
                          setApplicationId(id);
                          setCurrentStep('video');
                        }}
                      />
                    )}
                  </div>

                  <div className={`space-y-4 ${currentStep !== 'video' ? 'opacity-50' : ''}`}>
                    <h3 className="font-semibold flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">2</span>
                      {existingApplication?.video_path ? 'Update Video Introduction' : 'Record Video Introduction'}
                    </h3>
                    {currentStep === 'video' && applicationId && (
                      <VideoRecorder
                        applicationId={applicationId}
                        onRecordingComplete={() => setCurrentStep('interview')}
                      />
                    )}
                  </div>

                  <div className={`space-y-4 ${currentStep !== 'interview' ? 'opacity-50' : ''}`}>
                    <h3 className="font-semibold flex items-center gap-2">
                      <span className="bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center text-sm">3</span>
                      {existingApplication?.interview_transcript ? 'Continue AI Interview' : 'Start AI Interview'}
                    </h3>
                    {currentStep === 'interview' && applicationId && jobId && (
                      <AIInterview
                        applicationId={applicationId}
                        jobId={jobId}
                        onInterviewStart={() => {
                          toast({
                            title: "Interview started",
                            description: "The AI interviewer will now assess your application",
                          });
                        }}
                      />
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {(existingApplication || isApplicationCompleted) && (
            <div className="fixed bottom-6 right-6">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRestart}
                className="shadow-lg hover:shadow-xl transition-shadow"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Start New Application
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
