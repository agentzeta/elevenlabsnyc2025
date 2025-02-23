
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Video, RefreshCcw, Upload, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface VideoRecorderProps {
  applicationId: string;
  onRecordingComplete: () => void;
}

export function VideoRecorder({ applicationId, onRecordingComplete }: VideoRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const { toast } = useToast();

  const getSupportedMimeType = () => {
    const types = [
      'video/webm;codecs=vp8,opus',
      'video/webm;codecs=vp9,opus',
      'video/webm;codecs=h264,opus',
      'video/webm'
    ];
    
    for (const type of types) {
      if (MediaRecorder.isTypeSupported(type)) {
        console.log('Using MIME type:', type);
        return type;
      }
    }
    console.error('No supported MIME type found');
    return 'video/webm';
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        },
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.muted = true;
      }

      const mimeType = getSupportedMimeType();
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType,
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      });
      
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const videoBlob = new Blob(chunksRef.current, { type: mimeType });
        setRecordedBlob(videoBlob);
        setShowPreview(true);
        if (videoRef.current) {
          videoRef.current.srcObject = null;
          videoRef.current.src = URL.createObjectURL(videoBlob);
          videoRef.current.muted = false;
        }
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(1000);
      setIsRecording(true);

      setTimeout(() => {
        if (mediaRecorder.state === 'recording') {
          stopRecording();
        }
      }, 60000);
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Error accessing camera",
        description: "Please make sure you have granted camera permissions",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const resetRecording = () => {
    setRecordedBlob(null);
    setShowPreview(false);
    if (videoRef.current) {
      videoRef.current.src = '';
    }
  };

  const uploadVideo = async () => {
    if (!applicationId || !recordedBlob) return;

    try {
      setIsProcessing(true);
      console.log('Starting video upload process...');

      // First upload the video
      const timestamp = new Date().getTime();
      const filePath = `${applicationId}/video/introduction_${timestamp}.webm`;
      
      console.log('Uploading video to storage...');
      const { error: uploadError } = await supabase.storage
        .from('applications')
        .upload(filePath, recordedBlob, {
          contentType: 'video/webm',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Video uploaded successfully, updating application status...');
      
      // Update application with video path
      const { error: updateError } = await supabase
        .from('applications')
        .update({
          status: 'video_uploaded',
          video_path: filePath
        })
        .eq('id', applicationId);

      if (updateError) {
        console.error('Update error:', updateError);
        throw updateError;
      }

      // Call analyze-video function
      console.log('Calling analyze-video function...');
      const { data: analysisData, error: analysisError } = await supabase.functions
        .invoke('analyze-video', {
          body: {
            applicationId,
            videoPath: filePath
          }
        });

      if (analysisError) {
        console.error('Analysis error:', analysisError);
        toast({
          title: "Video uploaded",
          description: "Video uploaded but analysis is pending. You can proceed with the application.",
          variant: "default",
        });
      } else {
        console.log('Analysis completed:', analysisData);
        toast({
          title: "Video processed successfully",
          description: "Let's proceed to the interview",
        });
      }

      onRecordingComplete();
    } catch (error) {
      console.error('Error in upload process:', error);
      toast({
        title: "Error processing video",
        description: "Please try again",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-4">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        controls={showPreview}
        className="w-full aspect-video bg-black rounded-lg"
      />
      <div className="flex justify-center gap-4">
        {!showPreview ? (
          <Button
            onClick={isRecording ? stopRecording : startRecording}
            disabled={isProcessing}
          >
            {isRecording ? (
              <>
                <Video className="mr-2 h-4 w-4" />
                Stop Recording
              </>
            ) : (
              <>
                <Video className="mr-2 h-4 w-4" />
                Start Recording (1 min)
              </>
            )}
          </Button>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={resetRecording}
              disabled={isProcessing}
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Record Again
            </Button>
            <Button
              onClick={uploadVideo}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Submit Recording
                </>
              )}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
