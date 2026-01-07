import { createCanvas, loadImage, registerFont } from 'canvas';
import AWS from 'aws-sdk';

// Types (Mirroring the database schema)
interface CertificateTemplate {
  id: string;
  background_url: string;
  elements: CertificateElement[];
  canvas_settings: { width: number; height: number };
}

interface CertificateElement {
  type: 'text' | 'image';
  content?: string; // For text
  src?: string;     // For images
  x: number;
  y: number;
  width: number;
  height: number;
  fontSize?: number;
  color?: string;
  fontFamily?: string;
  fontWeight?: string;
}

interface UserData {
  name: string;
  course: string;
  date: string;
  organization: string;
  [key: string]: string; // Allow flexible keys
}

// AWS Configuration
// Ensure these env vars are set in your Node.js service
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

export class CertificateGenerator {

  /**
   * Generates a certificate and uploads it to S3
   * @param template The template configuration object
   * @param userData The user data to fill in placeholders
   * @param certificateCode Unique code for the certificate
   */
  async generateAndUpload(
    template: CertificateTemplate,
    userData: UserData,
    certificateCode: string
  ): Promise<string> {
    try {
      // 1. Initialize Canvas
      const { width, height } = template.canvas_settings;
      const canvas = createCanvas(width, height);
      const ctx = canvas.getContext('2d');

      // 2. Load and Draw Background
      // Note: 'loadImage' supports http/https URLs natively
      console.log('Loading background...', template.background_url);
      const bgImage = await loadImage(template.background_url);
      ctx.drawImage(bgImage, 0, 0, width, height);

      // 3. Render Elements
      for (const element of template.elements) {
        if (element.type === 'text') {
          this.drawText(ctx, element, userData);
        } else if (element.type === 'image') {
          await this.drawImage(ctx, element);
        }
      }

      // 4. Convert to Buffer (JPEG for web viewing)
      const buffer = canvas.toBuffer('image/jpeg', { quality: 0.95 });

      // 5. Upload to S3
      const s3Url = await this.uploadToS3(buffer, certificateCode);

      return s3Url;

    } catch (error) {
      console.error('Certificate Generation Failed:', error);
      throw error;
    }
  }

  private drawText(ctx: any, element: CertificateElement, data: UserData) {
    if (!element.content) return;

    // Replace placeholders (e.g., {{name}} -> "John Doe")
    let text = element.content;
    Object.keys(data).forEach(key => {
      const regex = new RegExp(`{{${key}}}`, 'gi');
      text = text.replace(regex, data[key] || '');
    });

    // Configure Font
    const fontSize = element.fontSize || 24;
    const fontFamily = element.fontFamily || 'Arial';

    // Note: To use custom fonts, you must call registerFont() before this
    // e.g. registerFont('path/to/font.ttf', { family: 'CustomFont' });

    ctx.font = `${fontSize}px "${fontFamily}"`;
    ctx.fillStyle = element.color || '#000000';
    ctx.textBaseline = 'top';

    // Draw the text
    ctx.fillText(text, element.x, element.y);
  }

  private async drawImage(ctx: any, element: CertificateElement) {
    if (!element.src) return;
    try {
      const img = await loadImage(element.src);
      ctx.drawImage(img, element.x, element.y, element.width, element.height);
    } catch (e) {
      console.warn(`Failed to load element image: ${element.src}`, e);
    }
  }

  private async uploadToS3(buffer: Buffer, code: string): Promise<string> {
    const bucketName = process.env.S3_BUCKET_NAME!;
    const key = `certificates/${code}.jpg`;

    const params = {
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: 'image/jpeg',
      ACL: 'public-read'
    };

    const result = await s3.upload(params).promise();
    return result.Location;
  }
}
