'use client';

import { useState, useEffect } from 'react';
import { getTemplates, getTemplate, TemplateMetadata, Template } from '@/utils/templateUtils';
import { downloadPDFWithMetadata } from '@/utils/fileUtils';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

export const GeneratorApp = () => {
  const [templates, setTemplates] = useState<TemplateMetadata[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(false);


  // Load templates on component mount
  useEffect(() => {
    loadTemplates();
  }, []);

  const loadTemplates = async () => {
    console.log('Loading templates...');
    setIsLoading(true);
    try {
      const result = await getTemplates();
      console.log('Templates fetch result:', result);
      
      if (result.success && result.templates) {
        console.log('Templates loaded:', result.templates);
        setTemplates(result.templates);
      } else {
        console.error('Failed to load templates:', result.error);
        alert(`Failed to load templates: ${result.error}`);
      }
    } catch (error) {
      console.error('Error loading templates:', error);
      alert(`Error loading templates: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const selectTemplate = async (templateId: string) => {
    console.log('Selecting template:', templateId);
    try {
      const result = await getTemplate(templateId);
      console.log('Template fetch result:', result);
      
      if (result.success && result.template) {
        console.log('Template loaded successfully:', result.template);
        setSelectedTemplate(result.template);
        
        // Initialize form data with default values
        const initialFormData: Record<string, string> = {};
        result.template.prefixes.forEach(prefix => {
          initialFormData[prefix.id] = prefix.value || '';
        });
        console.log('Initial form data:', initialFormData);
        setFormData(initialFormData);
      } else {
        console.error('Failed to load template:', result.error);
        alert(`Failed to load template: ${result.error}`);
      }
    } catch (error) {
      console.error('Error loading template:', error);
      alert(`Error loading template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleFormChange = (prefixId: string, value: string) => {
    setFormData(prev => ({ ...prev, [prefixId]: value }));
  };

  const replacePlaceholders = (content: string) => {
    let result = content;
    if (selectedTemplate) {
      selectedTemplate.prefixes.forEach(prefix => {
        const value = formData[prefix.id] || prefix.value || '';
        result = result.replace(new RegExp(`\\{\\{${prefix.name}\\}\\}`, 'g'), value);
      });
    }
    return result;
  };

  const generatePDF = async () => {
    if (!selectedTemplate) return;

    setIsGenerating(true);

    try {
      // Create a temporary container for rendering
      const container = document.createElement('div');
      container.style.position = 'fixed';
      container.style.left = '-9999px';
      container.style.top = '0';
      container.style.width = `${selectedTemplate.canvasDimensions?.width || 1123}px`;
      container.style.height = `${selectedTemplate.canvasDimensions?.height || 794}px`;
      container.style.backgroundColor = '#ffffff';
      
      // Add background image if available
      if (selectedTemplate.bgImage) {
        const bgImg = document.createElement('img');
        bgImg.src = selectedTemplate.bgImage;
        bgImg.style.width = '100%';
        bgImg.style.height = '100%';
        bgImg.style.objectFit = 'contain';
        bgImg.style.position = 'absolute';
        bgImg.style.top = '0';
        bgImg.style.left = '0';
        container.appendChild(bgImg);
      }

      // Add elements
      selectedTemplate.elements.forEach(element => {
        const elementDiv = document.createElement('div');
        elementDiv.style.position = 'absolute';
        elementDiv.style.left = `${element.x}px`;
        elementDiv.style.top = `${element.y}px`;
        elementDiv.style.width = `${element.width}px`;
        elementDiv.style.height = `${element.height}px`;

        if (element.type === 'text') {
          const processedContent = replacePlaceholders(element.content);
          elementDiv.innerHTML = processedContent;
          elementDiv.style.color = element.color || '#000000';
          elementDiv.style.fontSize = `${element.fontSize || 16}px`;
          elementDiv.style.fontFamily = element.fontFamily || 'Arial';
          elementDiv.style.display = 'flex';
          elementDiv.style.alignItems = 'center';
          elementDiv.style.justifyContent = 'center';
        } else if (element.type === 'image' && element.src) {
          const img = document.createElement('img');
          img.src = element.src;
          img.style.width = '100%';
          img.style.height = '100%';
          img.style.objectFit = 'cover';
          elementDiv.appendChild(img);
        }

        container.appendChild(elementDiv);
      });

      document.body.appendChild(container);

      // Wait for images to load
      const images = container.querySelectorAll('img');
      await Promise.all(Array.from(images).map(img => {
        if (img.complete) return Promise.resolve();
        return new Promise((resolve) => {
          img.onload = () => resolve(undefined);
          img.onerror = () => resolve(undefined);
          setTimeout(() => resolve(undefined), 5000);
        });
      }));

      // Generate PDF
      const canvas = await html2canvas(container, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: selectedTemplate.canvasDimensions.width,
        height: selectedTemplate.canvasDimensions.height,
        foreignObjectRendering: false,
        onclone: (clonedDoc) => {
          const style = clonedDoc.createElement('style');
          style.textContent = `
            * {
              color-scheme: light !important;
            }
            body {
              background: #ffffff !important;
              color: #171717 !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: selectedTemplate.canvasDimensions.width > selectedTemplate.canvasDimensions.height ? 'landscape' : 'portrait',
        unit: 'pt',
        format: [
          Math.ceil(selectedTemplate.canvasDimensions.width * 0.75),
          Math.ceil(selectedTemplate.canvasDimensions.height * 0.75)
        ]
      });

      pdf.addImage(imgData, 'JPEG', 0, 0,
        Math.ceil(selectedTemplate.canvasDimensions.width * 0.75),
        Math.ceil(selectedTemplate.canvasDimensions.height * 0.75)
      );

      // Generate filename
      const recipientName = formData[selectedTemplate.prefixes.find(p => p.type === 'name')?.id || ''] || 'certificate';
      const fileName = `${selectedTemplate.name.toLowerCase().replace(/[^a-z0-9]/g, '-')}-${recipientName.toLowerCase().replace(/[^a-z0-9]/g, '-')}.pdf`;

      // Download PDF
      await downloadPDFWithMetadata(pdf, selectedTemplate.id, fileName, includeMetadata);

      // Cleanup
      document.body.removeChild(container);

    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Error generating certificate. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const isFormValid = selectedTemplate ? 
    selectedTemplate.prefixes.every(prefix => formData[prefix.id]?.trim()) : false;



  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading templates...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Certificate Generator</h1>
              <p className="text-gray-600 text-sm">Generate certificates from designer templates</p>
            </div>
            
            <div className="flex items-center gap-3">
              <button
                onClick={async () => {
                  try {
                    const response = await fetch('/api/templates');
                    const result = await response.json();
                    console.log('Templates API test:', result);
                    alert(`Templates API test: ${result.success ? 'Success' : 'Failed'} - Found ${result.templates?.length || 0} templates`);
                  } catch (error) {
                    console.error('Templates API test error:', error);
                    alert('Templates API test failed');
                  }
                }}
                className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
              >
                Test API
              </button>
              
              <button
                onClick={async () => {
                  try {
                    const testId = 'test-123';
                    const response = await fetch(`/api/test-dynamic/${testId}`);
                    const result = await response.json();
                    console.log('Dynamic route test:', result);
                    alert(`Dynamic route test: ${result.success ? 'Success' : 'Failed'} - Received ID: ${result.receivedId}`);
                  } catch (error) {
                    console.error('Dynamic route test error:', error);
                    alert('Dynamic route test failed');
                  }
                }}
                className="px-3 py-1 bg-purple-600 text-white rounded text-sm hover:bg-purple-700"
              >
                Test Dynamic
              </button>
              
              <button
                onClick={async () => {
                  try {
                    const testId = 'test-template-123';
                    const response = await fetch(`/api/templates/${testId}`);
                    const result = await response.json();
                    console.log('Template by ID test:', result);
                    alert(`Template by ID test: ${result.success ? 'Success' : 'Failed'} - ${result.error || 'Template loaded'}`);
                  } catch (error) {
                    console.error('Template by ID test error:', error);
                    alert('Template by ID test failed');
                  }
                }}
                className="px-3 py-1 bg-orange-600 text-white rounded text-sm hover:bg-orange-700"
              >
                Test Template ID
              </button>
              
              {selectedTemplate && (
                <button
                  onClick={() => {
                    setSelectedTemplate(null);
                    setFormData({});
                  }}
                  className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors text-sm font-medium"
                >
                  ← Back to Templates
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto p-6">
        {!selectedTemplate ? (
          // Template Selection
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-6">Select a Template</h2>
            
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">📋</div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Templates Available</h3>
                <p className="text-gray-500 mb-4">
                  Create templates using the Designer app first.
                </p>
                <button
                  onClick={() => selectTemplate('test-template-123')}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  Test with Sample Template
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow cursor-pointer"
                    onClick={() => selectTemplate(template.id)}
                  >
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">{template.name}</h3>
                    {template.description && (
                      <p className="text-gray-600 text-sm mb-4">{template.description}</p>
                    )}
                    
                    <div className="space-y-2 text-sm text-gray-500">
                      <div className="flex justify-between">
                        <span>Fields:</span>
                        <span>{template.prefixes.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Elements:</span>
                        <span>{template.elements.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Created:</span>
                        <span>{new Date(template.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="flex flex-wrap gap-1">
                        {template.prefixes.slice(0, 3).map((prefix) => (
                          <span
                            key={prefix.id}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs"
                          >
                            {prefix.name}
                          </span>
                        ))}
                        {template.prefixes.length > 3 && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs">
                            +{template.prefixes.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          // Certificate Generation Form
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-6">
                Generate: {selectedTemplate.name}
              </h2>
              
              {selectedTemplate.description && (
                <p className="text-gray-600 text-sm mb-6">{selectedTemplate.description}</p>
              )}

              <div className="space-y-4">
                {selectedTemplate.prefixes.map((prefix) => (
                  <div key={prefix.id}>
                    <label className="block text-gray-700 text-sm font-semibold mb-2">
                      {prefix.name}
                      <span className="text-red-500 ml-1">*</span>
                      <span className="text-gray-500 font-normal ml-2 capitalize">({prefix.type})</span>
                    </label>
                    <input
                      type={prefix.type === 'date' ? 'date' : 'text'}
                      value={formData[prefix.id] || ''}
                      onChange={(e) => handleFormChange(prefix.id, e.target.value)}
                      placeholder={`Enter ${prefix.name.toLowerCase()}`}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                      required
                    />
                  </div>
                ))}
              </div>

              {/* Download Options */}
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h4 className="font-medium text-gray-700 mb-3">Download Options</h4>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={includeMetadata}
                    onChange={(e) => setIncludeMetadata(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  Include metadata page (template info, generation date)
                </label>
              </div>

              <button
                onClick={generatePDF}
                disabled={!isFormValid || isGenerating}
                className="w-full mt-6 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    Generating Certificate...
                  </>
                ) : (
                  <>
                    <span>⬇️</span>
                    Generate Certificate
                  </>
                )}
              </button>

              {!isFormValid && (
                <p className="text-center text-red-500 text-sm mt-4">
                  Please fill in all required fields
                </p>
              )}
            </div>

            {/* Preview */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Preview</h3>
              
              <div className="bg-gray-100 rounded-lg p-4 aspect-[4/3] flex items-center justify-center">
                {selectedTemplate.bgImage ? (
                  <div className="relative w-full h-full">
                    <img
                      src={selectedTemplate.bgImage}
                      alt="Certificate background"
                      className="w-full h-full object-contain rounded"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-black bg-opacity-50 text-white px-3 py-1 rounded text-sm">
                        Certificate Preview
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <div className="text-4xl mb-2">📄</div>
                    <p>No background image</p>
                  </div>
                )}
              </div>

              <div className="mt-4 space-y-2 text-sm text-gray-600">
                <div className="flex justify-between">
                  <span>Template:</span>
                  <span>{selectedTemplate.name}</span>
                </div>
                <div className="flex justify-between">
                  <span>Fields:</span>
                  <span>{selectedTemplate.prefixes.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Elements:</span>
                  <span>{selectedTemplate.elements.length}</span>
                </div>
                <div className="flex justify-between">
                  <span>Size:</span>
                  <span>{selectedTemplate.canvasDimensions?.width || 0}×{selectedTemplate.canvasDimensions?.height || 0}</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};