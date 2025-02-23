import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { DraggableAttributes } from "@/components/DraggableAttributes";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FileUpload } from "@/components/FileUpload";

const jobFormSchema = z.object({
  title: z.string()
    .min(3, "Title must be at least 3 characters")
    .max(100, "Title must not exceed 100 characters"),
  description: z.string()
    .min(50, "Description must be at least 50 characters")
    .max(2000, "Description must not exceed 2000 characters"),
  good_candidate_attributes: z.string()
    .max(1000, "Good candidate attributes must not exceed 1000 characters")
    .optional(),
  bad_candidate_attributes: z.string()
    .max(1000, "Bad candidate attributes must not exceed 1000 characters")
    .optional(),
  status: z.enum(['draft', 'published', 'archived']),
  essential_attributes: z.array(z.string()).default([]),
  llm_suggested_attributes: z.array(z.string()).default([]),
  recruiter_id: z.string()
});

type JobFormValues = z.infer<typeof jobFormSchema>;

export default function JobForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [analyzing, setAnalyzing] = useState(false);

  const form = useForm<JobFormValues>({
    resolver: zodResolver(jobFormSchema),
    defaultValues: {
      title: '',
      description: '',
      good_candidate_attributes: '',
      bad_candidate_attributes: '',
      status: 'draft',
      essential_attributes: [],
      llm_suggested_attributes: [],
      recruiter_id: '',
    },
  });

  useEffect(() => {
    if (id) {
      fetchJob();
    }
    getCurrentUser();
  }, [id]);

  async function getCurrentUser() {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      
      if (session?.user) {
        form.setValue('recruiter_id', session.user.id);
      } else {
        throw new Error("No authenticated user found");
      }
    } catch (error: any) {
      toast({
        title: "Authentication Error",
        description: "Please sign in to create or edit jobs",
        variant: "destructive"
      });
      navigate('/auth');
    }
  }

  async function fetchJob() {
    try {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      if (data) {
        const formattedData = {
          ...data,
          essential_attributes: Array.isArray(data.essential_attributes) ? data.essential_attributes : [],
          llm_suggested_attributes: Array.isArray(data.llm_suggested_attributes) ? data.llm_suggested_attributes : []
        };
        
        Object.entries(formattedData).forEach(([key, value]) => {
          form.setValue(key as keyof JobFormValues, value);
        });
      }
    } catch (error: any) {
      toast({
        title: "Error fetching job",
        description: error.message,
        variant: "destructive"
      });
      navigate('/jobs');
    }
  }

  async function analyzeCandidateAttributes(data: JobFormValues) {
    try {
      setAnalyzing(true);
      const { data: result, error } = await supabase.functions.invoke('analyze-job', {
        body: {
          title: data.title,
          description: data.description,
          goodAttributes: data.good_candidate_attributes,
          badAttributes: data.bad_candidate_attributes,
        }
      });

      if (error) throw new Error(error.message);
      if (!result?.suggestedAttributes) throw new Error('No attributes generated');

      const newAttributes = result.suggestedAttributes;
      form.setValue('llm_suggested_attributes', newAttributes);
      form.setValue('essential_attributes', [
        ...form.getValues('essential_attributes'),
        ...newAttributes
      ]);

      toast({
        title: "Analysis Complete",
        description: "AI suggestions have been added to essential attributes.",
      });
    } catch (error: any) {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setAnalyzing(false);
    }
  }

  async function onSubmit(data: JobFormValues) {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error("No authenticated user found");
      }

      const jobData = {
        title: data.title,
        description: data.description,
        good_candidate_attributes: data.good_candidate_attributes,
        bad_candidate_attributes: data.bad_candidate_attributes,
        status: data.status,
        essential_attributes: data.essential_attributes || [],
        llm_suggested_attributes: data.llm_suggested_attributes || [],
        recruiter_id: session.user.id
      };

      const { error } = id
        ? await supabase
            .from('jobs')
            .update(jobData)
            .eq('id', id)
        : await supabase
            .from('jobs')
            .insert(jobData);

      if (error) throw error;

      toast({
        title: "Success",
        description: `Job ${id ? 'updated' : 'created'} successfully`,
      });
      navigate('/jobs');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
    }
  }

  const handleAttributesChange = (newAttributes: string[]) => {
    form.setValue('essential_attributes', newAttributes || [], {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>{id ? 'Edit Job' : 'Create New Job'}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label>Upload Job Description Document</Label>
            <div className="mt-2">
              <FileUpload 
                onProcessed={(data) => {
                  form.setValue('title', data.title);
                  form.setValue('description', data.description);
                  if (data.good_candidate_attributes) {
                    form.setValue('good_candidate_attributes', data.good_candidate_attributes);
                  }
                  if (data.bad_candidate_attributes) {
                    form.setValue('bad_candidate_attributes', data.bad_candidate_attributes);
                  }
                  if (data.essential_attributes) {
                    form.setValue('essential_attributes', data.essential_attributes);
                    form.setValue('llm_suggested_attributes', data.essential_attributes);
                  }
                }}
              />
              <p className="text-sm text-muted-foreground mt-1">
                Accepted formats: PDF, DOC, DOCX, HTML
              </p>
            </div>
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Job Description</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        className="h-32"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="good_candidate_attributes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Good Candidate Attributes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        className="h-24"
                        placeholder="Describe what makes a good candidate..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bad_candidate_attributes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bad Candidate Attributes</FormLabel>
                    <FormControl>
                      <Textarea 
                        {...field}
                        className="h-24"
                        placeholder="Describe what makes a poor candidate fit..."
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                        className="flex space-x-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="draft" id="draft" />
                          <Label htmlFor="draft">Draft</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="published" id="published" />
                          <Label htmlFor="published">Published</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="archived" id="archived" />
                          <Label htmlFor="archived">Archived</Label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-between items-center mb-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => analyzeCandidateAttributes(form.getValues())}
                  disabled={analyzing || !form.getValues('title') || !form.getValues('description')}
                >
                  {analyzing ? 'Analyzing...' : 'Analyze with AI'}
                </Button>
              </div>

              <div className="space-y-4">
                <Label>Essential Attributes</Label>
                <DraggableAttributes
                  attributes={form.watch('essential_attributes') || []}
                  onChange={handleAttributesChange}
                />
              </div>

              <div className="flex space-x-4">
                <Button 
                  type="submit"
                  disabled={analyzing || !form.formState.isValid}
                >
                  {id ? 'Update Job' : 'Create Job'}
                </Button>
              </div>

              {Array.isArray(form.watch('llm_suggested_attributes')) && 
               form.watch('llm_suggested_attributes').length > 0 && (
                <div>
                  <Label>AI Suggested Attributes</Label>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {form.watch('llm_suggested_attributes').map((attr, index) => (
                      <span
                        key={index}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-primary/10 text-primary cursor-pointer hover:bg-primary/20"
                        onClick={() => {
                          const currentAttributes = form.getValues('essential_attributes') || [];
                          if (!currentAttributes.includes(attr)) {
                            handleAttributesChange([...currentAttributes, attr]);
                          }
                        }}
                      >
                        {attr}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
