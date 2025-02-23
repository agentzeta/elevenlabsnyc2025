
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";
import { Loader2 } from "lucide-react";

interface Job {
  id: string;
  title: string;
  description: string;
  created_at: string;
  company_name?: string;
  location?: string;
  status: 'draft' | 'published' | 'archived';
  recruiter_id: string;
}

export default function Jobs() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const { data: jobsData, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', jobsData?.map(job => job.recruiter_id) || []);

      if (profilesError) throw profilesError;

      // Combine jobs with company names from profiles
      const jobsWithCompanyNames = jobsData?.map(job => ({
        ...job,
        company_name: profiles?.find(profile => profile.id === job.recruiter_id)?.full_name || 'Unknown Company'
      })) || [];

      setJobs(jobsWithCompanyNames);
    } catch (error: any) {
      toast({
        title: "Error fetching jobs",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Available Positions</h1>
          <p className="text-muted-foreground mt-2">
            Explore our current job openings and find your next opportunity
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {jobs.map((job) => (
            <Card 
              key={job.id} 
              className="flex flex-col cursor-pointer hover:shadow-lg transition-shadow"
              onClick={() => navigate(`/public/jobs/${job.id}`)}
            >
              <CardHeader>
                <CardTitle className="line-clamp-2">{job.title}</CardTitle>
                <CardDescription>
                  {job.company_name && (
                    <span className="block">{job.company_name}</span>
                  )}
                  {job.location && (
                    <span className="text-sm text-muted-foreground">{job.location}</span>
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                  {job.description}
                </p>
                <Button className="w-full">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}

          {jobs.length === 0 && (
            <div className="col-span-full text-center py-12">
              <p className="text-muted-foreground">No jobs available at the moment.</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
