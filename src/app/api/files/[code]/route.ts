import { NextRequest, NextResponse } from 'next/server';
import { readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { code: string } }
) {
  try {
    const { code } = params;
    
    if (!code) {
      return NextResponse.json(
        { error: 'Code is required' },
        { status: 400 }
      );
    }

    const uploadDir = path.join(process.cwd(), 'public', 'certificates', code);
    
    if (!existsSync(uploadDir)) {
      return NextResponse.json({
        success: true,
        files: []
      });
    }

    const files = await readdir(uploadDir);
    const filePaths = files.map(file => `/certificates/${code}/${file}`);

    return NextResponse.json({
      success: true,
      files: filePaths
    });
  } catch (error) {
    console.error('Error reading files:', error);
    return NextResponse.json(
      { error: 'Failed to read files' },
      { status: 500 }
    );
  }
}