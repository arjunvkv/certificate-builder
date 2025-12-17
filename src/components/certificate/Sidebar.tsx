'use client';

import { useState } from 'react';
import { useCertificateStore } from '@/store/certificateStore';
import { TextField, ImageElement } from './types';
import { saveFileWithCode } from '@/utils/fileUtils';

export const Sidebar = () => {
  const {
    prefixes,
    addPrefix,
    updatePrefix,
    removePrefix,
    addElement,
    updateElement,
    removeElement,
    elements,
    bgImage,
    selectedElement,
    setSelectedElement,
    activeSection,
    certificateCode,
    generateNewCertificateCode,
    convertElementImagesToBase64
  } = useCertificateStore();
  
  const [newPrefixName, setNewPrefixName] = useState('');
  const [newPrefixType, setNewPrefixType] = useState<'name' | 'course' | 'organization' | 'date' | 'other'>('other');
  const [newPrefixValue, setNewPrefixValue] = useState('');

  const handleAddPrefix = () => {
    if (newPrefixName.trim()) {
      addPrefix({
        id: `prefix-${Date.now()}`,
        name: newPrefixName,
        value: newPrefixValue || newPrefixName,
        type: newPrefixType
      });
      setNewPrefixName('');
      setNewPrefixValue('');
    }
  };

  const handleAddElement = (type: 'text' | 'image') => {
    if (type === 'text') {
      const newElement: TextField = {
        id: `text-${Date.now()}`,
        type: 'text',
        content: 'Double-click to edit - try {{name}} or {{course}}',
        x: 100,
        y: 100,
        width: 300,
        height: 40,
        fontSize: 16,
        color: '#000000',
        fontFamily: 'Arial'
      };
      
      addElement(newElement);
    } else {
      const newElement: ImageElement = {
        id: `image-${Date.now()}`,
        type: 'image',
        src: null,
        x: 200,
        y: 200,
        width: 150,
        height: 150
      };
      
      addElement(newElement);
    }
  };

  return (
    <div className="w-72 bg-gray-50 border-r border-gray-200 p-4 overflow-y-auto">
      <h2 className="text-xl font-bold mb-6 text-gray-800">
        {activeSection === 'creator' ? 'Design Tools' : 'Certificate Info'}
      </h2>
      
      {/* Quick Start Guide */}
      {!bgImage && activeSection === 'creator' && (
        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-semibold text-blue-800 mb-2">Quick Start</h3>
          <ol className="text-sm text-blue-700 space-y-1">
            <li>1. Upload a background image</li>
            <li>2. Add text and image elements</li>
            <li>3. Customize with placeholders</li>
            <li>4. Preview and download</li>
          </ol>
        </div>
      )}
      
      {/* Add Elements - Only in Creator Mode */}
      {activeSection === 'creator' && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-gray-700">Add Elements</h3>
          <div className="space-y-2">
            <button 
              onClick={() => handleAddElement('text')}
              className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-left flex items-center gap-2 transition-colors"
            >
              <span>📝</span>
              Add Text Element
            </button>
            <button 
              onClick={() => handleAddElement('image')}
              className="w-full px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-left flex items-center gap-2 transition-colors"
            >
              <span>🖼️</span>
              Add Image Element
            </button>
          </div>
        </div>
      )}
      
      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-gray-700">Dynamic Fields</h3>
        {activeSection === 'creator' && (
          <div className="mb-3">
            <p className="text-sm text-gray-600 mb-2">Use {`{{fieldName}}`} in text to create dynamic content</p>
            <p className="text-xs text-blue-600 mb-2">💡 Click field names below to copy placeholders</p>
            {prefixes.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {prefixes.slice(0, 3).map((prefix) => (
                  <button
                    key={prefix.id}
                    onClick={() => navigator.clipboard.writeText(`{{${prefix.name}}}`)}
                    className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors"
                    title="Click to copy"
                  >
                    {`{{${prefix.name}}}`}
                  </button>
                ))}
                {prefixes.length > 3 && (
                  <span className="text-xs text-gray-500 px-2 py-1">+{prefixes.length - 3} more</span>
                )}
              </div>
            )}
          </div>
        )}
        {activeSection === 'downloader' && (
          <p className="text-sm text-gray-600 mb-3">These fields will be filled in the form below</p>
        )}
        
        <div className="space-y-3">
          {prefixes.map((prefix) => (
            <div key={prefix.id} className="bg-white p-3 rounded-lg border border-gray-200">
              <div className="flex justify-between items-start mb-2">
                <button
                  className="font-medium text-gray-800 hover:text-blue-600 transition-colors text-left"
                  onClick={() => {
                    if (activeSection === 'creator') {
                      navigator.clipboard.writeText(`{{${prefix.name}}}`);
                      // You could add a toast notification here
                    }
                  }}
                  title={activeSection === 'creator' ? 'Click to copy placeholder' : ''}
                >
                  {`{{${prefix.name}}}`}
                </button>
                {activeSection === 'creator' && (
                  <button 
                    onClick={() => removePrefix(prefix.id)}
                    className="text-red-500 hover:text-red-700 text-lg leading-none"
                  >
                    ×
                  </button>
                )}
              </div>
              {activeSection === 'creator' ? (
                <input
                  type="text"
                  value={prefix.value}
                  onChange={(e) => updatePrefix(prefix.id, { value: e.target.value })}
                  className="w-full px-2 py-1 rounded border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                  placeholder="Default value"
                />
              ) : (
                <div className="text-sm text-gray-700 font-medium">{prefix.value}</div>
              )}
              <div className="flex justify-between items-center mt-1">
                <span className="text-xs text-gray-500 capitalize">{prefix.type}</span>
                {activeSection === 'creator' && (
                  <span className="text-xs text-blue-500">Click to copy</span>
                )}
              </div>
            </div>
          ))}
        </div>
        
        {activeSection === 'creator' && (
          <div className="mt-4 p-3 bg-white rounded-lg border border-gray-200">
            <h4 className="font-medium mb-2 text-gray-700">Add New Field</h4>
            <input
              type="text"
              value={newPrefixName}
              onChange={(e) => setNewPrefixName(e.target.value)}
              placeholder="Field name (e.g. instructor)"
              className="w-full px-2 py-1 rounded border border-gray-300 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
            <select
              value={newPrefixType}
              onChange={(e) => setNewPrefixType(e.target.value as any)}
              className="w-full px-2 py-1 rounded border border-gray-300 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            >
              <option value="name">Name</option>
              <option value="course">Course</option>
              <option value="organization">Organization</option>
              <option value="date">Date</option>
              <option value="other">Other</option>
            </select>
            <input
              type="text"
              value={newPrefixValue}
              onChange={(e) => setNewPrefixValue(e.target.value)}
              placeholder="Default value"
              className="w-full px-2 py-1 rounded border border-gray-300 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
            />
            <button
              onClick={handleAddPrefix}
              disabled={!newPrefixName.trim()}
              className="w-full px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white rounded-lg transition-colors"
            >
              Add Field
            </button>
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <h3 className="font-semibold mb-3 text-gray-700">Elements ({elements.length})</h3>
        <div className="space-y-2">
          {elements.map((element) => (
            <div 
              key={element.id} 
              className={`bg-white p-2 rounded-lg border text-sm flex items-center justify-between cursor-pointer transition-colors ${
                selectedElement === element.id 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => activeSection === 'creator' && setSelectedElement(element.id)}
            >
              <span className="flex items-center gap-2">
                <span>{element.type === 'text' ? '📝' : '🖼️'}</span>
                {element.type === 'text' ? 'Text' : 'Image'}
              </span>
              <span className="text-xs text-gray-500">#{element.id.split('-')[1]}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Element Properties Panel - Only show in creator mode when element is selected */}
      {activeSection === 'creator' && selectedElement && (() => {
        const element = elements.find(el => el.id === selectedElement);
        if (!element) return null;

        return (
          <div className="mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-gray-700">Properties</h3>
              <button
                onClick={() => removeElement(element.id)}
                className="px-3 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600"
              >
                Delete
              </button>
            </div>
            
            <div className="space-y-4">
              {/* Position */}
              <div>
                <label className="block text-sm font-medium mb-2">Position</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">X</label>
                    <input
                      type="number"
                      value={element.x}
                      onChange={(e) => updateElement(element.id, { x: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border rounded text-sm text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Y</label>
                    <input
                      type="number"
                      value={element.y}
                      onChange={(e) => updateElement(element.id, { y: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border rounded text-sm text-black"
                    />
                  </div>
                </div>
              </div>

              {/* Size */}
              <div>
                <label className="block text-sm font-medium mb-2">Size</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Width</label>
                    <input
                      type="number"
                      value={element.width}
                      onChange={(e) => updateElement(element.id, { width: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border rounded text-sm text-black"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Height</label>
                    <input
                      type="number"
                      value={element.height}
                      onChange={(e) => updateElement(element.id, { height: parseInt(e.target.value) || 0 })}
                      className="w-full px-2 py-1 border rounded text-sm text-black"
                    />
                  </div>
                </div>
              </div>

              {/* Text-specific properties */}
              {element.type === 'text' && (
                <>
                  <div>
                    <label className="block text-sm font-medium mb-2">Text Content</label>
                    <textarea
                      id={`textarea-${element.id}`}
                      value={element.content}
                      onChange={(e) => updateElement(element.id, { content: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm h-20 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 text-black"
                      placeholder="Enter text content..."
                    />
                    <div className="mt-2">
                      <p className="text-xs text-gray-500 mb-1">Quick insert:</p>
                      <div className="flex flex-wrap gap-1">
                        {prefixes.slice(0, 4).map((prefix) => (
                          <button
                            key={prefix.id}
                            onClick={() => {
                              const textarea = document.getElementById(`textarea-${element.id}`) as HTMLTextAreaElement;
                              if (textarea) {
                                const cursorPos = textarea.selectionStart || element.content.length;
                                const textBefore = element.content.substring(0, cursorPos);
                                const textAfter = element.content.substring(cursorPos);
                                const newContent = textBefore + `{{${prefix.name}}}` + textAfter;
                                updateElement(element.id, { content: newContent });
                                // Set focus back to textarea and position cursor after inserted text
                                setTimeout(() => {
                                  textarea.focus();
                                  const newCursorPos = cursorPos + `{{${prefix.name}}}`.length;
                                  textarea.setSelectionRange(newCursorPos, newCursorPos);
                                }, 0);
                              }
                            }}
                            className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded hover:bg-gray-200 transition-colors"
                          >
                            {`{{${prefix.name}}}`}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">Use {`{{fieldName}}`} for dynamic content</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Font Size</label>
                    <input
                      type="number"
                      value={element.fontSize}
                      onChange={(e) => updateElement(element.id, { fontSize: parseInt(e.target.value) || 12 })}
                      className="w-full px-2 py-1 border rounded text-sm text-black"
                      min="8"
                      max="72"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Color</label>
                    <input
                      type="color"
                      value={element.color}
                      onChange={(e) => updateElement(element.id, { color: e.target.value })}
                      className="w-full h-10 border rounded"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Font Family</label>
                    <select
                      value={element.fontFamily}
                      onChange={(e) => updateElement(element.id, { fontFamily: e.target.value })}
                      className="w-full px-2 py-1 border rounded text-sm text-black"
                    >
                      <option value="Arial">Arial</option>
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Verdana">Verdana</option>
                    </select>
                  </div>
                </>
              )}

              {/* Image-specific properties */}
              {element.type === 'image' && (
                <div>
                  <label className="block text-sm font-medium mb-2">Upload New Image</label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        try {
                          // Generate or use existing certificate code
                          const code = certificateCode || generateNewCertificateCode();
                          
                          // Save file to server with unique code
                          await saveFileWithCode(file, code);
                          
                          // Create local URL for immediate display
                          const url = URL.createObjectURL(file);
                          updateElement(element.id, { src: url, file });
                          
                          // Convert to base64 for persistence after a short delay
                          setTimeout(() => {
                            convertElementImagesToBase64();
                          }, 1000);
                        } catch (error) {
                          console.error('Error saving image:', error);
                          // Fallback to local URL only
                          const url = URL.createObjectURL(file);
                          updateElement(element.id, { src: url, file });
                          
                          // Convert to base64 for persistence after a short delay
                          setTimeout(() => {
                            convertElementImagesToBase64();
                          }, 1000);
                        }
                      }
                    }}
                    className="w-full px-2 py-1 border rounded text-sm"
                  />
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* Generator Mode Content */}
      {activeSection === 'downloader' && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-gray-700">Certificate Status</h3>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-600 space-y-1">
              <p><span className="font-medium">Background:</span> {bgImage ? 'Uploaded ✓' : 'Not uploaded'}</p>
              <p><span className="font-medium">Elements:</span> {elements.length} element(s)</p>
              <p><span className="font-medium">Dynamic Fields:</span> {prefixes.length} field(s)</p>
              <p><span className="font-medium">Images Persisted:</span> {
                bgImage && !bgImage.startsWith('blob:') ? 'Yes ✓' : 
                bgImage ? 'Converting...' : 'N/A'
              }</p>
              {certificateCode && (
                <p><span className="font-medium">Certificate Code:</span> {certificateCode}</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Persistence Status for Creator Mode */}
      {activeSection === 'creator' && (bgImage || elements.some(el => el.type === 'image' && (el as any).src)) && (
        <div className="mb-6">
          <h3 className="font-semibold mb-3 text-gray-700">Persistence Status</h3>
          <div className="bg-white p-3 rounded-lg border border-gray-200">
            <div className="text-xs text-gray-600 space-y-1">
              {bgImage && (
                <p><span className="font-medium">Background:</span> {
                  !bgImage.startsWith('blob:') ? '✓ Saved' : '⏳ Converting...'
                }</p>
              )}
              {elements.filter(el => el.type === 'image' && (el as any).src).map((element, index) => {
                const imageElement = element as any;
                return (
                  <p key={element.id}>
                    <span className="font-medium">Image {index + 1}:</span> {
                      imageElement.src && !imageElement.src.startsWith('blob:') ? '✓ Saved' : '⏳ Converting...'
                    }
                  </p>
                );
              })}
              <p className="text-xs text-blue-600 mt-2">
                💡 Images auto-save every 30s and when switching tabs
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};