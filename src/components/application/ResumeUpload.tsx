
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Upload, Loader2, FileText, PenSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { ResumeBuilder } from "./ResumeBuilder";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface ResumeUploadProps {
  jobId: string;
  userId: string;
  onUploadComplete: (applicationId: string) => void;
}

export function ResumeUpload({ jobId, userId, onUploadComplete }: ResumeUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [generatedResume, setGeneratedResume] = useState<string | null>(null);
  const { toast } = useToast();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !userId || !jobId) return;
    await uploadResume(file);
  };

  const handleGeneratedResume = async () => {
    if (!generatedResume || !userId || !jobId) return;
    
    try {
      setIsUploading(true);
      
      // Convert markdown to a file
      const blob = new Blob([generatedResume], { type: 'text/markdown' });
      const file = new File([blob], 'generated-resume.md', { type: 'text/markdown' });
      
      await uploadResume(file);
    } catch (error) {
      console.error('Error submitting generated resume:', error);
      toast({
        title: "Error submitting resume",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const uploadResume = async (file: File) => {
    try {
      setIsUploading(true);
      
      const { data: newApplication, error: createError } = await supabase
        .from('applications')
        .insert({
          job_id: jobId,
          candidate_id: userId,
          status: 'in_progress'
        })
        .select()
        .single();

      if (createError) throw createError;
      if (!newApplication) throw new Error('Failed to create application');
      
      const currentApplicationId = newApplication.id;

      const timestamp = new Date().getTime();
      const sanitizedFileName = file.name.replace(/[^\x00-\x7F]/g, '');
      const filePath = `${currentApplicationId}/resume/${timestamp}_${sanitizedFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('applications')
        .upload(filePath, file, {
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: 'resume_uploaded',
          resume_path: filePath
        })
        .eq('id', currentApplicationId);

      if (updateError) throw updateError;

      const { error: analysisError } = await supabase.functions
        .invoke('analyze-resume', {
          body: { resumePath: filePath, applicationId: currentApplicationId }
        });

      if (analysisError) {
        console.error('Error analyzing resume:', analysisError);
        toast({
          title: "Resume uploaded",
          description: "Resume was uploaded but analysis failed. You can still continue.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Resume processed successfully",
          description: "Let's move on to the video introduction",
        });
      }

      onUploadComplete(currentApplicationId);
    } catch (error) {
      console.error('Error uploading resume:', error);
      toast({
        title: "Error uploading resume",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-center justify-center border-2 border-dashed rounded-lg p-8">
        <div className="space-y-4 text-center">
          <input
            type="file"
            accept=".pdf,.doc,.docx,.html,.htm,.md"
            onChange={handleFileUpload}
            className="hidden"
            id="resume-upload"
            disabled={isUploading}
          />
          <div className="flex flex-col gap-4 items-center">
            <Button
              variant="outline"
              size="lg"
              onClick={() => document.getElementById('resume-upload')?.click()}
              disabled={isUploading}
              className="w-64"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Resume
                </>
              )}
            </Button>
            
            <div className="flex items-center gap-2">
              <div className="h-px w-24 bg-border" />
              <span className="text-sm text-muted-foreground">or</span>
              <div className="h-px w-24 bg-border" />
            </div>

            <Dialog>
              <DialogTrigger asChild>
                <Button variant="default" size="lg" className="w-64">
                  <PenSquare className="mr-2 h-4 w-4" />
                  Build Resume
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-7xl w-full max-h-screen overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Build Your Resume</DialogTitle>
                </DialogHeader>
                <div className="mt-6">
                  <ResumeBuilder 
                    onResumeGenerated={(markdown) => {
                      setGeneratedResume(markdown);
                    }} 
                  />
                  {generatedResume && (
                    <Button
                      className="w-full mt-4"
                      onClick={handleGeneratedResume}
                      disabled={isUploading}
                    >
                      {isUploading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FileText className="mr-2 h-4 w-4" />
                          Submit Resume
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
        <p className="text-sm text-muted-foreground mt-4">
          Accepted formats: PDF, DOC, DOCX, MD
        </p>
      </div>
    </div>
  );
}
