
import { supabase } from "@/integrations/supabase/client";

export let ELEVEN_LABS_API_KEY = '';

// Get the API key from Supabase secrets
const loadApiKey = async () => {
  const { data, error } = await supabase
    .functions.invoke('get-secret', {
      body: { secretName: 'ELEVEN_LABS_API_KEY' }
    });
  
  if (error) {
    console.error('Error loading ElevenLabs API key:', error);
    return;
  }
  
  if (data?.secret) {
    ELEVEN_LABS_API_KEY = data.secret;
  } else {
    console.error('Missing ELEVEN_LABS_API_KEY secret');
  }
};

loadApiKey();
