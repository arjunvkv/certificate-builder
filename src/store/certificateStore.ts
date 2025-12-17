import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

interface TextField {
  id: string;
  type: 'text';
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize: number;
  color: string;
  fontFamily: string;
}

interface ImageElement {
  id: string;
  type: 'image';
  src: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  file?: File; // Only for uploaded images
}

type CertificateElement = TextField | ImageElement;

interface Prefix {
  id: string;
  name: string;
  value: string;
  type: 'name' | 'course' | 'organization' | 'date' | 'other';
}

interface CertificateState {
  bgImage: string | null;
  bgFile: File | null;
  bgFileName: string | null; // Store just the name for state persistence
  bgFileSize: number | null; // Store just the size for state persistence
  bgFileType: string | null; // Store just the type for state persistence
  certificateCode: string | null; // Unique code for this certificate
  canvasDimensions: { width: number; height: number };
  elements: CertificateElement[];
  prefixes: Prefix[];
  selectedElement: string | null;
  previewMode: boolean;
  activeSection: 'creator' | 'downloader';
  setBgImage: (bgImage: string | null) => void;
  setBgFile: (bgFile: File | null) => void;
  setBgFileMetadata: (file: File | null) => void;
  setCertificateCode: (code: string | null) => void;
  generateNewCertificateCode: () => string;
  convertBgImageToBase64: () => Promise<void>;
  convertElementImagesToBase64: () => Promise<void>;
  setCanvasDimensions: (width: number, height: number) => void;
  scaleElementsToFitCanvas: (oldWidth: number, oldHeight: number, newWidth: number, newHeight: number) => void;
  setElements: (elements: CertificateElement[]) => void;
  addElement: (element: CertificateElement) => void;
  updateElement: (id: string, updates: Partial<CertificateElement>) => void;
  removeElement: (id: string) => void;
  setPrefixes: (prefixes: Prefix[]) => void;
  addPrefix: (prefix: Prefix) => void;
  updatePrefix: (id: string, updates: Partial<Prefix>) => void;
  removePrefix: (id: string) => void;
  setSelectedElement: (id: string | null) => void;
  setPreviewMode: (previewMode: boolean) => void;
  setActiveSection: (section: 'creator' | 'downloader') => void;
  reset: () => void;
}

// Load initial state from localStorage
const loadState = () => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return undefined;
  }
  
  try {
    const serializedState = localStorage.getItem('certificateState');
    if (serializedState === null) return undefined;
    return JSON.parse(serializedState);
  } catch (error) {
    console.error('Error loading state from localStorage:', error);
    return undefined;
  }
};

// Convert blob URL to base64 for storage
const blobToBase64 = (blob: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (!blob.startsWith('blob:')) {
      resolve(blob);
      return;
    }

    fetch(blob)
      .then(response => response.blob())
      .then(blobData => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(blobData);
      })
      .catch(reject);
  });
};

// Save state to localStorage whenever it changes
const saveState = async (state: any) => {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return;
  }
  
  try {
    // Convert blob URLs to base64 for elements
    const elementsWithBase64 = await Promise.all(
      state.elements.map(async (element: any) => {
        if (element.type === 'image' && element.src && element.src.startsWith('blob:')) {
          try {
            const base64Src = await blobToBase64(element.src);
            return { ...element, src: base64Src };
          } catch (error) {
            console.warn('Failed to convert element image to base64:', error);
            return element;
          }
        }
        return element;
      })
    );

    // Convert background image to base64 if it's a blob URL
    let bgImageBase64 = state.bgImage;
    if (state.bgImage && state.bgImage.startsWith('blob:')) {
      try {
        bgImageBase64 = await blobToBase64(state.bgImage);
      } catch (error) {
        console.warn('Failed to convert background image to base64:', error);
      }
    }

    // Only persist data that can be serialized
    const persistableState = {
      bgImage: bgImageBase64,
      bgFileName: state.bgFileName,
      bgFileSize: state.bgFileSize,
      bgFileType: state.bgFileType,
      certificateCode: state.certificateCode,
      canvasDimensions: state.canvasDimensions,
      elements: elementsWithBase64,
      prefixes: state.prefixes,
      selectedElement: state.selectedElement,
      previewMode: state.previewMode,
      activeSection: state.activeSection,
    };
    
    const serializedState = JSON.stringify(persistableState);
    localStorage.setItem('certificateState', serializedState);
  } catch (error) {
    console.error('Error saving state to localStorage:', error);
  }
};

