'use client';

import { useState, useEffect } from 'react';
import { useCertificateStore } from '@/store/certificateStore';
import { CertificateCreator } from '../certificate/CertificateCreator';
import { Sidebar } from '../certificate/Sidebar';
import { useImagePersistence } from '@/hooks/useImagePersistence';
import { saveTemplate, updateTemplate, getTemplates, getTemplate, generateTemplateId, validateTemplate, TemplateMetadata } from '@/utils/templateUtils';

export const DesignerApp = () => {
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);
  const { 
    bgImage,
    bgFileName,
    bgFileSize,
    bgFileType,
    elements,
    prefixes,
    canvasDimensions,
    convertBgImageToBase64, 
    convertElementImagesToBase64,
    setBgImage,
    setBgFile,
    setBgFileMetadata,
    setElements,
    setPrefixes,
    setCanvasDimensions,
    reset
  } = useCertificateStore();
  
  const [templateName, setTemplateName] = useState('');
  const [templateDescription, setTemplateDescription] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<{ type: 'success' | 'error' | null; message: string }>({ type: null, message: '' });

  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [availableTemplates, setAvailableTemplates] = useState<TemplateMetadata[]>([]);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Enable automatic image persistence
  useImagePersistence();

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading Designer...</p>
        </div>
      </div>
    );
  }

  // Load available templates
  const loadAvailableTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const result = await getTemplates();
      if (result.success && result.templates) {
        setAvailableTemplates(result.templates);
      } else {
        console.error('Failed to load templates:', result.error);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  // Load a template for editing
  const loadTemplateForEditing = async (templateId: string) => {
    try {
      const result = await getTemplate(templateId);
      if (result.success && result.template) {
        const template = result.template;
        
        // Load template data into the store
        setElements(template.elements);
        setPrefixes(template.prefixes);
        setCanvasDimensions(template.canvasDimensions.width, template.canvasDimensions.height);
        
        if (template.bgImage) {
          setBgImage(template.bgImage);
          // Create a mock file object for metadata
          const mockFile = new File([''], template.bgFileName || 'background.jpg', {
            type: template.bgFileType || 'image/jpeg'
          });
          Object.defineProperty(mockFile, 'size', {
            value: template.bgFileSize || 0,
            writable: false
          });
          setBgFile(mockFile);
          setBgFileMetadata(mockFile);
        }
        
        // Set form data
        setTemplateName(template.name);
        setTemplateDescription(template.description || '');
        setEditingTemplateId(templateId);
        setShowTemplateSelector(false);
        
        setSaveStatus({ type: 'success', message: `Template "${template.name}" loaded for editing` });
      } else {
        setSaveStatus({ type: 'error', message: result.error || 'Failed to load template' });
      }
    } catch (error) {
      console.error('Error loading template for editing:', error);
      setSaveStatus({ type: 'error', message: 'Error loading template' });
    }
  };

  // Create new template (reset everything)
  const createNewTemplate = () => {
    reset();
    setTemplateName('');
    setTemplateDescription('');
    setEditingTemplateId(null);
    setSaveStatus({ type: 'success', message: 'Ready to create new template' });
  };

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) {
      setSaveStatus({ type: 'error', message: 'Please enter a template name' });
      return;
    }

    setIsSaving(true);
    setSaveStatus({ type: null, message: '' });

    try {
      // Convert images to base64 first
      await convertBgImageToBase64();
      await convertElementImagesToBase64();

      // Get current state
      const currentState = useCertificateStore.getState();

      const templateData = {
        name: templateName,
        description: templateDescription,
        prefixes: currentState.prefixes,
        elements: currentState.elements,
        canvasDimensions: currentState.canvasDimensions,
        bgImage: currentState.bgImage || undefined,
        bgFileName: currentState.bgFileName || undefined,
        bgFileSize: currentState.bgFileSize || undefined,
        bgFileType: currentState.bgFileType || undefined
      };

      console.log('Template data to save:', {
        name: templateData.name,
        isEditing: !!editingTemplateId,
        editingId: editingTemplateId,
        prefixesCount: templateData.prefixes?.length,
        elementsCount: templateData.elements?.length,
        canvasDimensions: `${templateData.canvasDimensions.width}x${templateData.canvasDimensions.height}`,
        hasBgImage: !!templateData.bgImage,
        bgFileName: templateData.bgFileName
      });

      // Validate template
      const validation = validateTemplate({ ...templateData, id: editingTemplateId || 'temp' });
      console.log('Validation result:', validation);
      
      if (!validation.valid) {
        setSaveStatus({ type: 'error', message: validation.errors.join(', ') });
        return;
      }

      let result;
      if (editingTemplateId) {
        // Update existing template
        console.log('Updating existing template...');
        result = await updateTemplate(editingTemplateId, templateData);
      } else {
        // Create new template
        console.log('Creating new template...');
        const newTemplateData = {
          ...templateData,
          id: generateTemplateId(templateName)
        };
        result = await saveTemplate(newTemplateData);
        if (result.success && result.templateId) {
          setEditingTemplateId(result.templateId);
        }
      }
      
      console.log('Save/Update result:', result);
      
      if (result.success) {
        const action = editingTemplateId ? 'updated' : 'created';
        setSaveStatus({ type: 'success', message: `Template "${templateName}" ${action} successfully!` });
        
        // Reload available templates
        loadAvailableTemplates();
      } else {
        setSaveStatus({ type: 'error', message: result.error || 'Failed to save template' });
      }
    } catch (error) {
      console.error('Error saving template:', error);
      setSaveStatus({ type: 'error', message: 'An unexpected error occurred' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleManualSave = async () => {
    await convertBgImageToBase64();
    await convertElementImagesToBase64();
    // Show a brief success message
    const button = document.getElementById('save-button');
    if (button) {
      const originalText = button.textContent;
      button.textContent = 'Saved!';
      setTimeout(() => {
        button.textContent = originalText;
      }, 1000);
    }
  };



  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Certificate Designer</h1>
              <p className="text-gray-600 text-sm">Create certificate templates for the generator app</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                onClick={() => {
                  setShowTemplateSelector(!showTemplateSelector);
                  if (!showTemplateSelector) {
                    loadAvailableTemplates();
                  }
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <span>📋</span>
                {showTemplateSelector ? 'Hide Templates' : 'Load Template'}
              </button>
              
              <button
                onClick={createNewTemplate}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <span>➕</span>
                New Template
              </button>
              
              <button
                id="save-button"
                onClick={handleManualSave}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <span>💾</span>
                Save Progress
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Template Selector */}
      {showTemplateSelector && (
        <div className="bg-white border-b border-gray-200 p-4">
          <div className="max-w-6xl mx-auto">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Load Existing Template</h3>
            
            {isLoadingTemplates ? (
              <div className="text-center py-8">
                <div className="animate-spin text-2xl mb-2">⏳</div>
                <p className="text-gray-600">Loading templates...</p>
              </div>
            ) : availableTemplates.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-4xl mb-2">📋</div>
                <p className="text-gray-600">No templates available</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {availableTemplates.map((template) => (
                  <div
                    key={template.id}
                    className={`bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors cursor-pointer border-2 ${
                      editingTemplateId === template.id ? 'border-blue-500 bg-blue-50' : 'border-transparent'
                    }`}
                    onClick={() => loadTemplateForEditing(template.id)}
                  >
                    <h4 className="font-semibold text-gray-800 mb-2 truncate">{template.name}</h4>
                    {template.description && (
                      <p className="text-gray-600 text-sm mb-3 line-clamp-2">{template.description}</p>
                    )}
                    
                    <div className="space-y-1 text-xs text-gray-500">
                      <div className="flex justify-between">
                        <span>Fields:</span>
                        <span>{template.prefixes.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Elements:</span>
                        <span>{template.elements.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Updated:</span>
                        <span>{new Date(template.updatedAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    {editingTemplateId === template.id && (
                      <div className="mt-2 text-xs text-blue-600 font-medium">
                        ✓ Currently editing
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <CertificateCreator />
          
          {/* Template Save Section */}
          <div className="bg-white border-t border-gray-200 p-6">
            <div className="max-w-4xl mx-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {editingTemplateId ? 'Update Template' : 'Save as Template'}
                </h3>
                {editingTemplateId && (
                  <div className="text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
                    Editing: {templateName || 'Unnamed Template'}
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name *
                  </label>
                  <input
                    type="text"
                    value={templateName}
                    onChange={(e) => setTemplateName(e.target.value)}
                    placeholder="e.g., Course Completion Certificate"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <input
                    type="text"
                    value={templateDescription}
                    onChange={(e) => setTemplateDescription(e.target.value)}
                    placeholder="Brief description of this template"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-black"
                  />
                </div>
              </div>

              {/* Template Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <h4 className="font-medium text-gray-700 mb-2">Template Preview</h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-600">
                  <div>
                    <span className="font-medium">Background:</span> {bgImage ? '✓' : '✗'}
                  </div>
                  <div>
                    <span className="font-medium">Elements:</span> {elements.length}
                  </div>
                  <div>
                    <span className="font-medium">Fields:</span> {prefixes.length}
                  </div>
                  <div>
                    <span className="font-medium">Size:</span> {canvasDimensions?.width || 0}×{canvasDimensions?.height || 0}
                  </div>
                </div>
                
                {prefixes.length > 0 && (
                  <div className="mt-3">
                    <span className="font-medium text-gray-700">Dynamic Fields:</span>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {prefixes.map((prefix) => (
                        <span
                          key={prefix.id}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                        >
                          {prefix.name} ({prefix.type})
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Status Message */}
              {saveStatus.type && (
                <div className={`p-3 rounded-lg mb-4 ${
                  saveStatus.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200' 
                    : 'bg-red-50 text-red-700 border border-red-200'
                }`}>
                  <div className="font-medium">{saveStatus.message}</div>
                  {saveStatus.type === 'error' && (
                    <div className="text-sm mt-1 opacity-75">
                      Check the browser console for more details.
                    </div>
                  )}
                </div>
              )}

              {/* Save Button */}
              <div className="flex justify-end gap-3">
                <button
                  onClick={async () => {
                    try {
                      const response = await fetch('/api/test-template');
                      const result = await response.json();
                      console.log('API test result:', result);
                      setSaveStatus({ 
                        type: result.success ? 'success' : 'error', 
                        message: result.success ? 'API test passed' : `API test failed: ${result.error}` 
                      });
                    } catch (error) {
                      console.error('API test error:', error);
                      setSaveStatus({ type: 'error', message: 'API test failed' });
                    }
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  Test API
                </button>
                
                <button
                  onClick={handleSaveTemplate}
                  disabled={isSaving || !templateName.trim() || !bgImage}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                >
                  {isSaving ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      {editingTemplateId ? 'Updating Template...' : 'Saving Template...'}
                    </>
                  ) : (
                    <>
                      <span>{editingTemplateId ? '💾' : '📋'}</span>
                      {editingTemplateId ? 'Update Template' : 'Save Template'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};