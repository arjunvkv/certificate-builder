'use client';

import { useCertificateStore } from '@/store/certificateStore';

export const ElementPropertiesPanel = () => {
  const { selectedElement, elements, updateElement, removeElement } = useCertificateStore();
  
  const element = elements.find(el => el.id === selectedElement);
  
  if (!element) {
    return (
      <div className="w-80 bg-white border-l border-gray-200 p-4">
        <h3 className="text-lg font-semibold mb-4">Properties</h3>
        <p className="text-gray-500">Select an element to edit its properties</p>
      </div>
    );
  }

  return (
    <div className="w-80 bg-white border-l border-gray-200 p-4 overflow-y-auto">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">Properties</h3>
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
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Y</label>
              <input
                type="number"
                value={element.y}
                onChange={(e) => updateElement(element.id, { y: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 border rounded text-sm"
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
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">Height</label>
              <input
                type="number"
                value={element.height}
                onChange={(e) => updateElement(element.id, { height: parseInt(e.target.value) || 0 })}
                className="w-full px-2 py-1 border rounded text-sm"
              />
            </div>
          </div>
        </div>

        {/* Text-specific properties */}
        {element.type === 'text' && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Font Size</label>
              <input
                type="number"
                value={element.fontSize}
                onChange={(e) => updateElement(element.id, { fontSize: parseInt(e.target.value) || 12 })}
                className="w-full px-2 py-1 border rounded text-sm"
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
                className="w-full px-2 py-1 border rounded text-sm"
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
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = URL.createObjectURL(file);
                  updateElement(element.id, { src: url, file });
                }
              }}
              className="w-full px-2 py-1 border rounded text-sm"
            />
          </div>
        )}
      </div>
    </div>
  );
};