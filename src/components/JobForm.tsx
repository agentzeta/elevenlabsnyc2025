
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Upload } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";

export function JobForm() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);
      
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Upload file to Supabase storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('job-documents')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Process the uploaded document
      const { data, error } = await supabase.functions.invoke('process-job-document', {
        body: { filePath: uploadData.path }
      });

      if (error) throw error;

      if (data.description) {
        setFormData(prev => ({
          ...prev,
          description: data.description
        }));

        toast({
          title: "Success",
          description: "Job description extracted successfully",
        });
      }
    } catch (error) {
      console.error('Error processing document:', error);
      toast({
        title: "Error",
        description: "Failed to process document",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.from('jobs').insert({
        title: formData.title,
        description: formData.description,
        recruiter_id: user.id,
        status: 'draft'
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job description created successfully",
      });

      navigate('/jobs');
    } catch (error) {
      console.error('Error creating job:', error);
      toast({
        title: "Error",
        description: "Failed to create job description",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">Create New Job Description</h1>
          <p className="text-gray-500">Fill in the details for your new job posting.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Job Title</Label>
            <Input
              id="title"
              placeholder="e.g., Senior Software Engineer"
              value={formData.title}
              onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Upload Job Description Document</Label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".pdf,.doc,.docx,.html,.htm"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button
                type="button"
                variant="outline"
                disabled={isProcessing}
                onClick={() => document.getElementById('file-upload')?.click()}
              >
                {isProcessing ? (
                  "Processing..."
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload JD
                  </>
                )}
              </Button>
              {isProcessing && <p className="text-sm text-muted-foreground">Extracting job description...</p>}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Accepted formats: PDF, DOC, DOCX, HTML
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Job Description</Label>
            <Textarea
              id="description"
              placeholder="Describe the role, requirements, and responsibilities..."
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              className="h-48"
              required
            />
          </div>

          <div className="flex gap-4">
            <Button
              type="submit"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Creating..." : "Create Job"}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/jobs')}
            >
              Cancel
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
