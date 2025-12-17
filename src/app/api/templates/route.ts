import { NextRequest, NextResponse } from 'next/server';
import { writeFile, readFile, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// GET - List all available templates
export async function GET() {
  try {
    const templatesDir = path.join(process.cwd(), 'public', 'templates');
    
    if (!existsSync(templatesDir)) {
      return NextResponse.json({
        success: true,
        templates: []
      });
    }

    const templateFolders = await readdir(templatesDir);
    const templates = [];

    for (const folder of templateFolders) {
      const metadataPath = path.join(templatesDir, folder, 'metadata.json');
      if (existsSync(metadataPath)) {
        try {
          const metadataContent = await readFile(metadataPath, 'utf-8');
          const metadata = JSON.parse(metadataContent);
          templates.push({
            id: folder,
            ...metadata
          });
        } catch (error) {
          console.warn(`Failed to read metadata for template ${folder}:`, error);
        }
      }
    }

    return NextResponse.json({
      success: true,
      templates
    });
  } catch (error) {
    console.error('Error listing templates:', error);
    return NextResponse.json(
      { error: 'Failed to list templates' },
      { status: 500 }
    );
  }
}

// POST - Save a new template
export async function POST(request: NextRequest) {
  try {
    console.log('Received template save request');
    const templateData = await request.json();
    console.log('Template data parsed:', { 
      id: templateData.id, 
      name: templateData.name, 
      prefixesCount: templateData.prefixes?.length,
      elementsCount: templateData.elements?.length,
      hasBgImage: !!templateData.bgImage
    });
    
    const { 
      id, 
      name, 
      description, 
      prefixes, 
      elements, 
      canvasDimensions, 
      bgImage,
      bgFileName,
      bgFileSize,
      bgFileType 
    } = templateData;

    if (!id || !name || !prefixes) {
      console.error('Missing required fields:', { id: !!id, name: !!name, prefixes: !!prefixes });
      return NextResponse.json(
        { error: 'Template ID, name, and prefixes are required' },
        { status: 400 }
      );
    }

    // Create template directory
    const templateDir = path.join(process.cwd(), 'public', 'templates', id);
    console.log('Template directory path:', templateDir);
    
    if (!existsSync(templateDir)) {
      console.log('Creating template directory...');
      const { mkdir } = await import('fs/promises');
      await mkdir(templateDir, { recursive: true });
      console.log('Template directory created successfully');
    } else {
      console.log('Template directory already exists');
    }

    // Save template metadata
    const metadata = {
      name,
      description: description || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      prefixes,
      elements,
      canvasDimensions,
      bgFileName,
      bgFileSize,
      bgFileType,
      version: '1.0'
    };

    console.log('Saving metadata...');
    const metadataPath = path.join(templateDir, 'metadata.json');
    await writeFile(metadataPath, JSON.stringify(metadata, null, 2));
    console.log('Metadata saved successfully');

    // Save background image if provided
    if (bgImage && bgImage.startsWith('data:')) {
      console.log('Saving background image...');
      const base64Data = bgImage.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const extension = bgFileType?.split('/')[1] || 'jpg';
      const imagePath = path.join(templateDir, `background.${extension}`);
      await writeFile(imagePath, buffer);
      console.log('Background image saved successfully');
    }

    console.log('Template saved successfully:', id);
    return NextResponse.json({
      success: true,
      templateId: id,
      message: 'Template saved successfully'
    });
  } catch (error) {
    console.error('Error saving template:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to save template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}