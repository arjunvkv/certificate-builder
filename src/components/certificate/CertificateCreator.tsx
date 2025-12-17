'use client';

import { useState, useRef, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useCertificateStore } from '@/store/certificateStore';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
  KeyboardSensor,
} from '@dnd-kit/core';
import { CertificateElement } from './types';
import { DraggableElement } from './DraggableElement';
import { saveFileWithCode, downloadPDFWithMetadata } from '@/utils/fileUtils';

export const CertificateCreator = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  const {
    bgImage,
    bgFile,
    bgFileName,
    bgFileSize,
    certificateCode,
    canvasDimensions,
    elements,
    prefixes,
    selectedElement,
    previewMode,
    setBgImage,
    setBgFile,
    setBgFileMetadata,
    setCertificateCode,
    generateNewCertificateCode,
    convertBgImageToBase64,
    convertElementImagesToBase64,
    setCanvasDimensions,
    scaleElementsToFitCanvas,
    updateElement,
    setSelectedElement,
    setPreviewMode
  } = useCertificateStore();
  
  // DnD state
  const [activeElement, setActiveElement] = useState<CertificateElement | null>(null);
  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 100,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );
  
  // State
  const [includeMetadata, setIncludeMetadata] = useState(false);
  
  // Refs
  const fileInputRef = useRef<HTMLInputElement>(null);
  const certificateRef = useRef<HTMLDivElement>(null);
  const bgImageRef = useRef<HTMLImageElement>(null); // Reference for background image to get its dimensions

  // Hydration check
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Clean up object URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      if (bgImage) {
        URL.revokeObjectURL(bgImage);
      }
      
      elements.forEach(element => {
        if (element.type === 'image' && element.src && element.src.startsWith('blob:')) {
          URL.revokeObjectURL(element.src);
        }
      });
    };
  }, [bgImage, elements]);

  // Show loading state during hydration
  if (!isHydrated) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-gray-600">Loading Certificate Creator...</p>
        </div>
      </div>
    );
  }

  // Handle drag start
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const element = elements.find(el => el.id === active.id) || null;
    setActiveElement(element);
    if (element) {
      setSelectedElement(element.id);
    }
  };

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;

    const element = elements.find(el => el.id === active.id);
    if (element) {
      const newX = Math.max(0, Math.min((canvasDimensions?.width || 1123) - element.width, element.x + delta.x));
      const newY = Math.max(0, Math.min((canvasDimensions?.height || 794) - element.height, element.y + delta.y));

      updateElement(active.id as string, {
        x: newX,
        y: newY
      });
    }

    setActiveElement(null);
  };

  // Handle file upload for background
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      if (bgImage) {
        URL.revokeObjectURL(bgImage);
      }

      const localUrl = URL.createObjectURL(file);

      // Create an image to get its dimensions
      const img = new Image();
      img.onload = async () => {
        try {
          // Generate or use existing certificate code
          const code = certificateCode || generateNewCertificateCode();
          
          // Save file to server with unique code
          await saveFileWithCode(file, code);
          
          // Set canvas dimensions to match the image, with a maximum size
          const maxWidth = 1123; // A4 width in pixels at 96 DPI
          const maxHeight = 794; // A4 height in pixels at 96 DPI

          // Maintain aspect ratio while fitting within constraints
          let { width, height } = img;
          const aspectRatio = width / height;

          if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
          }

          if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
          }

          // Scale existing elements to fit the new canvas dimensions
          scaleElementsToFitCanvas(canvasDimensions?.width || 1123, canvasDimensions?.height || 794, width, height);

          setCanvasDimensions(width, height);
          setBgImage(localUrl);
          setBgFile(file);
          setBgFileMetadata(file);
          
          // Convert to base64 for persistence after a short delay
          setTimeout(() => {
            convertBgImageToBase64();
          }, 1000);
        } catch (error) {
          console.error('Error saving background image:', error);
          alert('Error saving background image. Using local version only.');
          
          // Continue with local processing even if server save fails
          const maxWidth = 1123;
          const maxHeight = 794;
          let { width, height } = img;
          const aspectRatio = width / height;

          if (width > maxWidth) {
            width = maxWidth;
            height = width / aspectRatio;
          }

          if (height > maxHeight) {
            height = maxHeight;
            width = height * aspectRatio;
          }

          scaleElementsToFitCanvas(canvasDimensions?.width || 1123, canvasDimensions?.height || 794, width, height);
          setCanvasDimensions(width, height);
          setBgImage(localUrl);
          setBgFile(file);
          setBgFileMetadata(file);
          
          // Convert to base64 for persistence after a short delay
          setTimeout(() => {
            convertBgImageToBase64();
          }, 1000);
        }
      };

      img.onerror = () => {
        alert('Error loading image. Please try another image file.');
        URL.revokeObjectURL(localUrl);
      };

      img.src = localUrl;
    } else {
      alert('Please select a valid image file (JPEG, PNG, etc.)');
    }
  };

  // Trigger file input for background
  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // Toggle preview mode
  const togglePreviewMode = () => {
    setPreviewMode(!previewMode);
    if (!previewMode) {
      setSelectedElement(null); // Deselect when entering preview
    }
  };

  // Convert blob URLs to data URLs for better PDF generation
  const convertBlobToDataURL = (blob: string): Promise<string> => {
    return new Promise((resolve) => {
      if (!blob.startsWith('blob:')) {
        resolve(blob);
        return;
      }

      fetch(blob)
        .then(response => response.blob())
        .then(blobData => {
          const reader = new FileReader();
          reader.onload = () => {
            resolve(reader.result as string);
          };
          reader.onerror = () => resolve(blob);
          reader.readAsDataURL(blobData);
        })
        .catch(() => {
          // Fallback to canvas method
          const img = new Image();
          img.crossOrigin = 'anonymous';
          img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              ctx.drawImage(img, 0, 0);
              resolve(canvas.toDataURL('image/jpeg', 0.9));
            } else {
              resolve(blob);
            }
          };
          img.onerror = () => resolve(blob);
          img.src = blob;
        });
    });
  };

  // Convert TinyMCE content with inline images to use data URLs
  const convertTinyMCEContentImages = async (content: string): Promise<string> => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(content, 'text/html');
    const images = doc.querySelectorAll('img');

    for (const img of Array.from(images)) {
      const src = img.getAttribute('src');
      if (src && src.startsWith('blob:')) {
        const dataURL = await convertBlobToDataURL(src);
        img.setAttribute('src', dataURL);
      }
    }

    return new XMLSerializer().serializeToString(doc.body).replace('<body>', '').replace('</body>', '');
  };

  // Download PDF
  const downloadPDF = async () => {
    if (!certificateRef.current) {
      alert('Certificate canvas not ready. Please try again.');
      return;
    }

    // Don't switch to preview mode, keep current state
    setSelectedElement(null);

    // Wait for images to load before generating PDF
    const waitForImages = async () => {
      const allImages = document.querySelectorAll('#certificate-capture-area img');
      const imagePromises = Array.from(allImages).map((element) => {
        const img = element as HTMLImageElement;
        if (img.complete) return Promise.resolve();

        return new Promise((resolve, reject) => {
          img.onload = () => resolve(undefined);
          img.onerror = () => resolve(undefined); // Still resolve to continue even if image fails to load
          // Set a timeout to prevent hanging
          setTimeout(() => resolve(undefined), 5000);
        });
      });
      return Promise.all(imagePromises);
    };

    try {
      await waitForImages();
      await generatePDF();
    } catch (error) {
      console.error('Error waiting for images to load:', error);
      await generatePDF();
    }
  };

  const generatePDF = async () => {
    const element = document.getElementById('certificate-capture-area');
    if (!element) {
      console.error('Certificate capture area not found');
      alert('Error: Certificate canvas not found. Please try again.');
      return;
    }

    // Check if element has content
    const hasContent = element.children.length > 0;
    console.log('Certificate element:', element);
    console.log('Element children count:', element.children.length);
    console.log('Element innerHTML length:', element.innerHTML.length);

    if (!hasContent) {
      console.error('Certificate capture area is empty');
      alert('Error: Certificate canvas is empty. Please ensure you have a background image and elements.');
      return;
    }

    // Temporarily add a class for PDF generation to remove extra styling
    element.classList.add('pdf-generation-mode');

    // Wait for any pending TinyMCE updates to complete
    await new Promise(resolve => setTimeout(resolve, 300));

    // Create a temporary container with just the content we want to capture
    const clonedElement = element.cloneNode(true) as HTMLElement;
    clonedElement.style.position = 'fixed';
    clonedElement.style.left = '-9999px';
    clonedElement.style.top = '0';
    clonedElement.style.zIndex = '-9999';
    clonedElement.classList.add('pdf-generation-mode');

    // Replace any blob URLs in the cloned element with data URLs to ensure proper rendering
    const imageElements = clonedElement.querySelectorAll('img');
    const originalSrcs: { element: HTMLImageElement; originalSrc: string }[] = [];

    for (const img of Array.from(imageElements)) {
      const originalSrc = img.src;
      if (originalSrc.startsWith('blob:')) {
        originalSrcs.push({ element: img, originalSrc });

        // Convert blob URL to data URL
        try {
          const response = await fetch(originalSrc);
          const blob = await response.blob();
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => resolve(originalSrc); // fallback to original src if conversion fails
            reader.readAsDataURL(blob);
          });
          img.src = dataUrl;
        } catch (error) {
          console.warn('Failed to convert blob to data URL, using original:', error);
          img.src = originalSrc;
        }
      }
    }

    document.body.appendChild(clonedElement);

    try {
      // Wait for cloned images to load
      const imagePromises = Array.from(clonedElement.querySelectorAll('img')).map((element) => {
        const img = element as HTMLImageElement;
        if (img.complete) return Promise.resolve();

        return new Promise((resolve) => {
          const timeout = setTimeout(() => resolve(undefined), 5000);
          img.onload = () => {
            clearTimeout(timeout);
            resolve(undefined);
          };
          img.onerror = () => {
            clearTimeout(timeout);
            resolve(undefined);
          };
        });
      });

      await Promise.all(imagePromises);

      // Use html2canvas to capture the cloned element
      const canvas = await html2canvas(clonedElement, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        width: Math.ceil(canvasDimensions?.width || 1123),
        height: Math.ceil(canvasDimensions?.height || 794),
        scrollX: 0,
        scrollY: 0,
        x: 0,
        y: 0,
        foreignObjectRendering: false, // Disable foreign object rendering to avoid dark mode issues
        removeContainer: true,
        // Add these options for better rendering
        ignoreElements: (element) => element.classList.contains('drag-overlay'),
        // Force light mode styles
        onclone: (clonedDoc) => {
          // Remove dark mode styles from the cloned document
          const style = clonedDoc.createElement('style');
          style.textContent = `
            * {
              color-scheme: light !important;
            }
            :root {
              --background: #ffffff !important;
              --foreground: #171717 !important;
            }
            body {
              background: #ffffff !important;
              color: #171717 !important;
            }
            #certificate-capture-area {
              background: #ffffff !important;
              color: #171717 !important;
            }
            .pdf-generation-mode * {
              background-color: transparent !important;
            }
            .pdf-generation-mode {
              background: #ffffff !important;
            }
          `;
          clonedDoc.head.appendChild(style);
        }
      });

      // Create PDF with the canvas dimensions
      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({
        orientation: (canvasDimensions?.width || 1123) > (canvasDimensions?.height || 794) ? 'landscape' : 'portrait',
        unit: 'pt',
        format: [Math.ceil((canvasDimensions?.width || 1123) * 0.75), Math.ceil((canvasDimensions?.height || 794) * 0.75)]
      });

      // Add the image to the PDF
      pdf.addImage(imgData, 'JPEG', 0, 0,
        Math.ceil((canvasDimensions?.width || 1123) * 0.75),
        Math.ceil((canvasDimensions?.height || 794) * 0.75)
      );

      // Download PDF with optional metadata if certificate code exists
      if (certificateCode) {
        await downloadPDFWithMetadata(pdf, certificateCode, 'certificate.pdf', includeMetadata);
      } else {
        // Fallback to regular PDF download
        pdf.save('certificate.pdf');
      }
    } catch (error) {
      console.error('PDF generation failed:', error);
      alert('Error generating PDF. Please try again.');
    } finally {
      // Clean up the cloned element
      if (clonedElement.parentNode) {
        clonedElement.parentNode.removeChild(clonedElement);
      }

      // Restore original sources after PDF generation
      originalSrcs.forEach(({ element, originalSrc }) => {
        element.src = originalSrc;
      });

      // Remove the PDF generation class after completion
      element.classList.remove('pdf-generation-mode');
    }
  };

  return (
    <>
      <style jsx global>{`
        #certificate-capture-area.pdf-generation-mode {
          box-shadow: none !important;
          border: none !important;
          background: #ffffff !important;
          color: #171717 !important;
        }
        #certificate-capture-area.pdf-generation-mode * {
          color-scheme: light !important;
        }
        .pdf-generation-mode {
          background: #ffffff !important;
          color: #171717 !important;
        }
        .pdf-generation-mode * {
          background-color: transparent !important;
        }
      `}</style>
      <div className="flex-1 flex flex-col bg-gray-50">
      {/* Top Toolbar */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-800">Certificate Designer</h2>
            <p className="text-sm text-gray-600">
              {bgImage ? 'Drag elements to position them on your certificate' : 'Start by uploading a background image'}
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <button
              onClick={triggerFileInput}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <span>📁</span>
              {bgImage ? 'Change Background' : 'Upload Background'}
            </button>
            
            <button
              onClick={togglePreviewMode}
              className={`px-4 py-2 rounded-lg transition-colors flex items-center gap-2 ${
                previewMode 
                  ? 'bg-orange-500 text-white hover:bg-orange-600' 
                  : 'bg-gray-600 text-white hover:bg-gray-700'
              }`}
            >
              <span>{previewMode ? '✏️' : '👁️'}</span>
              {previewMode ? 'Edit Mode' : 'Preview'}
            </button>
            
            {certificateCode && (
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Include metadata
              </label>
            )}
            
            <button
              onClick={downloadPDF}
              disabled={!bgImage}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <span>⬇️</span>
              Download PDF
            </button>
          </div>
        </div>
        
        {bgFileName && (
          <div className="mt-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Background:</span> {bgFileName} 
              <span className="text-blue-600 ml-2">({bgFileSize ? (bgFileSize / 1024).toFixed(1) : '0'} KB)</span>
            </p>
          </div>
        )}
      </div>

      {/* Main Content Area */}
      <div className="flex-1">
        {/* Certificate Canvas */}
        <div className="flex-1 p-6 overflow-auto">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
          >
            <div className="flex justify-center">
              <div
                id="certificate-capture-area"
                ref={certificateRef}
                className={`relative bg-white`}
                data-preview-mode={previewMode}
                style={{
                  width: `${canvasDimensions?.width || 1123}px`,
                  height: `${canvasDimensions?.height || 794}px`,
                  // Ensure no extra spacing or margins affect PDF capture
                  margin: 0,
                  padding: 0,
                  boxSizing: 'border-box',
                  backgroundColor: '#ffffff', // Force white background
                  color: '#171717', // Force dark text
                  boxShadow: previewMode ? 'none' : '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)', // Only show shadow in edit mode
                  border: previewMode ? 'none' : '2px dashed #d1d5db' // Only show border in edit mode
                }}
                onClick={() => !previewMode && setSelectedElement(null)}
              >
                {/* Background Image */}
                {bgImage ? (
                  <img
                    ref={bgImageRef}
                    src={bgImage}
                    alt="Certificate Background"
                    className="w-full h-full object-contain"
                    style={{ objectFit: 'contain' }} // Maintain aspect ratio
                  />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 border-2 border-dashed border-gray-300">
                    <div className="text-center">
                      <div className="text-6xl mb-4">📄</div>
                      <h3 className="text-xl font-semibold text-gray-700 mb-2">No Background Image</h3>
                      <p className="text-gray-500 mb-4">Upload a background image to get started</p>
                      <button
                        onClick={triggerFileInput}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Choose Background Image
                      </button>
                    </div>
                  </div>
                )}
                
                {/* Certificate Elements */}
                {elements.map((element) => (
                  <div
                    key={element.id}
                    data-id={element.id}
                    data-element-type={element.type}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!previewMode) {
                        setSelectedElement(element.id);
                      }
                    }}
                    className={`absolute ${!previewMode ? 'cursor-move' : ''} ${
                      selectedElement === element.id && !previewMode ? 'z-10' : ''
                    }`}
                    style={{
                      left: `${element.x}px`,
                      top: `${element.y}px`,
                      width: `${element.width}px`,
                      height: `${element.height}px`,
                      position: 'absolute',
                      zIndex: previewMode ? 1 : (selectedElement === element.id ? 10 : 1)
                    }}
                  >
                    <DraggableElement
                      element={element}
                      isSelected={selectedElement === element.id && !previewMode}
                      previewMode={previewMode}
                      onUpdateElement={updateElement}
                      setSelected={setSelectedElement}
                      prefixes={prefixes}
                    />
                  </div>
                ))}
              </div>
            </div>
            
            <DragOverlay>
              {activeElement ? (
                <div
                  className="border-2 border-blue-500 bg-white shadow-lg opacity-90 rounded"
                  style={{
                    width: `${activeElement.width}px`,
                    height: `${activeElement.height}px`,
                  }}
                >
                  {activeElement.type === 'text' ? (
                    <div className="w-full h-full flex items-center justify-center text-gray-700 p-2">
                      <span className="truncate">{activeElement.content}</span>
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 rounded">
                      <span className="text-gray-500">🖼️ Image</span>
                    </div>
                  )}
                </div>
              ) : null}
            </DragOverlay>
          </DndContext>
        </div>
      </div>
      
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
    </>
  );
};