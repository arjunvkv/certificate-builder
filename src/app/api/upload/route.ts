import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const code = formData.get('code') as string;

    if (!file || !code) {
      return NextResponse.json(
        { error: 'File and code are required' },
        { status: 400 }
      );
    }

    // Create directory for this code if it doesn't exist
    const uploadDir = path.join(process.cwd(), 'public', 'certificates', code);
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    // Save the file
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const extension = file.name.split('.').pop() || 'jpg';
    const fileName = `${code}.${extension}`;
    const filePath = path.join(uploadDir, fileName);

    await writeFile(filePath, buffer);

    // Return the public path
    const publicPath = `/certificates/${code}/${fileName}`;

    return NextResponse.json({
      success: true,
      filePath: publicPath,
      fileName,
      code
    });
  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}