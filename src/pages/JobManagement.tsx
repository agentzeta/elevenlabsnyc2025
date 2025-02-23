import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Briefcase, Share2, PenSquare, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";

type Job = {
  id: string;
  title: string;
  description: string;
  status: "draft" | "published" | "archived";
  created_at: string;
};

export default function JobManagement() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchJobs();
  }, []);

  async function fetchJobs() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("jobs")
        .select("*")
        .eq("recruiter_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setJobs(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching jobs",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  const handleShare = (jobId: string) => {
    const url = `${window.location.origin}/public/jobs/${jobId}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied",
      description: "Job link has been copied to clipboard",
    });
  };

  const handleUnpublish = async (jobId: string) => {
    try {
      const { error } = await supabase
        .from("jobs")
        .update({ status: "draft" })
        .eq("id", jobId);

      if (error) throw error;

      setJobs(
        jobs.map((job) =>
          job.id === jobId ? { ...job, status: "draft" } : job
        )
      );

      toast({
        title: "Job unpublished",
        description: "The job has been unpublished successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error unpublishing job",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (jobId: string) => {
    try {
      const { error } = await supabase.from("jobs").delete().eq("id", jobId);

      if (error) throw error;

      setJobs(jobs.filter((job) => job.id !== jobId));
      toast({
        title: "Job deleted",
        description: "The job has been deleted successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error deleting job",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const content = loading ? (
    <div className="flex justify-center items-center min-h-[calc(100vh-4rem)]">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
    </div>
  ) : (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold">Job Listings</h1>
          <p className="text-muted-foreground mt-1">Manage your job postings</p>
        </div>
        <Button onClick={() => navigate("/jobs/new")}>Create New Job</Button>
      </div>

      {jobs.map((job) => (
        <Card
          key={job.id}
          className="mb-4"
          onClick={() => navigate(`/jobs/${job.id}`)}
        >
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-xl mb-2">{job.title}</CardTitle>
                <span
                  className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    job.status === "published"
                      ? "bg-green-100 text-green-800"
                      : job.status === "draft"
                      ? "bg-yellow-100 text-yellow-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                </span>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleShare(job.id)}
                >
                  <Share2 className="h-4 w-4 mr-1" />
                  Share Link
                </Button>
                {job.status === "published" && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUnpublish(job.id)}
                  >
                    Unpublish
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigate(`/jobs/${job.id}/edit`)}
                >
                  <PenSquare className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(job.id)}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Delete
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {job.description.substring(0, 200)}...
            </p>
          </CardContent>
        </Card>
      ))}

      {jobs.length === 0 && (
        <div className="text-center py-12">
          <Briefcase className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-4 text-lg font-semibold">No jobs posted yet</h3>
          <p className="mt-2 text-muted-foreground">
            Get started by creating your first job posting
          </p>
          <Button onClick={() => navigate("/jobs/new")} className="mt-4">
            Create Job
          </Button>
        </div>
      )}
    </div>
  );

  return <DashboardLayout>{content}</DashboardLayout>;
}
