# Assignment Upload System Design

## Purpose
Define the rules and flow for uploading assignment documents so the system can analyze them and estimate workload time.

## Supported File Types
Allowed file types:
- .pdf
- .docx
- .txt

Rejected file types:
- .exe
- .zip
- .png / .jpg
- other unsupported formats

Reason:
These formats are common for assignment instructions and can be reliably parsed for text extraction.

## File Size Limit
Maximum upload size: 10MB

Reason for 10MB limit:
- Assignment instruction files are typically under 1–2MB
- Prevents extremely large uploads that could slow the server
- Reduces storage usage
- Helps protect against abuse or denial-of-service style uploads

## Upload Flow

User uploads assignment file
↓
Frontend validates file type and file size
↓
File sent to POST /api/upload
↓
Server receives and stores file
↓
Text extracted from document
↓
Text sent to AI workload estimator
↓
Estimated workload returned to frontend
↓
Estimate displayed to user

## API Endpoint

POST /api/upload

Request type:
multipart/form-data

Expected field:
file

Example response:

{
  "success": true,
  "filename": "assignment.pdf"
}

## Error Handling

Unsupported file type → reject upload  
File larger than 10MB → reject upload  
Missing file → return error response  
Successful upload → store file and continue processing

## Future Improvements
- support for additional file formats
- multiple file uploads
- Canvas or LMS integration
- upload progress indicators
- automatic deadline detection