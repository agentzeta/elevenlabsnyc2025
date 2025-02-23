export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      applications: {
        Row: {
          ai_analysis: Json | null
          assessment_score: number | null
          candidate_id: string
          conversation_transcript: string | null
          created_at: string
          id: string
          interview_feedback: string | null
          interview_transcript: string | null
          job_id: string
          key_attributes: Json | null
          reference_verified: boolean | null
          resume_path: string | null
          status: string
          updated_at: string
          video_analysis: Json | null
          video_path: string | null
          video_transcript: string | null
        }
        Insert: {
          ai_analysis?: Json | null
          assessment_score?: number | null
          candidate_id: string
          conversation_transcript?: string | null
          created_at?: string
          id?: string
          interview_feedback?: string | null
          interview_transcript?: string | null
          job_id: string
          key_attributes?: Json | null
          reference_verified?: boolean | null
          resume_path?: string | null
          status?: string
          updated_at?: string
          video_analysis?: Json | null
          video_path?: string | null
          video_transcript?: string | null
        }
        Update: {
          ai_analysis?: Json | null
          assessment_score?: number | null
          candidate_id?: string
          conversation_transcript?: string | null
          created_at?: string
          id?: string
          interview_feedback?: string | null
          interview_transcript?: string | null
          job_id?: string
          key_attributes?: Json | null
          reference_verified?: boolean | null
          resume_path?: string | null
          status?: string
          updated_at?: string
          video_analysis?: Json | null
          video_path?: string | null
          video_transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "applications_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "applications_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_documents: {
        Row: {
          content_type: string | null
          created_at: string
          file_path: string
          filename: string
          id: string
          job_id: string | null
          updated_at: string
        }
        Insert: {
          content_type?: string | null
          created_at?: string
          file_path: string
          filename: string
          id?: string
          job_id?: string | null
          updated_at?: string
        }
        Update: {
          content_type?: string | null
          created_at?: string
          file_path?: string
          filename?: string
          id?: string
          job_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_documents_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      jobs: {
        Row: {
          bad_candidate_attributes: string | null
          created_at: string
          description: string
          essential_attributes: string[] | null
          good_candidate_attributes: string | null
          id: string
          llm_suggested_attributes: string[] | null
          recruiter_id: string
          status: Database["public"]["Enums"]["job_status"] | null
          title: string
          updated_at: string
        }
        Insert: {
          bad_candidate_attributes?: string | null
          created_at?: string
          description: string
          essential_attributes?: string[] | null
          good_candidate_attributes?: string | null
          id?: string
          llm_suggested_attributes?: string[] | null
          recruiter_id: string
          status?: Database["public"]["Enums"]["job_status"] | null
          title: string
          updated_at?: string
        }
        Update: {
          bad_candidate_attributes?: string | null
          created_at?: string
          description?: string
          essential_attributes?: string[] | null
          good_candidate_attributes?: string | null
          id?: string
          llm_suggested_attributes?: string[] | null
          recruiter_id?: string
          status?: Database["public"]["Enums"]["job_status"] | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "jobs_recruiter_id_fkey"
            columns: ["recruiter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      job_status: "draft" | "published" | "archived"
      user_role: "recruiter" | "candidate"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
