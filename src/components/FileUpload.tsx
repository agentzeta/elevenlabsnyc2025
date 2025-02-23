
import { useState } from 'react';
import { Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface FileUploadProps {
  onProcessed: (data: {
    title: string;
    description: string;
    good_candidate_attributes?: string;
    bad_candidate_attributes?: string;
    essential_attributes?: string[];
  }) => void;
}

export function FileUpload({ onProcessed }: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);

      // Upload the file to Supabase storage
      const timestamp = new Date().getTime();
      const sanitizedFileName = file.name.replace(/[^\x00-\x7F]/g, '');
      const filePath = `job-documents/${timestamp}_${sanitizedFileName}`;

      const { error: uploadError } = await supabase.storage
        .from('job-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Process it using the edge function
      const { data, error } = await supabase.functions.invoke('process-job-document', {
        body: { filePath }
      });

      if (error) throw error;

      if (!data?.description) {
        throw new Error('No content extracted from document');
      }

      onProcessed({
        title: data.title,
        description: data.description,
        good_candidate_attributes: data.good_candidate_attributes,
        bad_candidate_attributes: data.bad_candidate_attributes,
        essential_attributes: data.essential_attributes || []
      });

      toast({
        title: "Success",
        description: "Job description processed successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex items-center space-x-2">
      <input
        type="file"
        accept=".pdf,.doc,.docx,.html,.htm"
        onChange={handleFileChange}
        className="hidden"
        id="file-upload"
      />
      <Button
        type="button"
        variant="outline"
        disabled={uploading}
        onClick={() => document.getElementById('file-upload')?.click()}
      >
        {uploading ? (
          "Processing..."
        ) : (
          <>
            <Upload className="h-4 w-4 mr-2" />
            Upload JD
          </>
        )}
      </Button>
    </div>
  );
}
