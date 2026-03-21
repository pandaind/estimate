# API Tests

Newman/Postman test suite with 83 assertions across 47 requests.

## Run Tests

**Prerequisites:**
1. Backend running on http://localhost:8080
2. `JWT_SECRET` environment variable set when starting the backend

```bash
# Start the backend first (in backend/ directory):
export JWT_SECRET=$(openssl rand -base64 64)
mvn spring-boot:run

# Then run tests:
npm test
```

Or using Newman directly:

```bash
newman run planning-poker-api.postman_collection.json -e environment.json
```

## Authentication

The backend requires JWT authentication. The collection handles this automatically:

- **TC-003** creates a session and saves the moderator JWT token as `authToken`
- **TC-004** creates a second session and saves its moderator JWT as `authToken2`
- **TC-008** saves Alice's participant token as `aliceToken`
- All protected endpoints use `Authorization: Bearer {{authToken}}` automatically
- **TC-041** uses `{{aliceToken}}` to verify participants can't perform moderator actions
- **TC-040** intentionally sends no token to verify 401/403 is returned

## Test Coverage

- Health check & system validation
- Session management
- User/participant management
- Story management
- Voting flow
- Advanced scenarios
- Export/Import operations

**Total:** 39 tests across 6 phases

### Phase 3: User/Participant Management (6 tests)
- ✅ TC-008: Join Session (Regular User)
- ✅ TC-009: Join Session (Observer)
- ✅ TC-010: Rejoin Session (Same User)
- ✅ TC-011: Get Active Users
- ✅ TC-012: Update User Profile
- ✅ TC-013: Leave Session

### Phase 4: Story Management (7 tests)
- ✅ TC-014: Create Story (Basic)
- ✅ TC-015: Create Story (Full Details)
- ✅ TC-016: Get All Stories
- ✅ TC-017: Get Stories by Status
- ✅ TC-018: Get Single Story
- ✅ TC-019: Update Story
- ✅ TC-020: Set Current Story

### Phase 5: Voting Flow (13 tests)
- ✅ TC-022: Cast Vote (Regular User)
- ✅ TC-023: Cast Multiple Votes
- ✅ TC-044: Vote Count Visible Without Reveal
- ✅ TC-024: Observer Cannot Vote (Error)
- ✅ TC-025: Get Votes (Before Reveal)
- ✅ TC-026: Reveal Votes (Manual)
- ✅ TC-027: Get Votes (After Reveal)
- ✅ TC-031: Finalize Estimate
- ✅ TC-032: Reset Votes
- ✅ TC-033: Delete Vote

### Phase 6: Advanced Scenarios (3 tests)
- ✅ TC-034: Non-Numeric Votes (?, ☕, ∞)
- ✅ TC-035: Delete Story
- ✅ TC-036: Delete Session

## 📊 Test Reports

After running tests, reports are generated in the `reports/` directory:

### HTML Report
Open `reports/test-report.html` in a browser for:
- ✅ Visual test results
- 📈 Pass/Fail statistics
- 🕐 Response times
- 📋 Detailed request/response data
- 🐛 Error details with stack traces

### JSON Report
`reports/test-report.json` contains:
- Machine-readable test results
- Integration with CI/CD pipelines
- Automated test metrics

## 🔧 Environment Variables

The `environment.json` file manages test data:

```json
{
  "baseUrl": "http://localhost:8080",
  "sessionCode": "",        // Auto-populated during test run
  "aliceUserId": "",        // Auto-populated during test run
  "bobUserId": "",          // Auto-populated during test run
  "story1Id": "",           // Auto-populated during test run
  ...
}
```

**Note:** Variables are automatically set by test scripts using `pm.collectionVariables.set()`.

## 📝 Collection Variables

The Postman collection uses collection variables for data flow between tests:

- `sessionCode` - Created in TC-003, used in subsequent tests
- `sessionCode2` - Created in TC-004 for multi-session tests
- `moderatorId` - Set when creating session
- `aliceUserId`, `bobUserId`, etc. - Set when users join
- `story1Id`, `story2Id`, etc. - Set when creating stories

## 🎯 Test Assertions

Each test includes multiple assertions:

```javascript
// Status code validation
pm.test('Status code is 200', function () {
    pm.response.to.have.status(200);
});

// Response data validation
pm.test('Session created with valid code', function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('sessionCode');
    pm.expect(jsonData.sessionCode).to.have.lengthOf(6);
});

// Save data for next tests
pm.collectionVariables.set('sessionCode', jsonData.sessionCode);
```

## 🔄 Test Workflow

Tests are designed to run sequentially as they build upon each other:

1. **Health Check** → Verify server is running
2. **Create Session** → Get sessionCode
3. **Join Users** → Get userIds
4. **Create Stories** → Get storyIds
5. **Vote & Reveal** → Test voting flow
6. **Finalize & Cleanup** → Complete workflow

## ⚠️ Important Notes

1. **Server Must Be Running**: Ensure backend is running on port 8080 before running tests
2. **Sequential Execution**: Tests must run in order (don't shuffle)
3. **State Management**: Tests create and use data (session codes, user IDs, etc.)
4. **Auto-Cleanup**: Some tests perform cleanup (delete operations)

## 🐛 Troubleshooting

### Tests Failing?

1. **Check Backend Server**
   ```bash
   curl http://localhost:8080/api/health
   ```
   Should return: `{"status":"UP","timestamp":"..."}`

2. **Check Java Version**
   ```bash
   java -version
   ```
   Should show Java 21

3. **Check Environment**
   - Verify `baseUrl` in environment.json is correct
   - Ensure no other service is using port 8080

4. **Run Tests with Verbose Output**
   ```bash
   npm run test:verbose
   ```

### Common Issues

**Issue: "ECONNREFUSED"**
- Solution: Start the backend server

**Issue: "404 Not Found"**
- Solution: Check API endpoints match controller mappings

**Issue: "Observer cannot vote" not failing**
- Solution: Ensure observer was created with `isObserver: true`

**Issue: "Session not found"**
- Solution: Check if session creation succeeded in TC-003

## 📈 CI/CD Integration

### GitHub Actions Example

```yaml
name: API Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      
      - name: Set up Java 21
        uses: actions/setup-java@v2
        with:
          java-version: '21'
          
      - name: Start Backend
        run: |
          cd backend
          mvn spring-boot:run &
          sleep 30
          
      - name: Install Newman
        run: npm install -g newman
        
      - name: Run API Tests
        run: |
          cd tests
          npm run test:ci
          
      - name: Upload Test Reports
        uses: actions/upload-artifact@v2
        if: always()
        with:
          name: test-reports
          path: api-testing/reports/
```

## 🎉 Success Criteria

All tests should pass with:
- ✅ 100% pass rate
- ✅ Response times < 500ms
- ✅ No 500 errors
- ✅ Proper error handling (404, 400)
- ✅ Data consistency across tests

## 📞 Support

If tests fail:
1. Review the HTML report for detailed error messages
2. Check the [BACKEND_TEST_PLAN.md](../BACKEND_TEST_PLAN.md) for expected behavior
3. Verify backend logs for server-side errors
4. Check H2 Console (http://localhost:8080/h2-console) for database state

## 🚀 Next Steps

After all tests pass:
1. ✅ Backend is validated and ready for UI development
2. 📝 Update API documentation if needed
3. 🎨 Start frontend integration
4. 🔄 Add these tests to CI/CD pipeline
5. 📊 Set up test coverage monitoring

**Happy Testing! 🎉**
