
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { personalInfo, experience, education, skills, currentResume } = await req.json();

    const systemPrompt = `You are an expert resume writer. Create a professional resume in markdown format based on the information provided. 
    Focus on highlighting achievements and using action verbs. Keep the format clean and professional.
    If a current resume is provided, improve upon it while maintaining the core information.`;

    const userPrompt = `Create a professional resume with the following information:
    
    Personal Information:
    - Name: ${personalInfo.fullName}
    - Email: ${personalInfo.email}
    - Phone: ${personalInfo.phone}
    - LinkedIn: ${personalInfo.linkedIn}
    
    Experience:
    ${experience}
    
    Education:
    ${education}
    
    Skills:
    ${skills}
    
    ${currentResume ? `Current Resume (improve this):\n${currentResume}` : ''}
    
    Format the resume in clean, professional markdown with clear sections for contact information, experience, education, and skills.
    Use bullet points for achievements and responsibilities.`;

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
    const markdown = data.choices[0].message.content;

    return new Response(JSON.stringify({ markdown }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error in generate-resume function:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
