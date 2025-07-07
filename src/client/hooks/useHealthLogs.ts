import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { InferResponseType } from 'hono/client';
import { HealthLog } from '../../db/schema';
import { client } from '../api/client';

// API functions using typed client with inferred types
const api = {
  async uploadRecording(audioBlob: Blob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'recording.webm');
    
    const response = await client.api.api['health-log'].$post({
      form: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Upload failed (${response.status}): ${errorText}`);
    }
    
    return response.json();
  },

  async processTranscript(transcript: string) {
    const response = await client.api.api['process-transcript'].$post({
      json: { transcript },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Processing failed (${response.status}): ${errorText}`);
    }
    
    return response.json();
  },

  async extractHealthData(transcript: string) {
    const response = await client.api.api['extract-health-data'].$post({
      json: { transcript },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Extraction failed (${response.status}): ${errorText}`);
    }
    
    return response.json();
  },

  async updateHealthData(originalData: any, updateTranscript: string) {
    const response = await client.api.api['update-health-data'].$post({
      json: { originalData, updateTranscript },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Update failed (${response.status}): ${errorText}`);
    }
    
    return response.json();
  },

  async saveHealthLog(healthData: any, transcript?: string, audioUrl?: string) {
    const response = await client.api.api['save-health-log'].$post({
      json: { healthData, transcript, audioUrl },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Save failed (${response.status}): ${errorText}`);
    }
    
    return response.json();
  },

  async transcribeAudio(audioBlob: Blob) {
    const formData = new FormData();
    formData.append('audio', audioBlob, 'update.webm');
    
    const response = await client.api.api['transcribe-audio'].$post({
      form: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Transcription failed (${response.status}): ${errorText}`);
    }
    
    return response.json();
  },

  async updateExistingEntry(id: string, healthData: any, updateTranscript: string) {
    const response = await client.api.api['health-log'][':id'].$put({
      param: { id },
      json: { healthData, updateTranscript },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Update failed (${response.status}): ${errorText}`);
    }
    
    return response.json();
  },

  async getHealthLogs(): Promise<HealthLog[]> {
    const response = await client.api.api['health-log'].$get();
    
    if (!response.ok) {
      throw new Error(`Failed to fetch logs: ${response.status}`);
    }
    
    const data = await response.json();
    return Array.isArray(data) ? data : data.logs || [];
  },

  async deleteHealthLog(id: string) {
    const response = await client.api.api['health-log'][':id'].$delete({
      param: { id },
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delete failed (${response.status}): ${errorText}`);
    }
    
    return response.json();
  },

  async deleteAllHealthLogs() {
    const response = await client.api.api['health-logs'].$delete();
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Delete all failed (${response.status}): ${errorText}`);
    }
    
    return response.json();
  },

  async seedDatabase() {
    const response = await client.api.api.seed.$post({});
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Seed failed (${response.status}): ${errorText}`);
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

export function useUpdateExistingEntry() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, healthData, updateTranscript }: { id: string; healthData: any; updateTranscript: string }) =>
      api.updateExistingEntry(id, healthData, updateTranscript),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-logs'] });
    },
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

export function useSeedDatabase() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: api.seedDatabase,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['health-logs'] });
    },
  });
} 