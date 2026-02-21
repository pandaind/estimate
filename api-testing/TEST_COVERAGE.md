# API Test Coverage - What We Test

This document explains in simple English what our API tests check in the Planning Poker backend.

## 📊 Test Summary

**Total Tests:** 44 API tests
- ✅ **All Passing:** 44/44 tests

**What We Test:** The backend API (server) without the user interface

---

## 1️⃣ System Health & Setup (2 tests)

These tests check if the backend server is running properly.

### ✅ Health Check
**What it tests:** The server is alive and responding
- Send a request to check if the API is running
- Verify we get a successful response
- Confirm the server is healthy

### ✅ Get Sizing Methods
**What it tests:** All supported estimation scales are available
- Request the list of sizing methods
- Verify all 5 methods returned: FIBONACCI, T_SHIRT, POWERS_OF_2, LINEAR, CUSTOM
- Confirm correct format

---

## 2️⃣ Session Management (8 tests)

These tests check creating, finding, and managing planning poker sessions.

### ✅ Create Session (Basic)
**What it tests:** Can create a simple session
- Send session name and facilitator name
- Receive a unique 6-character session code
- Session is created successfully

### ✅ Create Session (With Options)
**What it tests:** Can create session with custom settings
- Include estimation scale (Fibonacci, T-Shirt)
- Set session description
- Customize voting rules
- All settings are saved correctly

### ✅ Verify moderatorCanVote=true on Custom Session
**What it tests:** The moderatorCanVote=true setting is correctly stored and returned (TC-042)
- Retrieve the custom session created with `moderatorCanVote: true`
- Confirm the field is present in the session response
- Verify the value is `true` — symmetric check to TC-021

### ✅ Get Session by Code
**What it tests:** Can look up a session using its code
- Use the 6-character code
- Get back all session details
- Verify session name, facilitator, settings match

### ✅ Get Session by Invalid Code (Error Test)
**What it tests:** Proper error when session doesn't exist
- Request a session with fake code
- Server returns 404 Not Found error
- Error message is clear

### ✅ List All Active Sessions
**What it tests:** Can see all ongoing sessions
- Request list of sessions
- Get array of all active sessions
- Each session has basic info (code, name, participant count)

### ✅ Update Session Settings
**What it tests:** Can change session configuration
- Modify session name
- Change estimation scale
- Update description
- Changes are saved

### ✅ Delete Session
**What it tests:** Can remove a session completely
- Delete a session by code
- Verify it's removed from database
- Trying to access it returns 404 error

---

## 3️⃣ User & Participant Management (6 tests)

These tests check how users join, leave, and interact with sessions.

### ✅ Join Session (Regular User)
**What it tests:** Participant can join a session
- Provide session code and user name
- User receives unique user ID
- User is added to participant list

### ✅ Join Session (Observer)
**What it tests:** Observer can join without voting rights
- Join with "observer" role
- User is added to session
- User marked as observer (cannot vote)

### ✅ Rejoin Session (Same User)
**What it tests:** User can rejoin if they disconnect
- User joins with same name/ID
- Session recognizes returning user
- Previous votes/data are preserved

### ✅ Get Active Users
**What it tests:** Can see who's currently in the session
- Request participant list
- Get array of all users
- Shows names, roles, voting status

### ✅ Update User Profile
**What it tests:** Users can change their information
- Change display name
- Update role (participant ↔ observer)
- Changes are reflected immediately

### ✅ Leave Session
**What it tests:** Users can exit a session
- User sends leave request
- User removed from active participants
- Participant count decreases

---

## 4️⃣ Story Management (7 tests)

These tests check creating and managing stories (work items to estimate).

### ✅ Create Story (Basic)
**What it tests:** Can add a simple story
- Provide story title
- Story gets unique ID
- Story added to session backlog

### ✅ Create Story (Full Details)
**What it tests:** Can create story with all information
- Include title, description, acceptance criteria
- Add priority and category
- All details are saved

### ✅ Get All Stories
**What it tests:** Can retrieve complete story list
- Request all stories in session
- Get array of stories
- Each story has ID, title, status, votes

### ✅ Get Stories by Status
**What it tests:** Can filter stories by their state
- Filter by "pending" (not voted)
- Filter by "finalized" (estimate complete)
- Only matching stories returned

