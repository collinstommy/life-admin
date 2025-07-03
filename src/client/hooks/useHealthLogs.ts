import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { HealthLog } from '../../db/schema';


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

interface ExtractHealthDataResponse {
  success: boolean;
  message: string;
  transcript: string;
  data: any;
}

interface UpdateHealthDataResponse {
  success: boolean;
  message: string;
  updateTranscript: string;
  data: any;
}

interface SaveHealthLogResponse {
  success: boolean;
  message: string;
  id: string;
  data: any;
}

interface TranscribeAudioResponse {
  success: boolean;
  transcript: string;
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

  async extractHealthData(transcript: string): Promise<ExtractHealthDataResponse> {
    const response = await fetch('/api/extract-health-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transcript }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Extraction failed (${response.status}): ${errorText}`);
    }
    
    return response.json();
  },

  async updateHealthData(originalData: any, updateTranscript: string): Promise<UpdateHealthDataResponse> {
    const response = await fetch('/api/update-health-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ originalData, updateTranscript }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Update failed (${response.status}): ${errorText}`);
    }
    
    return response.json();
  },

  async saveHealthLog(healthData: any, transcript?: string, audioUrl?: string): Promise<SaveHealthLogResponse> {
    const response = await fetch('/api/save-health-log', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ healthData, transcript, audioUrl }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Save failed (${response.status}): ${errorText}`);
    }
    
    return response.json();
  },

  async transcribeAudio(audioBlob: Blob): Promise<TranscribeAudioResponse> {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'update.webm');
    
    const response = await fetch('/api/transcribe-audio', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transcription failed (${response.status}): ${errorText}`);
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

  async deleteHealthLog(id: string): Promise<{ success: boolean; message: string }> {
    const response = await fetch(`/api/health-log/${id}`, {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delete failed (${response.status}): ${errorText}`);
    }
    
    return response.json();
  },

  async deleteAllHealthLogs(): Promise<{ success: boolean; message: string; deletedCount: number }> {
    const response = await fetch('/api/health-logs', {
      method: 'DELETE',
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delete all failed (${response.status}): ${errorText}`);
    }
    
    return response.json();
  },
};

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
      queryClient.invalidateQueries({ queryKey: ['health-logs'] });
    },
  });
}

export function useProcessTranscript() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.processTranscript,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-logs'] });
    },
  });
}

export function useExtractHealthData() {
  return useMutation({
    mutationFn: api.extractHealthData,
    // Don't invalidate queries since we're not saving to DB yet
  });
}

export function useUpdateHealthData() {
  return useMutation({
    mutationFn: ({ originalData, updateTranscript }: { originalData: any; updateTranscript: string }) =>
      api.updateHealthData(originalData, updateTranscript),
    // Don't invalidate queries since we're not saving to DB yet
  });
}

export function useSaveHealthLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ healthData, transcript, audioUrl }: { healthData: any; transcript?: string; audioUrl?: string }) =>
      api.saveHealthLog(healthData, transcript, audioUrl),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-logs'] });
    },
  });
}

export function useTranscribeAudio() {
  return useMutation({
    mutationFn: api.transcribeAudio,
    // Don't invalidate queries since we're just transcribing
  });
}

export function useDeleteHealthLog() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deleteHealthLog,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-logs'] });
    },
  });
}

export function useDeleteAllHealthLogs() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.deleteAllHealthLogs,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-logs'] });
    },
  });
} 