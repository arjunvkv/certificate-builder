'use client';

import { useCertificateStore } from '@/store/certificateStore';
import { CertificateCreator } from './CertificateCreator';
import { CertificateGenerator } from './CertificateGenerator';
import { Sidebar } from './Sidebar';
import { useImagePersistence } from '@/hooks/useImagePersistence';

export const CertificateBuilder = () => {
  const { 
    activeSection, 
    setActiveSection, 
    convertBgImageToBase64, 
    convertElementImagesToBase64,
    reset
  } = useCertificateStore();
  
  // Enable automatic image persistence
  useImagePersistence();

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
      {/* Header Navigation */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Certificate Builder</h1>
              <p className="text-gray-600 text-sm">Create professional certificates with ease</p>
            </div>
            
            <div className="flex items-center gap-4">
              <button
                id="save-button"
                onClick={handleManualSave}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <span>💾</span>
                Save Progress
              </button>
              
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to reset all data? This will clear all images and settings.')) {
                    reset();
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <span>🗑️</span>
                Reset
              </button>
              
              <nav className="flex bg-gray-100 rounded-lg p-1">
                <button
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === 'creator'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setActiveSection('creator')}
                >
                  Designer
                </button>
                <button
                  className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                    activeSection === 'downloader'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                  onClick={() => setActiveSection('downloader')}
                >
                  Generator
                </button>
              </nav>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex">
        <Sidebar />
        {activeSection === 'creator' ? <CertificateCreator /> : <CertificateGenerator />}
      </div>
    </div>
  );
};