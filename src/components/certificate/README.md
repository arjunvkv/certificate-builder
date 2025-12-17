# Certificate Builder Components

This directory contains reusable components for the Certificate Builder application.

## Component Structure

### Core Components

- **`CertificateBuilder.tsx`** - Main container component that handles navigation between Designer and Generator modes
- **`CertificateCreator.tsx`** - Designer interface for creating and editing certificates with drag-and-drop functionality
- **`CertificateGenerator.tsx`** - Form interface for filling in dynamic fields and generating certificates

### UI Components

- **`DraggableElement.tsx`** - Individual draggable text and image elements on the certificate canvas
- **`ElementPropertiesPanel.tsx`** - Standalone properties panel component (integrated into Sidebar)
- **`Sidebar.tsx`** - Unified sidebar with context-aware content management

### Types

- **`types.ts`** - TypeScript interfaces and types used across components
- **`index.ts`** - Barrel export file for easy imports

## Key Features

### Unified Sidebar
- Context-aware content that changes based on Designer/Generator mode
- Element management with click-to-select functionality
- Integrated properties panel for selected elements
- Dynamic field management with real-time preview

### Drag and Drop
- Uses `@dnd-kit/core` for smooth drag-and-drop interactions
- Elements can be repositioned on the certificate canvas
- Visual feedback during dragging

### Dynamic Content
- Support for placeholder variables like `{{name}}`, `{{course}}`
- Real-time preview of dynamic content
- Form-based data entry for certificate generation

### Rich Text Editing
- TinyMCE integration for text formatting
- Inline editing with floating toolbar
- Font customization (family, size, color)

### PDF Generation
- High-quality PDF export using `html2pdf.js`
- Landscape orientation optimized for certificates
- Customizable filename based on form data

## Usage

```tsx
import { CertificateBuilder } from '@/components/certificate';

export default function Page() {
  return <CertificateBuilder />;
}
```

## Component Dependencies

- `@dnd-kit/core` - Drag and drop functionality
- `@tinymce/tinymce-react` - Rich text editing
- `html2pdf.js` - PDF generation
- `zustand` - State management (via certificateStore)

## State Management

All components use the `useCertificateStore` hook from `@/store/certificateStore` for:
- Certificate elements (text, images)
- Dynamic field definitions
- Background image management
- UI state (selected element, preview mode, active section)