export const useCertificateStore = create<CertificateState>()(
  devtools(
    (set, get) => ({
      bgImage: null,
      bgFile: null,
      bgFileName: null,
      bgFileSize: null,
      bgFileType: null,
      certificateCode: null,
      canvasDimensions: { width: 1123, height: 794 }, // Default A4 landscape
      elements: [
        {
          id: 'default-text-1',
          type: 'text',
          content: '{{name}} completed the {{course}} course',
          x: 150,
          y: 300,
          width: 800,
          height: 50,
          fontSize: 24,
          color: '#000000',
          fontFamily: 'Arial'
        }
      ],
      prefixes: [
        { id: 'name', name: 'Name', value: 'John Doe', type: 'name' },
        { id: 'course', name: 'Course', value: 'Advanced React', type: 'course' },
        { id: 'org', name: 'Organization', value: 'Acme Corp', type: 'organization' },
        { id: 'date', name: 'Date', value: new Date().toLocaleDateString(), type: 'date' },
      ],
      selectedElement: null,
      previewMode: false,
      activeSection: 'creator',

      setBgImage: (bgImage) => set({ bgImage }),

      setBgFile: (bgFile) => set({ bgFile }),

      setCertificateCode: (code) => set({ certificateCode: code }),

      generateNewCertificateCode: () => {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        const code = `cert_${timestamp}_${random}`;
        set({ certificateCode: code });
        return code;
      },

      // Convert blob URL to base64 for better persistence
      convertBgImageToBase64: async () => {
        const state = get();
        if (state.bgImage && state.bgImage.startsWith('blob:')) {
          try {
            const base64Image = await blobToBase64(state.bgImage);
            set({ bgImage: base64Image });
          } catch (error) {
            console.warn('Failed to convert background image to base64:', error);
          }
        }
      },

      // Convert all element images to base64
      convertElementImagesToBase64: async () => {
        const state = get();
        const updatedElements = await Promise.all(
          state.elements.map(async (element) => {
            if (element.type === 'image' && element.src && element.src.startsWith('blob:')) {
              try {
                const base64Src = await blobToBase64(element.src);
                return { ...element, src: base64Src };
              } catch (error) {
                console.warn('Failed to convert element image to base64:', error);
                return element;
              }
            }
            return element;
          })
        );
        set({ elements: updatedElements });
      },

      setBgFileMetadata: (file) => set({
        bgFileName: file?.name || null,
        bgFileSize: file?.size || null,
        bgFileType: file?.type || null
      }),

      setCanvasDimensions: (width, height) => set({ canvasDimensions: { width, height } }),

      scaleElementsToFitCanvas: (oldWidth, oldHeight, newWidth, newHeight) => {
        set((state) => {
          const scaleX = newWidth / oldWidth;
          const scaleY = newHeight / oldHeight;

          const scaledElements = state.elements.map(element => ({
            ...element,
            x: element.x * scaleX,
            y: element.y * scaleY,
            width: element.width * scaleX,
            height: element.height * scaleY,
          }));

          return { elements: scaledElements };
        });
      },

      setElements: (elements) => set({ elements }),

      addElement: (element) =>
        set((state) => ({
          elements: [...state.elements, element],
          selectedElement: element.id
        })),

      updateElement: (id, updates) =>
        set((state) => ({
          elements: state.elements.map(element =>
            element.id === id ? { ...element, ...updates } : element
          )
        })),

      removeElement: (id) =>
        set((state) => ({
          elements: state.elements.filter(element => element.id !== id),
          selectedElement: state.selectedElement === id ? null : state.selectedElement
        })),

      setPrefixes: (prefixes) => set({ prefixes }),

      addPrefix: (prefix) =>
        set((state) => ({
          prefixes: [...state.prefixes, prefix]
        })),

      updatePrefix: (id, updates) =>
        set((state) => ({
          prefixes: state.prefixes.map(prefix =>
            prefix.id === id ? { ...prefix, ...updates } : prefix
          )
        })),

      removePrefix: (id) =>
        set((state) => ({
          prefixes: state.prefixes.filter(prefix => prefix.id !== id)
        })),

      setSelectedElement: (id) => set({ selectedElement: id }),

      setPreviewMode: (previewMode) => set({ previewMode }),

      setActiveSection: (activeSection) => set({ activeSection }),

      reset: () => {
        // Clear localStorage
        localStorage.removeItem('certificateState');
        
        set({
          bgImage: null,
          bgFile: null,
          bgFileName: null,
          bgFileSize: null,
          bgFileType: null,
          certificateCode: null,
          elements: [
            {
              id: 'default-text-1',
              type: 'text',
              content: '{{name}} completed the {{course}} course',
              x: 150,
              y: 300,
              width: 800,
              height: 50,
              fontSize: 24,
              color: '#000000',
              fontFamily: 'Arial'
            }
          ],
          prefixes: [
            { id: 'name', name: 'Name', value: 'John Doe', type: 'name' },
            { id: 'course', name: 'Course', value: 'Advanced React', type: 'course' },
            { id: 'org', name: 'Organization', value: 'Acme Corp', type: 'organization' },
            { id: 'date', name: 'Date', value: new Date().toLocaleDateString(), type: 'date' },
          ],
          selectedElement: null,
          previewMode: false,
          activeSection: 'creator'
        });
      }
    }),
    { name: 'certificate-store' }
  )
);

