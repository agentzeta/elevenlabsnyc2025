import { createParser } from 'eventsource-parser';
import { OpenAI } from 'openai';

export async function analyzeJob(jobDescription: string) {
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: "system",
          content: "You are a job analysis expert. Extract key requirements and attributes from job descriptions."
        },
        {
          role: "user",
          content: `Analyze this job description and extract: 1) Essential requirements 2) Good-to-have attributes 3) Red flags/bad attributes: ${jobDescription}`
        }
      ]
    });

    return response.choices[0].message.content;
  } catch (error) {
    console.error('Error analyzing job:', error);
    throw error;
  }
}
