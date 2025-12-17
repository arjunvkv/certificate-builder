import jsPDF from 'jspdf';

// Generate a unique code for file naming
export const generateUniqueCode = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `cert_${timestamp}_${random}`;
};

// Save file to server with unique code name
export const saveFileWithCode = async (file: File, code: string): Promise<string> => {
  const formData = new FormData();
  const extension = file.name.split('.').pop() || 'jpg';
  const fileName = `${code}.${extension}`;
  
  formData.append('file', file, fileName);
  formData.append('code', code);

  try {
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const result = await response.json();
    return result.filePath;
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
};

// Get all files associated with a code
export const getCodeFiles = async (code: string): Promise<string[]> => {
  try {
    const response = await fetch(`/api/files/${code}`);
    if (!response.ok) {
      throw new Error('Failed to fetch files');
    }
    const result = await response.json();
    return result.files;
  } catch (error) {
    console.error('Error fetching files:', error);
    return [];
  }
};

// Download PDF with optional metadata page
export const downloadPDFWithMetadata = async (
  pdf: jsPDF,
  code: string,
  fileName: string = 'certificate.pdf',
  includeMetadata: boolean = false
): Promise<void> => {
  try {
    if (includeMetadata && code) {
      // Get all files associated with this code
      const associatedFiles = await getCodeFiles(code);
      
      if (associatedFiles.length > 0) {
        // Add a new page with file metadata info
        pdf.addPage();
        pdf.setFontSize(16);
        pdf.text('Certificate Metadata', 20, 30);
        
        pdf.setFontSize(12);
        pdf.text(`Certificate Code: ${code}`, 20, 60);
        pdf.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 80);
        
        pdf.setFontSize(14);
        pdf.text('Source Files:', 20, 110);
        
        let yPosition = 130;
        associatedFiles.forEach((filePath, index) => {
          const fileName = filePath.split('/').pop() || filePath;
          pdf.setFontSize(10);
          pdf.text(`${index + 1}. ${fileName}`, 30, yPosition);
          yPosition += 15;
        });
      }
    }

    // Download the PDF
    pdf.save(fileName);
  } catch (error) {
    console.error('Error adding metadata to PDF:', error);
    // Fallback to regular download
    pdf.save(fileName);
  }
};