// Middleware to persist state to localStorage with debouncing
let saveTimeout: NodeJS.Timeout | null = null;
const persistState = (state: any) => {
  // Debounce saves to avoid too frequent localStorage writes
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }
  saveTimeout = setTimeout(() => {
    saveState(state);
  }, 500);
};

// Subscribe to state changes to save to localStorage
useCertificateStore.subscribe(persistState);

// Load initial state if available
const loadedState = loadState();
if (loadedState) {
  // Ensure canvasDimensions is always properly initialized
  const safeDimensions = loadedState.canvasDimensions && 
    typeof loadedState.canvasDimensions === 'object' &&
    typeof loadedState.canvasDimensions.width === 'number' &&
    typeof loadedState.canvasDimensions.height === 'number'
    ? loadedState.canvasDimensions
    : { width: 1123, height: 794 };

  // Set all persistable properties including images
  useCertificateStore.setState({
    bgImage: loadedState.bgImage || null,
    bgFileName: loadedState.bgFileName,
    bgFileSize: loadedState.bgFileSize,
    bgFileType: loadedState.bgFileType,
    certificateCode: loadedState.certificateCode,
    canvasDimensions: safeDimensions,
    elements: loadedState.elements && loadedState.elements.length > 0
      ? loadedState.elements
      : [
          {
            id: 'default-text-1',
            type: 'text',
            content: '{{name}} completed the {{course}} course',
            x: 150,
            y: 300,
            width: 800,
            height: 50,
            fontSize: 24,
            color: '#000000',
            fontFamily: 'Arial'
          }
        ],
    prefixes: loadedState.prefixes || [
      { id: 'name', name: 'Name', value: 'John Doe', type: 'name' },
      { id: 'course', name: 'Course', value: 'Advanced React', type: 'course' },
      { id: 'org', name: 'Organization', value: 'Acme Corp', type: 'organization' },
      { id: 'date', name: 'Date', value: new Date().toLocaleDateString(), type: 'date' },
    ],
    selectedElement: loadedState.selectedElement,
    previewMode: loadedState.previewMode || false,
    activeSection: loadedState.activeSection || 'creator',
  });
}