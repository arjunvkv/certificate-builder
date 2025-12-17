# Certificate System

A professional certificate creation and generation platform built with Next.js 16, featuring separated Designer and Generator applications with persistent storage and automatic PDF generation.

## Overview

This system provides a complete solution for creating and generating professional certificates through two specialized applications:

- **Designer App** (`/designer`) - Visual template creation with drag-and-drop interface
- **Generator App** (`/generator`) - Certificate generation from templates with auto-generated forms

## Quick Start

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open http://localhost:3000
```

## User Experience

### For Template Designers

1. **Access Designer**: Navigate to `/designer`
2. **Upload Background**: Add certificate background image
3. **Add Elements**: Drag and drop text/image elements
4. **Define Fields**: Create dynamic placeholders (e.g., `{{name}}`, `{{course}}`)
5. **Save Template**: Store as reusable template with name and description

### For Certificate Generators

1. **Access Generator**: Navigate to `/generator`
2. **Browse Templates**: View available templates with previews
3. **Select Template**: Choose appropriate design
4. **Fill Form**: Complete auto-generated form based on template fields
5. **Download PDF**: Generate and download professional certificate

## Technical Architecture

### Tech Stack

- **Framework**: Next.js 16.0.10 with App Router
- **Frontend**: React 19.2.1, TypeScript 5
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand 5.0.9
- **PDF Generation**: jsPDF 3.0.4, html2canvas 1.4.1
- **Interactions**: Interact.js 1.10.27, @dnd-kit
- **Rich Text**: TinyMCE 8.3.0

### Core Systems

#### 1. Separated Applications Architecture

**Designer App** (`/src/app/designer/`)
- Visual certificate designer with drag-and-drop
- Background image upload and management
- Text and image element positioning
- Dynamic field definition with placeholder syntax
- Template saving with metadata
- Real-time preview and editing

**Generator App** (`/src/app/generator/`)
- Template browsing and selection
- Automatic form generation based on template fields
- Real-time form validation
- PDF generation with filled data
- Clean, user-friendly interface

#### 2. Persistent Storage System

**File Storage Structure**:
```
public/
├── certificates/
│   └── {certificate_code}/
│       ├── {code}.jpg          # Background image
│       └── {code}_element.png  # Element images
└── templates/
    └── {templateId}/
        ├── metadata.json       # Template configuration
        └── background.{ext}    # Background image
```

**State Persistence**:
- localStorage-based image persistence with base64 conversion
- Automatic saves on page visibility changes, before unload, and periodic intervals
- Complete state restoration including images on page refresh
- Debounced saves to prevent excessive writes

#### 3. API Endpoints

**Templates Management**:
- `GET /api/templates` - List all templates
- `POST /api/templates` - Save new template
- `GET /api/templates/{id}` - Get specific template

**File Management**:
- `POST /api/upload` - Upload files with certificate codes
- `GET /api/files/{code}` - Retrieve files by certificate code

**Utilities**:
- `GET /api/download-zip` - Download template assets as ZIP

### State Management

**Certificate Store** (`src/store/certificateStore.ts`):
```typescript
interface CertificateStore {
  // Background image management
  bgImage: string | null;
  bgFileName: string;
  bgFileSize: number;
  bgFileType: string;
  
  // Canvas and elements
  canvasDimensions: { width: number; height: number };
  elements: Element[];
  selectedElement: string | null;
  
  // Dynamic fields
  prefixes: Prefix[];
  
