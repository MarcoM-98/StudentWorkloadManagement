# Sprint Unit Test Results

## Framework

Jest

---

# Kyle Kronk

## Test 1 - File Type Validation

Verified that the upload feature accepts supported assignment file formats.

### Files Tested

* TXT upload type accepted
* PDF upload type accepted
* DOCX upload type accepted

### Test 1 Output

```text
PASS __tests__/upload-types.test.js
Assignment Upload File Types
✓ accepts txt files
✓ accepts pdf files
✓ accepts docx files

Test Suites: 1 passed, 1 total
Tests: 3 passed, 3 total
```

### Summary

All supported upload file types were successfully validated.

---

## Test 2 - Upload API Integration

Verified that clicking the upload button correctly calls both required API routes.

### Routes Tested

* /api/upload
* /api/analyze

### Test 2 Output

```text
PASS __tests__/upload.test.js
Assignment Upload API Calls
✓ upload button calls upload and analyze API routes (50 ms)

Test Suites: 1 passed, 1 total
Tests: 1 passed, 1 total
Snapshots: 0 total
Time: 0.817 s
Ran all test suites.
```

### Summary

The upload process successfully triggered both backend API endpoints.

---

## Test 3 - Combined Test Execution

Ran multiple test suites together to verify overall feature stability.

### Test 3 Output

```text
> enchiladas@0.1.0 test
> jest

PASS __tests__/upload.test.js
PASS __tests__/analyze-response.test.js

Test Suites: 2 passed, 2 total
Tests: 2 passed, 2 total
Snapshots: 0 total
Time: 1.026 s, estimated 2 s
Ran all test suites.
```

### Summary

All combined tests completed successfully with no failures.

---

## Overall Results

* Total Test Suites Passed: 4
* Total Tests Passed: 6
* Total Failures: 0

## Conclusion

The assignment upload and analysis features are functioning correctly. Supported file types were accepted, required API routes were called successfully, and all tested components passed.

---

# Kacin Segovia


| Test | Status |
|------|--------|
| Test 1 | Pending |
| Test 2 | Pending |
| Test 3 | Pending |

Notes:
[Add result notes here]

---

# Marco Mosqueda

| Test | Status |
|------|--------|
| Test 1 | Pending |
| Test 2 | Pending |
| Test 3 | Pending |

Notes:
[Add result notes here]

---

# Isabel Garcia

| Test | Status |
|------|--------|
| Test 1 | Pending |
| Test 2 | Pending |
| Test 3 | Pending |

Notes:
[Add result notes here]