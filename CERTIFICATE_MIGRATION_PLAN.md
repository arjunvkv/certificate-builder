# Certificate Builder Migration Plan

This document outlines the architectural plan for migrating the Certificate Builder feature to a Node.js backend service within the LMS ecosystem.

## 1. Database Schema (PostgreSQL)

Three tables are required to manage templates, course associations, and user certificates.

### 1.1 `certificate_templates`
Stores the design layout, background images, and element coordinates.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key (Default: `uuid_generate_v4()`) |
| `name` | `VARCHAR` | Friendly name for the template |
| `background_url` | `VARCHAR` | S3 URL of the uploaded base background image |
| `elements` | `JSONB` | Array of elements (Coordinates: x, y, width, height, type, style) |
| `prefixes` | `JSONB` | Configuration for dynamic placeholders (e.g., `{{name}}`) |
| `canvas_settings` | `JSONB` | Metadata like `{ "width": 1123, "height": 794 }` |
| `created_at` | `TIMESTAMP` | |
| `updated_at` | `TIMESTAMP` | |

### 1.2 `course_certificates`
Links a specific Course to a Certificate Template.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key |
| `course_id` | `UUID` | **Foreign Key** (Links to LMS Courses table) |
| `template_id` | `UUID` | **Foreign Key** (Links to `certificate_templates`) |
| `is_active` | `BOOLEAN` | Toggle certification availability for a course |
| `created_at` | `TIMESTAMP` | |
| `UNIQUE(course_id)` | Constraint | Ensure only one active template per course |

### 1.3 `user_certificates`
Records issued certificates.

| Column | Type | Description |
| :--- | :--- | :--- |
| `id` | `UUID` | Primary Key |
| `user_id` | `UUID` | **Foreign Key** (Links to LMS Users table) |
| `course_id` | `UUID` | **Foreign Key** (Links to LMS Courses table) |
| `certificate_url` | `VARCHAR` | Final S3 URL of the generated PDF/Image |
| `certificate_code` | `VARCHAR` | Unique alphanumeric code for verification |
| `issued_at` | `TIMESTAMP` | |

---

## 2. Backend Architecture (Node.js)

### 2.1 Certificate Generation Logic
Instead of using `html2canvas` (frontend-only), the backend will use the **`canvas`** (Node.js binding) library to programmatically draw the certificate.

**Algorithm:**
1.  **Input:** Template ID, User Data (Name, Course Name, Date).
2.  **Setup:** Create a `canvas` instance with the template dimensions.
3.  **Background:** Fetch `background_url` and draw it on the canvas context.
4.  **Elements:** Iterate through the `elements` JSON array.
    *   **Text:** Replace placeholders in content (e.g., `{{name}}` -> "John"). Set font properties and draw text at `(x, y)`.
    *   **Image:** Load image from URL and draw at `(x, y)`.
5.  **Output:** Export canvas to a Buffer (JPEG or PDF).
6.  **Storage:** Upload Buffer to AWS S3.

### 2.2 Dependencies
*   `canvas` (or `pdfkit`): For server-side rendering.
*   `aws-sdk` (v2 or v3): For S3 uploads.
*   `uuid`: For key generation.

---

## 3. API Endpoints

### 3.1 Template Management
*   `POST /api/templates`
    *   **Body:** `{ name, background_url, elements, prefixes, canvas_settings }`
    *   **Action:** Saves the JSON configuration designed in the frontend builder.

*   `POST /api/upload/presigned-url`
    *   **Body:** `{ filename, fileType }`
    *   **Action:** Returns a signed S3 URL so the frontend can upload the **Background Image** directly.

### 3.2 Certificate Issuance
*   `POST /api/certificates/generate`
    *   **Body:** `{ userId, courseId }`
    *   **Action:**
        1.  Verifies course completion (if needed).
        2.  Fetches the active template for the course.
        3.  Runs the **Generation Logic** (see 2.1).
        4.  Saves record to `user_certificates`.
        5.  Returns `{ certificate_url, certificate_code }`.

---

## 4. Frontend Migration Strategy

1.  **Designer Mode:** Keep the existing "Certificate Builder" UI.
    *   **Change:** Instead of "Downloading PDF", add a "Save Template" button that calls `POST /api/templates`.
2.  **User View:**
    *   Remove client-side generation logic (`html2canvas`) for end-users.
    *   **Change:** When a user clicks "Download Certificate", call the backend `POST /api/certificates/generate` endpoint and open the returned URL.
