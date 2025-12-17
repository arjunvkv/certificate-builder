import { NextRequest, NextResponse } from 'next/server';
import { readdir, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import JSZip from 'jszip';

export async function POST(request: NextRequest) {
  try {
    const { code, pdfData, fileName } = await request.json();

    if (!code || !pdfData) {
      return NextResponse.json(
        { error: 'Code and PDF data are required' },
        { status: 400 }
      );
    }

    const zip = new JSZip();
    
    // Add PDF to zip
    const pdfBuffer = Buffer.from(pdfData.split(',')[1], 'base64');
    zip.file(`${fileName || 'certificate'}.pdf`, pdfBuffer);

    // Add associated image files
    const uploadDir = path.join(process.cwd(), 'public', 'certificates', code);
    
    if (existsSync(uploadDir)) {
      const files = await readdir(uploadDir);
      
      for (const file of files) {
        const filePath = path.join(uploadDir, file);
        const fileBuffer = await readFile(filePath);
        zip.file(`images/${file}`, fileBuffer);
      }
    }

    // Generate zip buffer
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });

    return new NextResponse(zipBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="${fileName || 'certificate'}.zip"`,
      },
    });
  } catch (error) {
    console.error('Error creating zip:', error);
    return NextResponse.json(
      { error: 'Failed to create zip file' },
      { status: 500 }
    );
  }
}