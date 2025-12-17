'use client';

import { useState } from 'react';
import { Editor } from '@tinymce/tinymce-react';
import { useDraggable } from '@dnd-kit/core';
import { CertificateElement, Prefix } from './types';

interface DraggableElementProps {
  element: CertificateElement;
  isSelected: boolean;
  previewMode: boolean;
  onUpdateElement: (id: string, updates: Partial<CertificateElement>) => void;
  setSelected: (id: string) => void;
  prefixes: Prefix[];
}

export const DraggableElement = ({
  element,
  isSelected,
  previewMode,
  onUpdateElement,
  setSelected,
  prefixes
}: DraggableElementProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: element.id,
    data: {
      type: element.type,
      element,
    },
    disabled: previewMode || isEditing,
  });

  const handleSelect = () => {
    if (!previewMode) {
      setSelected(element.id);
    }
  };

  // Replace prefix placeholders in content
  const replacePlaceholders = (content: string) => {
    let result = content;
    prefixes.forEach(prefix => {
      result = result.replace(new RegExp(`\\{\\{${prefix.name}\\}\\}`, 'g'), prefix.value);
    });
    return result;
  };

  if (element.type === 'text') {
    // Always show replaced content for consistency
    const displayContent = replacePlaceholders(element.content);

    if (previewMode) {
      return (
        <div
          ref={setNodeRef}
          className="w-full h-full"
          style={{
            color: element.color,
            fontFamily: element.fontFamily,
            fontSize: `${element.fontSize}px`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          dangerouslySetInnerHTML={{ __html: displayContent }}
        />
      );
    }

    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`w-full h-full ${
          isSelected
            ? 'border-2 border-blue-500'
            : 'border-2 border-transparent hover:border-gray-400'
        } ${isDragging ? 'opacity-50' : ''}`}
        onClick={handleSelect}
      >
        {isEditing ? (
          <Editor
            apiKey={undefined} // Use the free version without API key
            value={element.content}
            init={{
              menubar: false,
              plugins: 'paste lists link image',
              toolbar: 'bold italic underline | fontsizeselect | forecolor backcolor | alignleft aligncenter alignright | image',
              inline: true,
              skin: 'oxide',
              content_css: 'default',
              height: '100%',
              branding: false,
              resize: false,
              toolbar_mode: 'floating',
              image_dimensions: false,
              image_advtab: true,
              image_class_list: [
                { title: 'None', value: '' },
                { title: 'Responsive', value: 'img-responsive' }
              ]
            }}
            onEditorChange={(content) => onUpdateElement(element.id, { content })}
            onBlur={() => setIsEditing(false)}
          />
        ) : (
          <div
            onClick={() => setIsEditing(true)}
            className={`w-full h-full relative ${
              element.content !== displayContent 
                ? 'bg-blue-50' 
                : ''
            }`}
          >
            <div
              className="w-full h-full flex items-center justify-center"
              style={{
                color: element.color,
                fontFamily: element.fontFamily,
                fontSize: `${element.fontSize}px`,
              }}
              dangerouslySetInnerHTML={{ __html: displayContent }}
            />
            {element.content !== displayContent && (
              <div className="absolute top-0 right-0 bg-blue-500 text-white text-xs px-1 rounded-bl text-[10px]">
                🔄
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  if (element.type === 'image') {
    if (previewMode) {
      return (
        <div ref={setNodeRef} className="w-full h-full">
          {element.src && (
            <img
              src={element.src}
              alt="Certificate Element"
              className="w-full h-full object-cover"
            />
          )}
        </div>
      );
    }

    return (
      <div
        ref={setNodeRef}
        {...listeners}
        {...attributes}
        className={`w-full h-full ${
          isSelected
            ? 'border-2 border-blue-500'
            : 'border-2 border-transparent hover:border-gray-400'
        } ${isDragging ? 'opacity-50' : ''}`}
        onClick={handleSelect}
      >
        {element.src ? (
          <img
            src={element.src}
            alt="Certificate Element"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200 text-gray-500">
            [Image]
          </div>
        )}
      </div>
    );
  }

  return null;
};