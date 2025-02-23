import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { AppHeader } from "@/components/shared/AppHeader";

type Job = {
  id: string;
  title: string;
  description: string;
  status: 'draft' | 'published' | 'archived';
  created_at: string;
  essential_attributes: string[];
  good_candidate_attributes: string | null;
  bad_candidate_attributes: string | null;
};

export default function PublicJobView() {
  const { id } = useParams<{ id: string }>();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  async function fetchJobDetails() {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .eq('status', 'published')
        .single();

      if (error) throw error;
      setJob(data as Job);
    } catch (error: any) {
      toast({
        title: "Error fetching job details",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <AppHeader />
        <div className="container mx-auto p-6">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-2xl font-bold mb-4">Job Not Found</h1>
            <p className="text-muted-foreground">
              This job posting may have been removed or is no longer available.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AppHeader />
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>{job.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <h3 className="font-semibold">Description</h3>
                <div className="prose prose-sm max-w-none">
                  <ReactMarkdown>{job.description}</ReactMarkdown>
                </div>
              </div>

              <div className="space-y-2">
                <h3 className="font-semibold">Essential Requirements</h3>
                <div className="text-sm">
                  {job.essential_attributes?.map((attr, index) => (
                    <div key={index} className="mb-1">• {attr}</div>
                  ))}
                </div>
              </div>

              {job.good_candidate_attributes && (
                <div className="space-y-2">
                  <h3 className="font-semibold">What Makes a Good Candidate</h3>
                  <div className="prose prose-sm max-w-none">
                    <ReactMarkdown>{job.good_candidate_attributes}</ReactMarkdown>
                  </div>
                </div>
              )}

              <div className="flex justify-center mt-6">
                <Button
                  size="lg"
                  onClick={() => navigate(`/public/jobs/${job.id}/apply`)}
                >
                  Apply for this Position
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