  // Persistence
  certificateCode: string;
  saveState: () => void;
  loadState: () => void;
  convertBgImageToBase64: () => Promise<void>;
  convertElementImagesToBase64: () => Promise<void>;
}
```

#### 4. Image Persistence System

**Problem Solved**: Blob URLs don't persist across navigation or browser refreshes

**Solution**:
- Automatic base64 conversion 1 second after upload
- Multiple persistence triggers (page visibility, before unload, periodic)
- Visual status indicators showing conversion progress
- Complete state restoration on page load

**Persistence Triggers**:
- Page visibility change (tab switching)
- Window beforeunload event (page refresh/navigation)
- Periodic auto-save every 30 seconds
- Manual "Save Progress" button

#### 5. Certificate Code System

**Unique Code Generation**:
- Format: `cert_{timestamp}_{random}`
- Generated when first image is uploaded
- Persists throughout certificate creation session
- Used for file organization and metadata tracking

**Benefits**:
- File persistence beyond browser sessions
- Organized asset management
- Traceability and auditing
- Professional metadata inclusion in PDFs

### PDF Generation

**Process**:
1. Render certificate canvas with filled data
2. Convert to high-quality image using html2canvas (2x scale)
3. Generate PDF with jsPDF
4. Optional metadata page with certificate code and source files
5. Download as `{recipient_name}_certificate.pdf`

**Features**:
- High-quality rendering (2x scale for crisp output)
- Proper dimensions and formatting
- Dynamic content replacement using template placeholders
- Optional metadata pages for tracking
- Professional filename generation

### Dynamic Content System

**Template Placeholders**:
- `{{name}}` - Recipient name
- `{{course}}` - Course/program name
- `{{organization}}` - Issuing organization
- `{{date}}` - Completion/issue date
- Custom fields supported

**Form Generation**:
- Automatic form creation based on template field definitions
- Field type detection (name, course, organization, date, other)
- Required field validation
- Appropriate input types (text, date)
- Default values from template configuration

## Development

### Project Structure

```
src/
├── app/
│   ├── api/                    # API endpoints
│   │   ├── templates/          # Template CRUD
│   │   ├── upload/             # File upload
│   │   └── files/              # File retrieval
│   ├── designer/               # Designer application
│   ├── generator/              # Generator application
│   ├── globals.css             # Global styles
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Landing page
├── components/                 # Reusable components
├── hooks/                      # Custom React hooks
├── store/                      # Zustand state management
└── utils/                      # Utility functions
```

### Key Components

**Designer Components**:
- Canvas with drag-and-drop elements
- Background image uploader
- Element property panels
- Dynamic field configurator
- Template save dialog

**Generator Components**:
- Template browser with previews
- Auto-generated forms
- PDF preview
- Download interface

### Build and Deploy

```bash
# Development
npm run dev

# Production build
npm run build
npm start

# Linting
npm run lint
```

## Features

### Core Features
- ✅ Visual certificate designer with drag-and-drop
- ✅ Template creation and management
- ✅ Automatic form generation from templates
- ✅ Professional PDF generation
- ✅ Image persistence across sessions
- ✅ Unique certificate codes for organization
- ✅ Shared storage between Designer and Generator
- ✅ Real-time preview and editing

### Advanced Features
- ✅ Base64 image conversion for persistence
- ✅ Multiple auto-save triggers
- ✅ Visual persistence status indicators
- ✅ Template metadata with versioning
- ✅ Dynamic content replacement
- ✅ Professional PDF output with optional metadata
- ✅ Organized file storage with unique codes
- ✅ Graceful error handling and fallbacks

## Security Considerations

- Files stored in public directory (accessible via URL)
- Unique codes provide obscurity but not security
- Consider authentication for sensitive certificates
- Implement cleanup for old/unused certificate folders
- Validate file types and sizes on upload
- Sanitize user inputs in forms and templates

## Browser Compatibility

- Modern browsers with ES2020+ support
- HTML5 Canvas and File API required
- localStorage support needed for persistence
- Blob and base64 conversion support required

## Performance Optimizations

- Debounced state saves (500ms delay)
- Async base64 conversion (non-blocking)
- Lazy loading of template previews
- Efficient canvas rendering with 2x scaling
- Memory management with proper blob URL cleanup

## Migration to Database + S3 Architecture

### Current Limitations

The current system uses localStorage and local file storage, which has limitations:
- **localStorage**: Limited to ~5-10MB per domain, client-side only
- **Local Files**: Not scalable, requires server file system access
- **No User Management**: No authentication or multi-user support
- **No Backup**: Data loss risk if localStorage is cleared
- **No Collaboration**: Cannot share templates between users

### Recommended Architecture

**Database**: PostgreSQL or MongoDB for metadata storage
**File Storage**: AWS S3 or compatible object storage
**Authentication**: NextAuth.js or similar
**ORM**: Prisma (PostgreSQL) or Mongoose (MongoDB)

### Database Schema

#### PostgreSQL Schema (Prisma)

```prisma
// schema.prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  templates    Template[]
  certificates Certificate[]
}

model Template {
  id          String   @id @default(cuid())
  name        String
  description String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Template configuration as JSON
  metadata    Json     // Contains: elements, prefixes, canvasDimensions, etc.
  
  // Relationships
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  certificates Certificate[]
  assets       Asset[]
}

model Certificate {
  id           String   @id @default(cuid())
  recipientName String
  createdAt    DateTime @default(now())
  
  // Certificate data as JSON
  formData     Json     // Contains: name, course, organization, date, etc.
  
  // Relationships
  templateId   String
  template     Template @relation(fields: [templateId], references: [id])
  userId       String
  user         User     @relation(fields: [userId], references: [id])
  assets       Asset[]
}

