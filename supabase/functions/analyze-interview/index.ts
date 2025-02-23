
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Analyze interview function called');
    const requestData = await req.json();
    const { applicationId, jobId, transcript } = requestData;

    console.log('Request data:', {
      applicationId,
      jobId,
      transcriptLength: transcript?.length || 0
    });

    if (!applicationId || !jobId || !transcript) {
      throw new Error('Missing required parameters');
    }

    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Fetching job details...');
    const { data: jobData, error: jobError } = await supabase
      .from('jobs')
      .select('*')
      .eq('id', jobId)
      .single();

    if (jobError) {
      console.error('Error fetching job:', jobError);
      throw jobError;
    }

    console.log('Job data retrieved:', {
      title: jobData.title,
      essentialAttributesCount: jobData.essential_attributes?.length || 0
    });

    const systemPrompt = `You are an expert hiring manager tasked with evaluating interview transcripts. 
    Analyze the interview transcript and assess the candidate based on the job requirements.
    Provide a score from 0-100 and detailed feedback. Give more weight for the AI interview, followed by by resume and experience and then by video introduction`;

    const userPrompt = `Job Details:
    Title: ${jobData.title}
    Description: ${jobData.description}
    Essential Requirements: ${jobData.essential_attributes?.join(', ')}
    Desired Attributes: ${jobData.good_candidate_attributes}
    Red Flags: ${jobData.bad_candidate_attributes}

    Interview Transcript:
    ${transcript}

    Analyze the candidate's responses and provide:
    1. A score from 0-100 based on their alignment with job requirements
    2. Detailed feedback highlighting strengths and areas of concern
    3. Assessment of technical skills and cultural fit. Provide more weight for the AI interview, followed by the resume and experience, and then by video introduction.`;

    console.log('Calling OpenAI API...');
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
      }),
    });

    const data = await response.json();
    console.log('OpenAI response received');
    
    if (!data.choices?.[0]?.message?.content) {
      throw new Error('Invalid response from OpenAI');
    }

    const analysis = data.choices[0].message.content;
    console.log('Analysis length:', analysis.length);

    const scoreMatch = analysis.match(/\b([0-9]{1,2}|100)\b/);
    const score = scoreMatch ? parseInt(scoreMatch[0]) : 0;
    console.log('Extracted score:', score);

    return new Response(
      JSON.stringify({
        score,
        feedback: analysis
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in analyze-interview function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
