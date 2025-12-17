export interface TextField {
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

export interface ImageElement {
  id: string;
  type: 'image';
  src: string | null;
  x: number;
  y: number;
  width: number;
  height: number;
  file?: File;
}

export type CertificateElement = TextField | ImageElement;

export interface Prefix {
  id: string;
  name: string;
  value: string;
  type: 'name' | 'course' | 'organization' | 'date' | 'other';
}