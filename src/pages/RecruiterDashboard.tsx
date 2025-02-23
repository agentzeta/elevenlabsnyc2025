import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type Application = Database['public']['Tables']['applications']['Row'];
type Job = Database['public']['Tables']['jobs']['Row'];

export default function RecruiterDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const [jobsResponse, applicationsResponse] = await Promise.all([
        supabase.from('jobs').select('*'),
        supabase.from('applications').select('*')
      ]);

      if (jobsResponse.error) throw jobsResponse.error;
      if (applicationsResponse.error) throw applicationsResponse.error;

      setJobs(jobsResponse.data || []);
      setApplications(applicationsResponse.data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Recruiter Dashboard</h1>
      
      {jobs.map(job => (
        <div key={job.id} className="mb-8">
          <h2 className="text-xl font-semibold mb-4">{job.title}</h2>
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {applications
              .filter(app => app.job_id === job.id)
              .map(application => (
                <Card key={application.id}>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      Application #{application.id.slice(0, 8)}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Status</span>
                        <span className="font-medium">{application.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Assessment Score</span>
                        <span className="font-medium">
                          {application.assessment_score || 'N/A'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Reference Check</span>
                        <span className={`font-medium ${
                          application.reference_verified
                            ? 'text-green-600'
                            : 'text-yellow-600'
                        }`}>
                          {application.reference_verified ? 'Verified' : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
