# Reference Implementation

This directory contains example code for the backend certificate generation service.

## Files

*   `CertificateGenerator.ts`: A TypeScript class that uses `canvas` to draw the certificate based on a JSON template and uploads it to S3.
*   `CertificateController.js`: An example Controller method showing how to wire up the generation logic in an API endpoint.

## Usage

1.  Copy these files to your Node.js backend service.
2.  Install dependencies:
    ```bash
    npm install canvas aws-sdk
    ```
3.  Set Environment Variables:
    *   `AWS_ACCESS_KEY_ID`
    *   `AWS_SECRET_ACCESS_KEY`
    *   `AWS_REGION`
    *   `S3_BUCKET_NAME`

## Note on Fonts
If your templates use custom fonts, you must load them in the `CertificateGenerator` using `registerFont()` from the `canvas` package before drawing text.
