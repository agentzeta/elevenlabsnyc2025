
import { Json } from "@/integrations/supabase/types";

export type ApplicationStep = 'resume' | 'video' | 'interview';

export interface PersonalInfo {
  full_name?: string;
  pronunciation_note?: string;
  email?: string;
  phone?: string;
}

export interface KeyAttributes {
  [key: string]: Json;
  full_name?: string;
  pronunciation_note?: string;
}

export interface ApplicationData {
  resume_path: string;
  video_path: string;
  ai_analysis: Json;
  key_attributes: KeyAttributes;
}

export interface JobData {
  title: string;
  description: string;
  essential_attributes: string[];
  good_candidate_attributes: string;
  bad_candidate_attributes: string;
}

export interface CandidateInfo extends Record<string, Json> {
  full_name?: string;
  pronunciation_note?: string;
}
