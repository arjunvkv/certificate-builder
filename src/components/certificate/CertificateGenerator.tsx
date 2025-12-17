'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { useCertificateStore } from '@/store/certificateStore';
import { downloadPDFWithMetadata } from '@/utils/fileUtils';

export const CertificateGenerator = () => {
  const {
    prefixes,
    setActiveSection,
    updatePrefix,
    setPreviewMode,
    bgImage,
    elements,
    canvasDimensions,
    certificateCode
  } = useCertificateStore();
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeMetadata, setIncludeMetadata] = useState(false);

  useEffect(() => {
    const initialData: Record<string, string> = {};
    prefixes.forEach(prefix => {
      initialData[prefix.id] = prefix.value;
    });
    setFormData(initialData);
  }, [prefixes]);

  const handleChange = (id: string, value: string) => {
    setFormData(prev => ({ ...prev, [id]: value }));
    updatePrefix(id, { value });
  };

  const handlePreview = () => {
    // Update all the form values in the prefixes
    Object.keys(formData).forEach(key => {
      updatePrefix(key, { value: formData[key] });
    });

    setPreviewMode(true);
    setActiveSection('creator');
  };

  const handleDownload = async () => {
    if (!bgImage) {
      alert('Please upload a background image first');
      return;
    }

    setIsGenerating(true);

    // Update all the form values in the prefixes
    Object.keys(formData).forEach(key => {
      updatePrefix(key, { value: formData[key] });
    });

    // Switch to creator to access the canvas, but keep current preview mode
    setActiveSection('creator');

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

    // Wait longer for UI to update and ensure element is rendered
    const attemptCapture = async (attempts = 0) => {
      const element = document.getElementById('certificate-capture-area');
      if (!element) {
        if (attempts < 5) {
          setTimeout(() => attemptCapture(attempts + 1), 200);
          return;
        }
        console.error('Certificate capture area not found after multiple attempts');
        alert('Error: Certificate canvas not found. Please try again.');
        setIsGenerating(false);
        return;
      }

      // Check if element is visible and has content
      const rect = element.getBoundingClientRect();
      const isVisible = rect.width > 0 && rect.height > 0;
      const hasContent = element.children.length > 0;

      console.log('Certificate element:', element);
      console.log('Element visible:', isVisible);
      console.log('Element children count:', element.children.length);
      console.log('Element innerHTML length:', element.innerHTML.length);
      console.log('Elements array:', elements);
      console.log('Background image:', bgImage);

      if (!isVisible || !hasContent) {
        if (attempts < 5) {
          setTimeout(() => attemptCapture(attempts + 1), 200);
          return;
        }
        console.error('Certificate capture area is not ready');
        alert('Error: Certificate canvas is not ready. Please ensure you have a background image and elements.');
        setIsGenerating(false);
        return;
      }

      // Wait for any pending updates to complete
      await new Promise(resolve => setTimeout(resolve, 500));

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
        const imagePromises = Array.from(clonedElement.querySelectorAll('img')).map(img => {
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
          width: Math.ceil(canvasDimensions.width),
          height: Math.ceil(canvasDimensions.height),
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
          orientation: canvasDimensions.width > canvasDimensions.height ? 'landscape' : 'portrait',
          unit: 'pt',
          format: [Math.ceil(canvasDimensions.width * 0.75), Math.ceil(canvasDimensions.height * 0.75)]
        });

        // Add the image to the PDF
        pdf.addImage(imgData, 'JPEG', 0, 0,
          Math.ceil(canvasDimensions.width * 0.75),
          Math.ceil(canvasDimensions.height * 0.75)
        );

        // Download PDF with optional metadata if certificate code exists
        const fileName = `certificate-${formData['name'] || 'generated'}.pdf`;
        if (certificateCode) {
          await downloadPDFWithMetadata(pdf, certificateCode, fileName, includeMetadata);
        } else {
          // Fallback to regular PDF download
          pdf.save(fileName);
        }

        setIsGenerating(false);

      } catch (error) {
        console.error('PDF generation failed:', error);
        alert('Error generating PDF. Please try again.');
        setIsGenerating(false);
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

    setTimeout(() => attemptCapture(), 1200); // Start capture attempts to ensure rendering
  };

  const isFormValid = prefixes.every(prefix => formData[prefix.id]?.trim());

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
      <div className="flex-1 bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-2">Generate Certificate</h2>
            <p className="text-gray-600">Fill in the details to create your personalized certificate</p>
          </div>

          {!bgImage && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center gap-2 text-yellow-800">
                <span>⚠️</span>
                <span className="font-medium">No background image uploaded</span>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                Please go to the Designer tab and upload a background image first.
              </p>
            </div>
          )}

          <div className="space-y-6">
            {prefixes.map((prefix) => (
              <div key={prefix.id}>
                <label className="block text-gray-700 text-sm font-semibold mb-2">
                  {prefix.name}
                  <span className="text-red-500 ml-1">*</span>
                  <span className="text-gray-500 font-normal ml-2 capitalize">({prefix.type})</span>
                </label>
                <input
                  type={prefix.type === 'date' ? 'date' : 'text'}
                  value={formData[prefix.id] || ''}
                  onChange={(e) => handleChange(prefix.id, e.target.value)}
                  placeholder={`Enter ${prefix.name.toLowerCase()}`}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors text-black"
                  required
                />
              </div>
            ))}
          </div>

          {prefixes.length === 0 && (
            <div className="text-center py-8">
              <div className="text-gray-400 text-6xl mb-4">📝</div>
              <h3 className="text-lg font-semibold text-gray-600 mb-2">No Dynamic Fields</h3>
              <p className="text-gray-500">
                Go to the Designer tab to add dynamic fields to your certificate.
              </p>
            </div>
          )}

          {/* Download Options */}
          {certificateCode && (
            <div className="mt-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-3">Download Options</h4>
              <label className="flex items-center gap-2 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={includeMetadata}
                  onChange={(e) => setIncludeMetadata(e.target.checked)}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                Include metadata page (certificate code, source files, generation date)
              </label>
            </div>
          )}

          <div className="mt-8 flex gap-4 justify-center">
            <button
              onClick={handlePreview}
              disabled={!isFormValid || !bgImage}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              <span>👁️</span>
              Preview Certificate
            </button>
            
            <button
              onClick={handleDownload}
              disabled={!isFormValid || !bgImage || isGenerating}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {isGenerating ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Generating...
                </>
              ) : (
                <>
                  <span>⬇️</span>
                  Download PDF
                </>
              )}
            </button>
          </div>

          {!isFormValid && prefixes.length > 0 && (
            <p className="text-center text-red-500 text-sm mt-4">
              Please fill in all required fields to continue
            </p>
          )}
        </div>

        {/* Certificate Preview Card */}
        {bgImage && (
          <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Certificate Preview</h3>
            <div className="bg-gray-100 rounded-lg p-4">
              <div className="text-sm text-gray-600 space-y-1">
                <p><span className="font-medium">Background:</span> Uploaded ✓</p>
                <p><span className="font-medium">Elements:</span> {elements.length} element(s)</p>
                <p><span className="font-medium">Dynamic Fields:</span> {prefixes.length} field(s)</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
    </>
  );
};