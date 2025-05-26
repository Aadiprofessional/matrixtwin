import { supabase } from '../lib/supabase';

export interface ModelRecord {
  id: string;
  user_id: string;
  file_url: string;
  file_name: string;
  status: string;
  step?: string;
  progress?: number;
  error?: string;
  user_name?: string;
  file_id?: number;
  project_id?: string;
  token?: string;
  thumbnail?: string;
  viewtoken?: string;
  databag_id?: string;
  created_at?: string;
  updated_at?: string;
}

// Create a new model record in Supabase
export const createModelRecord = async (modelData: Omit<ModelRecord, 'id' | 'created_at' | 'updated_at'>): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('bim_process_logs')
      .insert(modelData)
      .select('id')
      .single();

    if (error) {
      console.error('Error creating model record:', error);
      throw error;
    }

    return data.id;
  } catch (error) {
    console.error('Error in createModelRecord:', error);
    throw error;
  }
};

// Get all models for the current user
export const getUserModels = async (userId: string): Promise<ModelRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('bim_process_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching user models:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserModels:', error);
    throw error;
  }
};

// Get all models (admin only)
export const getAllModels = async (): Promise<ModelRecord[]> => {
  try {
    const { data, error } = await supabase
      .from('bim_process_logs')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching all models:', error);
      throw error;
    }

    return data || [];
  } catch (error) {
    console.error('Error in getAllModels:', error);
    throw error;
  }
};

// Update model status
export const updateModelRecordStatus = async (modelId: string, status: string, step?: string, progress?: number, error?: string): Promise<void> => {
  try {
    const updates: { status: string; step?: string; progress?: number; error?: string } = { status };
    
    if (step !== undefined) updates.step = step;
    if (progress !== undefined) updates.progress = progress;
    if (error !== undefined) updates.error = error;
    
    const { error: supabaseError } = await supabase
      .from('bim_process_logs')
      .update(updates)
      .eq('id', modelId);

    if (supabaseError) {
      console.error('Error updating model status:', supabaseError);
      throw supabaseError;
    }
  } catch (error) {
    console.error('Error in updateModelStatus:', error);
    throw error;
  }
};

// Update model fields
export const updateModelRecord = async (modelId: string, updates: Partial<ModelRecord>): Promise<void> => {
  try {
    const { error } = await supabase
      .from('bim_process_logs')
      .update(updates)
      .eq('id', modelId);

    if (error) {
      console.error('Error updating model:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in updateModel:', error);
    throw error;
  }
};

// Delete a model
export const deleteModelRecord = async (modelId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('bim_process_logs')
      .delete()
      .eq('id', modelId);

    if (error) {
      console.error('Error deleting model:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteModel:', error);
    throw error;
  }
}; 