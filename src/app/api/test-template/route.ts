import { NextRequest, NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

export async function GET() {
  try {
    // Test directory creation and file writing
    const testDir = path.join(process.cwd(), 'public', 'templates', 'test-template');
    console.log('Test directory path:', testDir);
    
    // Create directory
    const { mkdir } = await import('fs/promises');
    await mkdir(testDir, { recursive: true });
    console.log('Test directory created');
    
    // Test file writing
    const testFile = path.join(testDir, 'test.json');
    await writeFile(testFile, JSON.stringify({ test: 'data' }, null, 2));
    console.log('Test file written');
    
    // Check if file exists
    const fileExists = existsSync(testFile);
    console.log('File exists:', fileExists);
    
    return NextResponse.json({
      success: true,
      message: 'Template system test passed',
      testDir,
      fileExists
    });
  } catch (error) {
    console.error('Template system test failed:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
}