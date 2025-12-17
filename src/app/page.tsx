import Link from 'next/link';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
      <div className="max-w-4xl mx-auto p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">Certificate System</h1>
          <p className="text-xl text-gray-600">
            Professional certificate creation and generation platform
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Designer App */}
          <Link href="/designer" className="group">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <div className="text-center">
                <div className="text-6xl mb-4">🎨</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Designer</h2>
                <p className="text-gray-600 mb-6">
                  Create certificate templates with custom layouts, backgrounds, and dynamic fields
                </p>
                
                <div className="space-y-2 text-sm text-gray-500 mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <span>✓</span>
                    <span>Upload background images</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span>✓</span>
                    <span>Add text and image elements</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span>✓</span>
                    <span>Define dynamic fields</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span>✓</span>
                    <span>Save as reusable templates</span>
                  </div>
                </div>

                <div className="px-6 py-3 bg-blue-600 text-white rounded-lg group-hover:bg-blue-700 transition-colors">
                  Start Designing
                </div>
              </div>
            </div>
          </Link>

          {/* Generator App */}
          <Link href="/generator" className="group">
            <div className="bg-white rounded-xl shadow-lg p-8 hover:shadow-xl transition-all duration-300 group-hover:scale-105">
              <div className="text-center">
                <div className="text-6xl mb-4">⚡</div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Generator</h2>
                <p className="text-gray-600 mb-6">
                  Generate certificates from templates with automatic form creation and PDF download
                </p>
                
                <div className="space-y-2 text-sm text-gray-500 mb-6">
                  <div className="flex items-center justify-center gap-2">
                    <span>✓</span>
                    <span>Browse available templates</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span>✓</span>
                    <span>Auto-generated forms</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span>✓</span>
                    <span>Fill recipient details</span>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <span>✓</span>
                    <span>Download PDF certificates</span>
                  </div>
                </div>

                <div className="px-6 py-3 bg-green-600 text-white rounded-lg group-hover:bg-green-700 transition-colors">
                  Generate Certificates
                </div>
              </div>
            </div>
          </Link>
        </div>

        {/* Features */}
        <div className="mt-16 bg-white rounded-xl shadow-lg p-8">
          <h3 className="text-2xl font-bold text-gray-800 text-center mb-8">System Features</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl mb-3">🔄</div>
              <h4 className="font-semibold text-gray-800 mb-2">Shared Storage</h4>
              <p className="text-gray-600 text-sm">
                Templates created in Designer are automatically available in Generator
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-3">📋</div>
              <h4 className="font-semibold text-gray-800 mb-2">Auto Forms</h4>
              <p className="text-gray-600 text-sm">
                Forms are automatically generated based on template field definitions
              </p>
            </div>
            
            <div className="text-center">
              <div className="text-3xl mb-3">💾</div>
              <h4 className="font-semibold text-gray-800 mb-2">Persistent Data</h4>
              <p className="text-gray-600 text-sm">
                All templates and images are saved with unique codes for organization
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500 text-sm">
          <p>Professional certificate creation made simple</p>
        </div>
      </div>
    </div>
  );
}