model Asset {
  id         String      @id @default(cuid())
  fileName   String
  fileSize   Int
  fileType   String      // MIME type (image/jpeg, image/png, application/pdf)
  s3Key      String      // S3 object key
  s3Url      String      // Public S3 URL
  assetType  AssetType   // Enum to differentiate asset types
  elementId  String?     // Reference to element ID in template metadata (for element images)
  createdAt  DateTime    @default(now())
  
  // Relationships
  templateId String?
  template   Template?   @relation(fields: [templateId], references: [id])
  certificateId String?
  certificate Certificate? @relation(fields: [certificateId], references: [id])
  userId     String
  user       User        @relation(fields: [userId], references: [id])
}

enum AssetType {
  BACKGROUND_IMAGE    // Template background image
  ELEMENT_IMAGE      // Template element image (logos, icons, etc.)
  GENERATED_PDF      // Generated certificate PDF
  TEMP_UPLOAD        // Temporary upload during design process
}
```

#### MongoDB Schema (Mongoose)

```typescript
// models/User.ts
const UserSchema = new Schema({
  email: { type: String, required: true, unique: true },
  name: String,
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// models/Template.ts
const TemplateSchema = new Schema({
  name: { type: String, required: true },
  description: String,
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  // All template configuration in single document
  metadata: {
    elements: [Schema.Types.Mixed],
    prefixes: [Schema.Types.Mixed],
    canvasDimensions: {
      width: Number,
      height: Number
    },
    bgFileName: String,
    bgFileSize: Number,
    bgFileType: String,
    version: { type: String, default: '1.0' }
  },
  
  // File references
  bgImageUrl: String,  // S3 URL
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// models/Certificate.ts
const CertificateSchema = new Schema({
  recipientName: { type: String, required: true },
  templateId: { type: Schema.Types.ObjectId, ref: 'Template', required: true },
  userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  
  // Form data as single document
  formData: Schema.Types.Mixed,
  
  // Generated files
  pdfUrl: String,  // S3 URL
  
  createdAt: { type: Date, default: Date.now }
});
```

### S3 File Organization

```
bucket-name/
├── templates/
│   └── {userId}/
│       └── {templateId}/
│           ├── background.{ext}     # Background image
│           └── elements/
│               ├── element1.{ext}   # Element images
│               └── element2.{ext}
├── certificates/
│   └── {userId}/
│       └── {certificateId}/
│           └── certificate.pdf      # Generated PDF
└── temp/
    └── {sessionId}/                 # Temporary uploads during design
        ├── bg_temp.{ext}
        └── element_temp.{ext}
```

### Migration Steps

#### 1. Environment Setup

```bash
# Install dependencies
npm install @prisma/client prisma @aws-sdk/client-s3 next-auth
# OR for MongoDB
npm install mongoose @aws-sdk/client-s3 next-auth

# Environment variables
# .env.local
DATABASE_URL="postgresql://user:password@localhost:5432/certificates"
# OR
MONGODB_URI="mongodb://localhost:27017/certificates"

AWS_ACCESS_KEY_ID="your-access-key"
AWS_SECRET_ACCESS_KEY="your-secret-key"
AWS_REGION="us-east-1"
S3_BUCKET_NAME="certificate-assets"

NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key"
```

#### 2. Database Migration

**Create migration utilities**:

```typescript
// utils/migrate.ts
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

export async function migrateLocalStorageToDb() {
  // Read existing templates from public/templates/
  const templatesDir = path.join(process.cwd(), 'public/templates');
  const templateFolders = fs.readdirSync(templatesDir);
  
  for (const folder of templateFolders) {
    const metadataPath = path.join(templatesDir, folder, 'metadata.json');
    if (fs.existsSync(metadataPath)) {
      const metadata = JSON.parse(fs.readFileSync(metadataPath, 'utf8'));
      
      // Create template in database
      await prisma.template.create({
        data: {
          id: folder,
          name: metadata.name,
          description: metadata.description,
          metadata: metadata,
          bgFileName: metadata.bgFileName,
          bgFileSize: metadata.bgFileSize,
          bgFileType: metadata.bgFileType,
          userId: 'default-user-id', // Create default user first
        }
      });
    }
  }
}
```

#### 3. S3 Integration

**S3 utility functions**:

```typescript
// utils/s3.ts
import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const s3Client = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function uploadToS3(
  file: Buffer,
  key: string,
  contentType: string
): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
    Body: file,
    ContentType: contentType,
  });
  
  await s3Client.send(command);
  return `https://${process.env.S3_BUCKET_NAME}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
}

export async function getSignedDownloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
  });
  
  return await getSignedUrl(s3Client, command, { expiresIn: 3600 });
}

export async function deleteFromS3(key: string): Promise<void> {
  const command = new DeleteObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME!,
    Key: key,
  });
  
  await s3Client.send(command);
}
```

#### 4. Updated API Endpoints

**Template API with database**:

```typescript
// app/api/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { getServerSession } from 'next-auth';

const prisma = new PrismaClient();

export async function GET() {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const templates = await prisma.template.findMany({
    where: { userId: session.user.id },
    select: {
      id: true,
      name: true,
      description: true,
      createdAt: true,
      updatedAt: true,
      bgImageUrl: true,
    },
  });
  
  return NextResponse.json({ success: true, templates });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  
  const data = await request.json();
  
  // Upload background image to S3 if provided
  let bgImageUrl = null;
  if (data.bgImage) {
    const buffer = Buffer.from(data.bgImage.split(',')[1], 'base64');
    const key = `templates/${session.user.id}/${data.id}/background.${data.bgFileType.split('/')[1]}`;
    bgImageUrl = await uploadToS3(buffer, key, data.bgFileType);
  }
  
  const template = await prisma.template.create({
    data: {
      id: data.id,
      name: data.name,
      description: data.description,
      userId: session.user.id,
      metadata: {
        elements: data.elements,
        prefixes: data.prefixes,
        canvasDimensions: data.canvasDimensions,
        bgFileName: data.bgFileName,
        bgFileSize: data.bgFileSize,
        bgFileType: data.bgFileType,
        version: data.version || '1.0',
      },
      bgImageUrl,
    },
  });
  
  return NextResponse.json({ success: true, template });
}
```

#### 5. Updated State Management

**Remove localStorage, add API calls**:

```typescript
// store/certificateStore.ts
import { create } from 'zustand';

interface CertificateStore {
  // ... existing state
  
  // Replace localStorage methods with API calls
  saveTemplate: (templateData: TemplateData) => Promise<void>;
  loadTemplate: (templateId: string) => Promise<void>;
  loadUserTemplates: () => Promise<Template[]>;
  
  // Remove localStorage methods
  // saveState: () => void;
  // loadState: () => void;
}

export const useCertificateStore = create<CertificateStore>((set, get) => ({
  // ... existing state
  
  saveTemplate: async (templateData) => {
    const response = await fetch('/api/templates', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(templateData),
    });
    
    if (!response.ok) {
      throw new Error('Failed to save template');
    }
    
    const result = await response.json();
    return result.template;
  },
  
  loadTemplate: async (templateId) => {
    const response = await fetch(`/api/templates/${templateId}`);
    if (!response.ok) {
      throw new Error('Failed to load template');
    }
    
    const result = await response.json();
    const template = result.template;
    
    set({
      bgImage: template.bgImageUrl,
      bgFileName: template.metadata.bgFileName,
      bgFileSize: template.metadata.bgFileSize,
      bgFileType: template.metadata.bgFileType,
      elements: template.metadata.elements,
      prefixes: template.metadata.prefixes,
      canvasDimensions: template.metadata.canvasDimensions,
    });
  },
  
  loadUserTemplates: async () => {
    const response = await fetch('/api/templates');
    if (!response.ok) {
      throw new Error('Failed to load templates');
    }
    
    const result = await response.json();
    return result.templates;
  },
}));
```

#### 6. Authentication Integration

**Add NextAuth.js**:

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GoogleProvider from 'next-auth/providers/google';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const handler = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    session: async ({ session, token }) => {
      if (session?.user && token?.sub) {
        session.user.id = token.sub;
      }
      return session;
    },
  },
});

export { handler as GET, handler as POST };
```

### Migration Benefits

**Scalability**:
- Unlimited storage with S3
- Database handles millions of templates/certificates
- Multi-user support with proper isolation

**Reliability**:
- Database backups and replication
- S3 99.999999999% durability
- No data loss from localStorage clearing

**Security**:
- User authentication and authorization
- Private file access with signed URLs
- Audit trails and access logging

**Performance**:
- CDN delivery for S3 assets
- Database indexing for fast queries
- Caching strategies for frequently accessed data

**Features**:
- User accounts and template sharing
- Collaboration and team workspaces
- Analytics and usage tracking
- Automated backups and versioning

### Migration Timeline

**Phase 1** (Week 1-2): Database setup and basic CRUD
**Phase 2** (Week 3-4): S3 integration and file migration
**Phase 3** (Week 5-6): Authentication and user management
**Phase 4** (Week 7-8): Testing, optimization, and deployment

The migration transforms the system from a local prototype to a production-ready, scalable platform suitable for enterprise use.