### ✅ Get Single Story
**What it tests:** Can look up one specific story
- Request story by ID
- Get full story details
- Includes title, description, votes, estimate

### ✅ Update Story
**What it tests:** Can modify story information
- Change title or description
- Update priority
- Modify acceptance criteria
- Updates are saved

### ✅ Set Current Story
**What it tests:** Can make a story active for voting
- Mark story as "current"
- Previous current story becomes inactive
- All users see the new active story

---

## 5️⃣ Voting Flow (15 tests)

These tests check the core voting and estimation functionality.

### ✅ Verify moderatorCanVote Setting (moderatorCanVote=false)
**What it tests:** The moderatorCanVote field is correctly persisted and returned
- Retrieve the basic session (created with moderatorCanVote=false)
- Verify the `moderatorCanVote` field is present in the response
- Confirm it is `false` as configured during session creation

### ✅ Cast Vote (Regular User)
**What it tests:** Participant can submit a vote
- Send vote value (e.g., 5 points)
- Vote linked to user and story
- Vote is recorded in database

### ✅ Duplicate Vote Updates Existing Vote (Upsert)
**What it tests:** Re-voting overrides the previous estimate rather than creating a duplicate (TC-043)
- Same user submits a second vote on the same story
- Server updates the existing vote (upsert behaviour)
- New estimate value is returned — old value is gone

### ✅ Cast Multiple Votes
**What it tests:** Multiple users can vote on same story
- Different users each submit votes
- All votes are stored separately
- No votes overwrite each other

### ✅ Observer Cannot Vote (Error Test)
**What it tests:** Observers are blocked from voting
- Observer tries to submit vote
- Server returns 403 Forbidden error
- Error message explains observers can't vote

### ✅ Get Votes (Before Reveal)
**What it tests:** Can check voting status without seeing values
- Request current votes
- Get list of who voted (but not their values)
- Shows "voted" or "not voted" status

### ✅ Reveal Votes (Manual)
**What it tests:** Facilitator can show all votes
- Send "reveal" command
- All vote values become visible
- Everyone can see who voted what

### ✅ Get Votes (After Reveal)
**What it tests:** Vote values are visible after reveal
- Request votes after revealing
- Get complete vote data (user + value)
- Statistics are calculated (avg, min, max)

### ✅ Auto-Reveal When All Vote
**What it tests:** Votes reveal automatically when everyone submits
- Enable auto-reveal setting
- Last user submits vote
- Votes reveal without manual trigger

### ✅ Change Vote Before Reveal
**What it tests:** Users can modify vote before it's shown
- User casts initial vote (e.g., 3)
- User changes to different vote (e.g., 5)
- New vote replaces old one
- No duplicate votes exist

### ✅ Finalize Estimate
**What it tests:** Can set final estimate for a story
- Votes are revealed
- Facilitator picks final value
- Story status becomes "finalized"
- Estimate is saved

### ✅ Reset Story for Revoting
**What it tests:** Can wipe a story's estimate and votes to allow revoting
- Story has a finalized estimate
- Moderator sends reset command
- Story status reverts to NOT_ESTIMATED
- All votes are cleared for fresh round

### ✅ Reset Votes (Revote)
**What it tests:** Can clear votes to revote on a story
- Story has existing votes
- Send "reset" command
- All votes are deleted
- Story goes back to "voting" state

### ✅ Delete Vote
**What it tests:** Individual vote can be removed
- User has cast a vote
- User or facilitator deletes it
- Vote is removed from database
- User shows as "not voted"

