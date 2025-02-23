import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowRight, ArrowLeft, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ResumeBuilderProps {
  onResumeGenerated: (markdown: string) => void;
}

type Step = 'personal' | 'experience' | 'education' | 'skills' | 'preview';

interface PersonalInfo {
  fullName: string;
  email: string;
  phone: string;
  linkedIn: string;
}

export function ResumeBuilder({ onResumeGenerated }: ResumeBuilderProps) {
  const [currentStep, setCurrentStep] = useState<Step>('personal');
  const [personalInfo, setPersonalInfo] = useState<PersonalInfo>({
    fullName: '',
    email: '',
    phone: '',
    linkedIn: '',
  });
  const [experience, setExperience] = useState('');
  const [education, setEducation] = useState('');
  const [skills, setSkills] = useState('');
  const [generatedResume, setGeneratedResume] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  async function generateResume() {
    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-resume', {
        body: {
          personalInfo,
          experience,
          education,
          skills,
          currentResume: generatedResume
        }
      });

      if (error) throw error;

      setGeneratedResume(data.markdown);
      onResumeGenerated(data.markdown);
      setCurrentStep('preview');

      toast({
        title: "Resume generated",
        description: "Your resume has been generated. Feel free to regenerate or edit further.",
      });
    } catch (error) {
      console.error('Error generating resume:', error);
      toast({
        title: "Error generating resume",
        description: "Failed to generate resume. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsGenerating(false);
    }
  }

  const nextStep = () => {
    switch (currentStep) {
      case 'personal':
        setCurrentStep('experience');
        break;
      case 'experience':
        setCurrentStep('education');
        break;
      case 'education':
        setCurrentStep('skills');
        break;
      case 'skills':
        generateResume();
        break;
    }
  };

  const prevStep = () => {
    switch (currentStep) {
      case 'experience':
        setCurrentStep('personal');
        break;
      case 'education':
        setCurrentStep('experience');
        break;
      case 'skills':
        setCurrentStep('education');
        break;
      case 'preview':
        setCurrentStep('skills');
        break;
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'personal':
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                placeholder="John Doe"
                value={personalInfo.fullName}
                onChange={(e) => setPersonalInfo({ ...personalInfo, fullName: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="john@example.com"
                value={personalInfo.email}
                onChange={(e) => setPersonalInfo({ ...personalInfo, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                placeholder="+1 (555) 123-4567"
                value={personalInfo.phone}
                onChange={(e) => setPersonalInfo({ ...personalInfo, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="linkedin">LinkedIn Profile</Label>
              <Input
                id="linkedin"
                placeholder="https://linkedin.com/in/johndoe"
                value={personalInfo.linkedIn}
                onChange={(e) => setPersonalInfo({ ...personalInfo, linkedIn: e.target.value })}
              />
            </div>
          </div>
        );
      case 'experience':
        return (
          <div>
            <Label htmlFor="experience">Professional Experience</Label>
            <Textarea
              id="experience"
              placeholder="List your work experience, including company names, dates, positions, and key achievements..."
              value={experience}
              onChange={(e) => setExperience(e.target.value)}
              className="h-[400px]"
            />
          </div>
        );
      case 'education':
        return (
          <div>
            <Label htmlFor="education">Education</Label>
            <Textarea
              id="education"
              placeholder="List your education, including institutions, degrees, dates, and relevant coursework..."
              value={education}
              onChange={(e) => setEducation(e.target.value)}
              className="h-[400px]"
            />
          </div>
        );
      case 'skills':
        return (
          <div>
            <Label htmlFor="skills">Skills & Technologies</Label>
            <Textarea
              id="skills"
              placeholder="List your technical skills, tools, technologies, and other relevant abilities..."
              value={skills}
              onChange={(e) => setSkills(e.target.value)}
              className="h-[400px]"
            />
          </div>
        );
      case 'preview':
        return (
          <Card className="p-4">
            <div className="prose prose-sm max-w-none">
              <div className="whitespace-pre-wrap font-mono text-sm">
                {generatedResume}
              </div>
            </div>
          </Card>
        );
    }
  };

  const isNextDisabled = () => {
    switch (currentStep) {
      case 'personal':
        return !personalInfo.fullName || !personalInfo.email;
      case 'experience':
        return !experience.trim();
      case 'education':
        return !education.trim();
      case 'skills':
        return !skills.trim();
      default:
        return false;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-6">
        <div className="space-y-1">
          <h3 className="text-lg font-medium">
            {currentStep === 'preview' ? 'Preview Resume' : 'Step ' + (
              currentStep === 'personal' ? '1: Personal Information' :
              currentStep === 'experience' ? '2: Professional Experience' :
              currentStep === 'education' ? '3: Education' :
              '4: Skills'
            )}
          </h3>
          <p className="text-sm text-muted-foreground">
            {currentStep === 'preview' 
              ? "Review your generated resume. You can regenerate or edit it further."
              : "Fill in the details below to generate your professional resume."}
          </p>
        </div>
      </div>

      {renderStep()}

      <div className="flex justify-between pt-4">
        {currentStep !== 'personal' && (
          <Button
            variant="outline"
            onClick={prevStep}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        )}
        {currentStep === 'preview' ? (
          <Button
            onClick={generateResume}
            disabled={isGenerating}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Regenerate Resume
          </Button>
        ) : (
          <Button
            onClick={nextStep}
            disabled={isNextDisabled() || isGenerating}
            className="ml-auto"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                {currentStep === 'skills' ? 'Generate Resume' : 'Next Step'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
