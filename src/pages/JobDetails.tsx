import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Settings2,
  Pencil,
  Upload,
  Trash2,
  Share2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/DashboardLayout";

type JobStatus = "draft" | "published" | "archived";

type Job = {
  id: string;
  title: string;
  description: string;
  status: JobStatus;
  created_at: string;
  essential_attributes: string[];
  good_candidate_attributes: string | null;
  bad_candidate_attributes: string | null;
};

export default function JobDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [job, setJob] = useState<Job | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [editedJob, setEditedJob] = useState<Job | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchJobDetails();
  }, [id]);

  async function fetchJobDetails() {
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
        .eq("id", id)
        .eq("recruiter_id", user.id)
        .single();

      if (error) throw error;
      setJob(data as Job);
      setEditedJob(data as Job);
    } catch (error: any) {
      toast({
        title: "Error fetching job details",
        description: error.message,
        variant: "destructive",
      });
      navigate("/jobs");
    } finally {
      setLoading(false);
    }
  }

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      setIsProcessing(true);

      // Upload file to Supabase storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${crypto.randomUUID()}.${fileExt}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("job-documents")
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Process the uploaded document
      const { data, error } = await supabase.functions.invoke(
        "process-job-document",
        {
          body: { filePath: uploadData.path },
        }
      );

      if (error) throw error;

      if (data) {
        setEditedJob((prev) =>
          prev
            ? {
                ...prev,
                description: data.description,
                essential_attributes: data.essential_attributes,
                good_candidate_attributes: data.good_candidate_attributes,
                bad_candidate_attributes: data.bad_candidate_attributes,
              }
            : null
        );

        toast({
          title: "Success",
          description: "Job description processed successfully",
        });
      }
    } catch (error: any) {
      console.error("Error processing document:", error);
      toast({
        title: "Error",
        description: "Failed to process document",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleSave = async () => {
    if (!editedJob) return;

    try {
      const { error } = await supabase
        .from("jobs")
        .update({
          title: editedJob.title,
          description: editedJob.description,
          status: editedJob.status,
          essential_attributes: editedJob.essential_attributes,
          good_candidate_attributes: editedJob.good_candidate_attributes,
          bad_candidate_attributes: editedJob.bad_candidate_attributes,
        })
        .eq("id", id);

      if (error) throw error;

      setJob(editedJob);
      setIsEditing(false);
      toast({
        title: "Success",
        description: "Job details updated successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error updating job",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handlePublish = async () => {
    if (!job) return;

    try {
      const newStatus: JobStatus =
        job.status === "published" ? "draft" : "published";

      const { error } = await supabase
        .from("jobs")
        .update({
          status: newStatus,
        })
        .eq("id", id);

      if (error) throw error;

      const updatedJob = { ...job, status: newStatus };
      setJob(updatedJob);
      setEditedJob(updatedJob);

      toast({
        title: "Success",
        description: `Job ${
          newStatus === "published" ? "published" : "unpublished"
        } successfully`,
      });
    } catch (error: any) {
      toast({
        title: "Error updating job status",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}/public/jobs/${id}`;
    navigator.clipboard.writeText(url);
    toast({
      title: "Link copied!",
      description: "The public job link has been copied to your clipboard.",
    });
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this job posting?"))
      return;

    try {
      const { error } = await supabase.from("jobs").delete().eq("id", id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Job deleted successfully",
      });
      navigate("/jobs");
    } catch (error: any) {
      toast({
        title: "Error deleting job",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <Button
              variant="ghost"
              onClick={() => navigate("/jobs")}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Jobs
            </Button>
            <div className="flex gap-2">
              {job.status === "published" && (
                <Button variant="outline" onClick={copyPublicLink}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share Link
                </Button>
              )}
              <Button
                variant={job.status === "published" ? "outline" : "default"}
                onClick={handlePublish}
              >
                {job.status === "published" ? "Unpublish" : "Publish"}
              </Button>
              {isEditing ? (
                <>
                  <Button onClick={handleSave}>Save Changes</Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setEditedJob(job);
                      setIsEditing(false);
                    }}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setIsEditing(true)}>
                    <Pencil className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings2 className="h-5 w-5" />
                Job Settings
                {isProcessing && (
                  <span className="text-sm font-normal text-muted-foreground ml-2">
                    Processing document...
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditing && (
                <div className="space-y-2 mb-6">
                  <Label>Upload Revised Job Description</Label>
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
                      onClick={() =>
                        document.getElementById("file-upload")?.click()
                      }
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
                    <span className="text-sm text-muted-foreground">
                      Supported: PDF, DOC, DOCX, HTML
                    </span>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label>Status</Label>
                {isEditing ? (
                  <Select
                    value={editedJob?.status}
                    onValueChange={(value: JobStatus) =>
                      setEditedJob((prev) =>
                        prev ? { ...prev, status: value } : null
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <div className="text-sm">
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Job Title</Label>
                {isEditing ? (
                  <Input
                    value={editedJob?.title}
                    onChange={(e) =>
                      setEditedJob((prev) =>
                        prev ? { ...prev, title: e.target.value } : null
                      )
                    }
                  />
                ) : (
                  <div className="text-sm">{job.title}</div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Description</Label>
                {isEditing ? (
                  <Textarea
                    value={editedJob?.description}
                    onChange={(e) =>
                      setEditedJob((prev) =>
                        prev ? { ...prev, description: e.target.value } : null
                      )
                    }
                    className="min-h-[200px]"
                  />
                ) : (
                  <div className="text-sm whitespace-pre-wrap">
                    {job.description}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Essential Attributes</Label>
                {isEditing ? (
                  <Textarea
                    value={editedJob?.essential_attributes?.join("\n") || ""}
                    onChange={(e) =>
                      setEditedJob((prev) =>
                        prev
                          ? {
                              ...prev,
                              essential_attributes: e.target.value
                                .split("\n")
                                .filter(Boolean),
                            }
                          : null
                      )
                    }
                    placeholder="Enter each attribute on a new line"
                  />
                ) : (
                  <div className="text-sm">
                    {job.essential_attributes?.map((attr, index) => (
                      <div key={index} className="mb-1">
                        • {attr}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Good Candidate Attributes</Label>
                {isEditing ? (
                  <Textarea
                    value={editedJob?.good_candidate_attributes || ""}
                    onChange={(e) =>
                      setEditedJob((prev) =>
                        prev
                          ? {
                              ...prev,
                              good_candidate_attributes: e.target.value,
                            }
                          : null
                      )
                    }
                  />
                ) : (
                  <div className="text-sm whitespace-pre-wrap">
                    {job.good_candidate_attributes}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label>Bad Candidate Attributes</Label>
                {isEditing ? (
                  <Textarea
                    value={editedJob?.bad_candidate_attributes || ""}
                    onChange={(e) =>
                      setEditedJob((prev) =>
                        prev
                          ? {
                              ...prev,
                              bad_candidate_attributes: e.target.value,
                            }
                          : null
                      )
                    }
                  />
                ) : (
                  <div className="text-sm whitespace-pre-wrap">
                    {job.bad_candidate_attributes}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