### ✅ Non-Numeric Votes (?, ☕, ∞)
**What it tests:** Special voting cards work
- Vote with "?" (don't know)
- Vote with "☕" (need break)
- Vote with "∞" (too large)
- All special values are stored correctly

---

## 6️⃣ Advanced Scenarios (5 tests)

These tests check complex real-world situations.

### ✅ Non-Numeric Votes (?, ☕, ∞)
**What it tests:** Special voting cards work (TC-034)
- Vote with "?" (don't know), "☕" (need break), "∞" (too large)
- All special string values are stored and returned correctly

### ✅ Request Without Auth Token (Error Handling)
**What it tests:** Protected endpoints reject requests with no authentication token (TC-040)
- Send a moderator-only request with the auth token deliberately cleared
- Server returns 401 or 403
- Confirms JWT guard is active on all protected routes

### ✅ Participant Cannot Perform Moderator Action (Error Handling)
**What it tests:** Role-based access control blocks participants from moderator endpoints (TC-041)
- Authenticate as Alice (PARTICIPANT role) and call a MODERATOR-only endpoint
- Server returns 403 Forbidden
- Confirms `@PreAuthorize("hasRole('MODERATOR')")` is enforced

### ✅ Delete Story
**What it tests:** Stories can be permanently removed (TC-035)
- Delete a story by ID
- Story no longer appears in story list

### ✅ Delete Session
**What it tests:** Sessions can be soft-deleted (TC-036)
- Delete a session by code
- Session is no longer accessible

---

## 7️⃣ Export & Import (4 tests)

These tests check data export and import functionality.

### ✅ Export Session Data (JSON)
**What it tests:** Can export complete session as JSON file
- Request session export
- Get JSON with all data (stories, votes, users)
- Data is complete and valid

### ✅ Export Session Data (CSV)
**What it tests:** Can export voting results as spreadsheet
- Request CSV export
- Get comma-separated values
- Suitable for Excel/Google Sheets

### ✅ Import Session Template
**What it tests:** Can import pre-made session structure
- Upload JSON template
- Session created with pre-defined stories
- All template data is loaded

### ✅ Import Stories from File
**What it tests:** Can bulk-import stories
- Upload file with multiple stories
- All stories created in session
- Titles, descriptions, priorities loaded correctly

---

## 8️⃣ Error Handling & Validation (4 tests)

These tests verify the API handles bad requests properly.

### ✅ Create Session Without Name (Error)
**What it tests:** Required fields are enforced
- Try to create session with missing name
- Server returns 400 Bad Request
- Error message lists missing fields

### ✅ Join Non-Existent Session (Error)
**What it tests:** Validates session exists before joining
- Try to join with invalid code
- Returns 404 Not Found
- Clear error message

### ✅ Vote on Finalized Story (Error)
**What it tests:** Cannot vote after story is complete
- Try to vote on finished story
- Returns 409 Conflict error
- Explains story is already finalized

### ✅ Invalid Vote Value (Error)
**What it tests:** Validates vote is from allowed values
- Try to vote with invalid number
- Try to vote with unsupported value
- Returns 400 Bad Request with validation message

---

## 🎯 What Does This Mean?

Our API tests verify the backend server:
- They send HTTP requests directly to the server (no browser needed)
- They check that the server responds correctly
- They verify data is stored properly in the database

When these tests pass, we know that:
- ✅ All server endpoints work correctly
- ✅ Data is saved and retrieved properly
- ✅ Errors are handled appropriately
- ✅ Sessions, stories, and votes function as expected
- ✅ Multiple users can work simultaneously without conflicts

---

## 🔧 How These Tests Work

**Technology:** Newman (Postman's command-line tool)

**Test Process:**
1. Load the test collection (44 pre-defined API requests)
2. Start with health check
3. Create test session
4. Run all scenarios
5. Generate HTML and JSON reports

**Running Tests:**
```bash
cd api-testing
npm test
```

**Requirements:**
- Backend must be running on http://localhost:8080
- Database should be clean (or tests will clean up after themselves)

---

## 📋 Test Execution Order

Tests run in a specific sequence:
1. **Phase 1:** Health & Version ← Verify server is running
2. **Phase 2:** Session Management ← Create and configure sessions
3. **Phase 3:** User Management ← Join users to sessions
4. **Phase 4:** Story Management ← Add stories to vote on
5. **Phase 5:** Voting Flow ← Complete voting process
6. **Phase 6:** Advanced Scenarios ← Test complex workflows
7. **Phase 7:** Export/Import ← Data transfer features

Each phase depends on the previous ones completing successfully.

---

## 📝 Test Files Location

- `planning-poker-api.postman_collection.json` - All 40 test cases
- `environment.json` - Test configuration (URLs, auto-generated IDs)
- `run-tests.sh` - Script to run tests and generate reports
- `reports/` - Test results (HTML and JSON files)
