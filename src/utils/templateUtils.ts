// Template management utilities

export interface TemplateMetadata {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  prefixes: Array<{
    id: string;
    name: string;
    value: string;
    type: 'name' | 'course' | 'organization' | 'date' | 'other';
  }>;
  elements: Array<any>;
  canvasDimensions: { width: number; height: number };
  bgFileName?: string;
  bgFileSize?: number;
  bgFileType?: string;
  version: string;
}

export interface Template extends TemplateMetadata {
  bgImage?: string;
}

// Save template to server
export const saveTemplate = async (templateData: {
  id: string;
  name: string;
  description?: string;
  prefixes: any[];
  elements: any[];
  canvasDimensions: { width: number; height: number };
  bgImage?: string;
  bgFileName?: string;
  bgFileSize?: number;
  bgFileType?: string;
}): Promise<{ success: boolean; templateId?: string; error?: string }> => {
  try {
    console.log('saveTemplate called with data:', {
      id: templateData.id,
      name: templateData.name,
      prefixesLength: templateData.prefixes?.length,
      elementsLength: templateData.elements?.length,
      hasBgImage: !!templateData.bgImage
    });

    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    });

    console.log('Response status:', response.status);
    console.log('Response ok:', response.ok);

    const result = await response.json();
    console.log('Response result:', result);
    
    if (!response.ok) {
      throw new Error(result.error || result.details || 'Failed to save template');
    }

    return result;
  } catch (error) {
    console.error('Error saving template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get all available templates
export const getTemplates = async (): Promise<{ success: boolean; templates?: TemplateMetadata[]; error?: string }> => {
  try {
    const response = await fetch('/api/templates');
    const result = await response.json();
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch templates');
    }

    return result;
  } catch (error) {
    console.error('Error fetching templates:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Get a specific template by ID
export const getTemplate = async (id: string): Promise<{ success: boolean; template?: Template; error?: string }> => {
  try {
    console.log('Fetching template with ID:', id);
    const response = await fetch(`/api/templates/${id}`);
    console.log('Template fetch response status:', response.status);
    
    const result = await response.json();
    console.log('Template fetch result:', result);
    
    if (!response.ok) {
      throw new Error(result.error || 'Failed to fetch template');
    }

    return result;
  } catch (error) {
    console.error('Error fetching template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Update an existing template
export const updateTemplate = async (id: string, templateData: {
  name: string;
  description?: string;
  prefixes: any[];
  elements: any[];
  canvasDimensions: { width: number; height: number };
  bgImage?: string;
  bgFileName?: string;
  bgFileSize?: number;
  bgFileType?: string;
}): Promise<{ success: boolean; templateId?: string; error?: string }> => {
  try {
    console.log('updateTemplate called with ID:', id);

    const response = await fetch(`/api/templates/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(templateData),
    });

    console.log('Update response status:', response.status);
    console.log('Update response ok:', response.ok);

    const result = await response.json();
    console.log('Update response result:', result);
    
    if (!response.ok) {
      throw new Error(result.error || result.details || 'Failed to update template');
    }

    return result;
  } catch (error) {
    console.error('Error updating template:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

// Generate template ID from name
export const generateTemplateId = (name: string): string => {
  const timestamp = Date.now().toString(36);
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 20);
  return `${cleanName}-${timestamp}`;
};

// Validate template data
export const validateTemplate = (templateData: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (!templateData.name || templateData.name.trim().length === 0) {
    errors.push('Template name is required');
  }

  if (!templateData.prefixes || !Array.isArray(templateData.prefixes)) {
    errors.push('Template must have prefixes array');
  }

  if (!templateData.elements || !Array.isArray(templateData.elements)) {
    errors.push('Template must have elements array');
  }

  if (!templateData.canvasDimensions || !templateData.canvasDimensions.width || !templateData.canvasDimensions.height) {
    errors.push('Template must have valid canvas dimensions');
  }

  return {
    valid: errors.length === 0,
    errors
  };
};