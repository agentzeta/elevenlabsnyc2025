import { useState, useEffect } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileText,
  Users,
  CirclePercent,
  Video,
  MessageSquare,
  Target,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";
import type { ApplicationData } from "@/types/application";
import DashboardLayout from "./DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ReactMarkdown from "react-markdown";

type Application = Database["public"]["Tables"]["applications"]["Row"];
type Job = Database["public"]["Tables"]["jobs"]["Row"];
type Profile = Database["public"]["Tables"]["profiles"]["Row"];

interface ApplicationWithProfile extends Application {
  profiles: Profile;
}

interface ModalContent {
  type: "resume" | "video" | "interview";
  applicationData: {
    resume_path?: string;
    video_path?: string;
    ai_analysis?: any;
    video_analysis?: any;
    interview_transcript?: string;
  };
}

export default function RecruiterDashboard() {
  const [applications, setApplications] = useState<ApplicationWithProfile[]>(
    []
  );
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalContent, setModalContent] = useState<ModalContent | null>(null);
  const [signedUrls, setSignedUrls] = useState<{ [key: string]: string }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const [jobsResponse, applicationsResponse] = await Promise.all([
        supabase.from("jobs").select("*").eq("recruiter_id", user.id),
        supabase.from("applications").select(`
            *,
            profiles (*)
          `),
      ]);

      if (jobsResponse.error) throw jobsResponse.error;
      if (applicationsResponse.error) throw applicationsResponse.error;

      setJobs(jobsResponse.data || []);
      setApplications(applicationsResponse.data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching data",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  function getAIScore(aiAnalysis: ApplicationData["ai_analysis"]) {
    if (!aiAnalysis || typeof aiAnalysis !== "object") return "N/A";
    const score = (aiAnalysis as any).overall_score;
    return score ? `${Math.round(score * 100)}%` : "N/A";
  }

  function getInterviewScore(assessment_score: number | null) {
    if (assessment_score === null) return "N/A";
    return `${Math.round(assessment_score)}%`;
  }

  function getScoreColor(scoreStr: string) {
    if (scoreStr === "N/A") return "text-gray-400";
    const score = parseInt(scoreStr);
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  }

  async function getFileUrl(filePath: string): Promise<string | null> {
    try {
      if (signedUrls[filePath]) {
        return signedUrls[filePath];
      }

      const { data, error } = await supabase.storage
        .from("applications")
        .createSignedUrl(filePath, 3600); // 1 hour expiry

      if (error) throw error;

      setSignedUrls((prev) => ({
        ...prev,
        [filePath]: data.signedUrl,
      }));

      return data.signedUrl;
    } catch (error) {
      console.error("Error getting file URL:", error);
      return null;
    }
  }

  function formatAnalysisContent(
    content: any,
    type: "resume" | "video" | "interview"
  ): JSX.Element {
    if (!content) return <p>No analysis available</p>;

    if (type === "video") {
      try {
        const parsedContent = typeof content === 'string' ? JSON.parse(content) : content;
        return (
          <div className="space-y-4 bg-white rounded-lg p-6">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Motivation</h3>
              <p className="mt-1 text-sm text-gray-600">{parsedContent.motivation}</p>
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Experience Summary</h3>
              <p className="mt-1 text-sm text-gray-600">{parsedContent.experience_summary}</p>
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Communication Score</h3>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 w-full bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${parsedContent.communication_score}%` }}
                  />
                </div>
                <span className="text-sm font-medium">{parsedContent.communication_score}%</span>
              </div>
            </div>
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700">Key Strengths</h3>
              <ul className="mt-1 list-disc pl-4">
                {parsedContent.key_strengths.map((strength: string, index: number) => (
                  <li key={index} className="text-sm text-gray-600">{strength}</li>
                ))}
              </ul>
            </div>
          </div>
        );
      } catch (error) {
        console.error('Error parsing video analysis:', error);
        return <p>Error displaying video analysis</p>;
      }
    }

    if (type === "resume") {
      const formattedContent = Object.entries(content).map(([key, value]) => {
        const formattedKey = key
          .split("_")
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(" ");

        if (typeof value === "number") {
          return (
            <div key={key} className="mb-4">
              <h3 className="text-sm font-semibold text-gray-700">
                {formattedKey}
              </h3>
              <div className="mt-1 flex items-center gap-2">
                <div className="h-2 w-full bg-gray-200 rounded-full">
                  <div
                    className="h-2 bg-blue-500 rounded-full"
                    style={{ width: `${Math.round(value * 100)}%` }}
                  />
                </div>
                <span className="text-sm font-medium">
                  {Math.round(value * 100)}%
                </span>
              </div>
            </div>
          );
        }

        return (
          <div key={key} className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700">
              {formattedKey}
            </h3>
            <div className="mt-1 text-sm text-gray-600">
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mt-1">{children}</p>,
                  ul: ({ children }) => (
                    <ul className="list-disc pl-4 mt-2">{children}</ul>
                  ),
                  li: ({ children }) => <li className="mt-1">{children}</li>,
                }}
              >
                {String(value)}
              </ReactMarkdown>
            </div>
          </div>
        );
      });

      return (
        <div className="space-y-4 bg-white rounded-lg p-6">
          {formattedContent}
        </div>
      );
    } else {
      return (
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown
            components={{
              p: ({ children }) => <p className="mt-2">{children}</p>,
              ul: ({ children }) => (
                <ul className="list-disc pl-4 mt-2">{children}</ul>
              ),
              li: ({ children }) => <li className="mt-1">{children}</li>,
            }}
          >
            {String(content)}
          </ReactMarkdown>
        </div>
      );
    }
  }

  function getStatusBadgeColor(status: string) {
    switch (status.toLowerCase()) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "interviewed":
        return "bg-blue-100 text-blue-800";
      case "accepted":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  }

  const hasInterviewData = (application: ApplicationWithProfile) => {
    return application.interview_transcript || application.interview_feedback;
  };

  const content = loading ? (
    <div className="flex justify-center items-center min-h-screen">
      <p className="text-lg">Loading dashboard...</p>
    </div>
  ) : (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-8">Recruiter Dashboard</h1>

      {jobs.map((job) => {
        const jobApplications = applications.filter(
          (app) => app.job_id === job.id
        );

        return (
          <div key={job.id} className="mb-10">
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-6 w-6" />
              <h2 className="text-2xl font-semibold">{job.title}</h2>
              <Badge variant="secondary">
                {jobApplications.length} candidate
                {jobApplications.length !== 1 ? "s" : ""}
              </Badge>
            </div>

            <div className="bg-white rounded-lg shadow">
              {jobApplications.map((application, index) => (
                <div key={application.id}>
                  {index > 0 && <Separator />}
                  <div className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <Avatar>
                          <AvatarImage
                            src={application.profiles?.avatar_url || ""}
                            alt={application.profiles?.full_name || "Avatar"}
                          />
                          <AvatarFallback>
                            {application.profiles?.full_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .toUpperCase() || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-semibold">
                            {application.profiles?.full_name ||
                              "Anonymous Candidate"}
                          </h3>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge
                              className={getStatusBadgeColor(
                                application.status
                              )}
                            >
                              {application.status}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                              Applied{" "}
                              {new Date(
                                application.created_at
                              ).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {application.resume_path && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const signedUrl = await getFileUrl(
                                application.resume_path!
                              );
                              if (signedUrl) {
                                setModalContent({
                                  type: "resume",
                                  applicationData: {
                                    resume_path: signedUrl,
                                    ai_analysis: application.ai_analysis,
                                  },
                                });
                              } else {
                                toast({
                                  title: "Error",
                                  description: "Could not access resume file",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Resume
                          </Button>
                        )}
                        {application.video_path && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={async () => {
                              const signedUrl = await getFileUrl(
                                application.video_path!
                              );
                              if (signedUrl) {
                                setModalContent({
                                  type: "video",
                                  applicationData: {
                                    video_path: signedUrl,
                                    ai_analysis: application.ai_analysis,
                                  },
                                });
                              } else {
                                toast({
                                  title: "Error",
                                  description: "Could not access video file",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            <Video className="h-4 w-4 mr-1" />
                            Video
                          </Button>
                        )}
                        {hasInterviewData(application) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              setModalContent({
                                type: "interview",
                                applicationData: {
                                  interview_transcript:
                                    application.interview_transcript,
                                  ai_analysis: application.interview_feedback,
                                },
                              })
                            }
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            Interview
                          </Button>
                        )}
                      </div>
                    </div>

                    <div className="mt-4 flex items-center gap-6">
                      <div
                        className="flex items-center gap-2"
                        title="Resume Analysis Score"
                      >
                        <CirclePercent className={`h-5 w-5 ${getScoreColor(getAIScore(application.ai_analysis))}`} />
                        <span className="font-medium">
                          {getAIScore(application.ai_analysis)}
                        </span>
                      </div>
                      {application.assessment_score !== null && (
                        <div
                          className="flex items-center gap-2"
                          title="Interview Score"
                        >
                          <Target className={`h-5 w-5 ${getScoreColor(getInterviewScore(application.assessment_score))}`} />
                          <span className="font-medium">
                            {getInterviewScore(application.assessment_score)}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}

      <Dialog open={!!modalContent} onOpenChange={() => setModalContent(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {modalContent?.type === "resume" && "Resume Review"}
              {modalContent?.type === "video" && "Video Review"}
              {modalContent?.type === "interview" && "Interview Details"}
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {modalContent?.type === "resume" && (
              <Tabs defaultValue="resume">
                <TabsList>
                  <TabsTrigger value="resume">Resume</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                </TabsList>
                <TabsContent value="resume" className="mt-4">
                  <iframe
                    src={modalContent.applicationData.resume_path}
                    className="w-full h-[60vh] rounded-lg border"
                    title="Resume Preview"
                  />
                </TabsContent>
                <TabsContent value="analysis" className="mt-4">
                  <div className="bg-gray-50 rounded-lg">
                    {formatAnalysisContent(
                      modalContent.applicationData.ai_analysis,
                      "resume"
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {modalContent?.type === "video" && (
              <Tabs defaultValue="video">
                <TabsList>
                  <TabsTrigger value="video">Video</TabsTrigger>
                  <TabsTrigger value="analysis">Analysis</TabsTrigger>
                </TabsList>
                <TabsContent value="video" className="mt-4">
                  <video controls className="w-full rounded-lg">
                    <source
                      src={modalContent.applicationData.video_path}
                      type="video/webm"
                    />
                    Your browser does not support the video tag.
                  </video>
                </TabsContent>
                <TabsContent value="analysis" className="mt-4">
                  <div className="prose prose-sm max-w-none p-6 bg-gray-50 rounded-lg">
                    {formatAnalysisContent(
                      modalContent.applicationData.video_analysis,
                      "video"
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}

            {modalContent?.type === "interview" && (
              <Tabs defaultValue="analysis">
                <TabsList>
                  <TabsTrigger value="analysis">Interview Analysis</TabsTrigger>
                  <TabsTrigger value="transcript">Raw Transcript</TabsTrigger>
                </TabsList>
                <TabsContent value="analysis" className="mt-4">
                  {formatAnalysisContent(
                    modalContent.applicationData.ai_analysis,
                    "interview"
                  )}
                </TabsContent>
                <TabsContent value="transcript" className="mt-4">
                  <div className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-6 rounded-lg">
                    {formatAnalysisContent(
                      modalContent.applicationData.interview_transcript,
                      "interview"
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );

  return <DashboardLayout>{content}</DashboardLayout>;
}
