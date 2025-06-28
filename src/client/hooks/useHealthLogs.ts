import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// Types (you can import these from your shared types later)
interface HealthLog {
  id: string;
  date: string;
  transcript: string;
  healthData: any;
  audioUrl?: string;
}

interface UploadResponse {
  success: boolean;
  message: string;
  id: string;
  transcript: string;
  data: any;
}

interface ProcessTranscriptResponse {
  success: boolean;
  message: string;
  id: string;
  transcript: string;
  data: any;
}

// API functions
const api = {
  async uploadRecording(audioBlob: Blob): Promise<UploadResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    const response = await fetch('/api/health-log', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed (${response.status}): ${errorText}`);
    }
    
    return response.json();
  },

  async processTranscript(transcript: string): Promise<ProcessTranscriptResponse> {
    const response = await fetch('/api/process-transcript', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Processing failed (${response.status}): ${errorText}`);
    }
    
    return response.json();
  },

  async getHealthLogs(): Promise<HealthLog[]> {
    const response = await fetch('/api/health-log');
    
    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.status}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : data.logs || [];
  },
};

// React Query hooks
export function useHealthLogs() {
  return useQuery({
    queryKey: ['health-logs'],
    queryFn: api.getHealthLogs,
  });
}

export function useUploadRecording() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.uploadRecording,
    onSuccess: () => {
      // Invalidate and refetch health logs
      queryClient.invalidateQueries({ queryKey: ['health-logs'] });
    },
  });
}

export function useProcessTranscript() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.processTranscript,
    onSuccess: () => {
      // Invalidate and refetch health logs
      queryClient.invalidateQueries({ queryKey: ['health-logs'] });
    },
  });
} 