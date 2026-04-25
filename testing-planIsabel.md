## Unit Testing Plan Isabel

Test 1: GET /status with valid sessionId  
- Verifies API returns assignments data  
- Checks JSON structure and status code  

Test 2: GET /status with invalid sessionId  
- Verifies API handles invalid input correctly  
- Expected: error message and empty assignments  

Test 3: stripHtml() function  
- Verifies HTML is removed properly  
- Ensures clean text output  

Framework: Supertest + Jest  