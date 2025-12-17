import { NextRequest, NextResponse } from 'next/server';
import { readFile, readdir, writeFile, unlink } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';

// GET - Get a specific template by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Fetching template by ID:', id);
    
    if (!id) {
      console.error('No template ID provided');
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const templateDir = path.join(process.cwd(), 'public', 'templates', id);
    const metadataPath = path.join(templateDir, 'metadata.json');
    
    console.log('Template directory:', templateDir);
    console.log('Metadata path:', metadataPath);
    console.log('Metadata exists:', existsSync(metadataPath));
    
    if (!existsSync(metadataPath)) {
      console.error('Template metadata not found:', metadataPath);
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Read template metadata
    console.log('Reading metadata file...');
    const metadataContent = await readFile(metadataPath, 'utf-8');
    const metadata = JSON.parse(metadataContent);
    console.log('Metadata loaded:', metadata);

    // Check for background image
    let bgImage = null;
    console.log('Checking for background image...');
    const files = await readdir(templateDir);
    console.log('Files in template directory:', files);
    const bgFile = files.find(file => file.startsWith('background.'));
    
    if (bgFile) {
      console.log('Background file found:', bgFile);
      const bgPath = path.join(templateDir, bgFile);
      const bgBuffer = await readFile(bgPath);
      const extension = bgFile.split('.').pop();
      const mimeType = extension === 'png' ? 'image/png' : 'image/jpeg';
      bgImage = `data:${mimeType};base64,${bgBuffer.toString('base64')}`;
      console.log('Background image loaded, size:', bgBuffer.length);
    } else {
      console.log('No background file found');
    }

    const response = {
      success: true,
      template: {
        id,
        ...metadata,
        bgImage
      }
    };
    
    console.log('Returning template response:', {
      id: response.template.id,
      name: response.template.name,
      prefixesCount: response.template.prefixes?.length,
      elementsCount: response.template.elements?.length,
      hasBgImage: !!response.template.bgImage
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching template:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to fetch template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT - Update an existing template
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    console.log('Updating template with ID:', id);
    
    if (!id) {
      console.error('No template ID provided for update');
      return NextResponse.json(
        { error: 'Template ID is required' },
        { status: 400 }
      );
    }

    const templateData = await request.json();
    console.log('Template update data:', {
      name: templateData.name,
      prefixesCount: templateData.prefixes?.length,
      elementsCount: templateData.elements?.length,
      hasBgImage: !!templateData.bgImage
    });

    const { 
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

    if (!name || !prefixes) {
      return NextResponse.json(
        { error: 'Template name and prefixes are required' },
        { status: 400 }
      );
    }

    // Check if template exists
    const templateDir = path.join(process.cwd(), 'public', 'templates', id);
    const metadataPath = path.join(templateDir, 'metadata.json');
    
    if (!existsSync(metadataPath)) {
      return NextResponse.json(
        { error: 'Template not found' },
        { status: 404 }
      );
    }

    // Read existing metadata to preserve creation date
    const existingMetadataContent = await readFile(metadataPath, 'utf-8');
    const existingMetadata = JSON.parse(existingMetadataContent);

    // Update template metadata
    const updatedMetadata = {
      name,
      description: description || '',
      createdAt: existingMetadata.createdAt, // Preserve original creation date
      updatedAt: new Date().toISOString(),
      prefixes,
      elements,
      canvasDimensions,
      bgFileName,
      bgFileSize,
      bgFileType,
      version: '1.0'
    };

    console.log('Saving updated metadata...');
    await writeFile(metadataPath, JSON.stringify(updatedMetadata, null, 2));
    console.log('Updated metadata saved successfully');

    // Update background image if provided
    if (bgImage && bgImage.startsWith('data:')) {
      console.log('Updating background image...');
      
      // Remove old background files
      const files = await readdir(templateDir);
      const oldBgFiles = files.filter(file => file.startsWith('background.'));
      for (const oldFile of oldBgFiles) {
        const oldPath = path.join(templateDir, oldFile);
        await unlink(oldPath);
      }

      // Save new background image
      const base64Data = bgImage.split(',')[1];
      const buffer = Buffer.from(base64Data, 'base64');
      const extension = bgFileType?.split('/')[1] || 'jpg';
      const imagePath = path.join(templateDir, `background.${extension}`);
      await writeFile(imagePath, buffer);
      console.log('Updated background image saved successfully');
    }

    console.log('Template updated successfully:', id);
    return NextResponse.json({
      success: true,
      templateId: id,
      message: 'Template updated successfully'
    });
  } catch (error) {
    console.error('Error updating template:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { 
        error: 'Failed to update template',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}