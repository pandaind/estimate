# E2E Test Coverage - What We Test

This document explains in simple English what our end-to-end (E2E) tests check in the Planning Poker application.

## 📊 Test Summary

**Total Tests:** 24 tests
- ✅ **Passing:** 20 tests
- ⏭️ **Skipped:** 4 tests (features not yet built)

**Browsers Tested:**
- Google Chrome (Chromium)
- Mozilla Firefox

---

## 1️⃣ Session Management (3 tests)

These tests check if users can create and join planning poker sessions.

### ✅ Create a new session
**What it tests:** A facilitator can create a new planning poker session
- Fill in session name and facilitator name
- Click "Create Session" button
- Verify they're taken to the session page
- Confirm a 6-character session code is generated

### ✅ Join an existing session
**What it tests:** A participant can join a session using the session code
- Open the app in a new browser window
- Enter the session code
- Enter their name
- Click "Join Session"
- Verify they successfully enter the session

### ✅ Display session code for sharing
**What it tests:** The session code is clearly shown so facilitators can share it
- Create a session
- Confirm the session code is visible on screen
- Verify it's the correct 6-character format

---

## 2️⃣ Story Management (4 tests)

These tests check how users can add and manage stories (work items) to estimate.

### ✅ Add a new story
**What it tests:** Users can add stories to the session
- Navigate to the "Estimate" tab
- Enter a story title
- Click "Create Story"
- Verify the story appears in the list

### ⏭️ Edit an existing story (SKIPPED - Not Yet Built)
**What it would test:** Users can edit story details after creating them
- This feature isn't implemented yet
- Will test editing story title and description

### ⏭️ Delete a story (SKIPPED - Not Yet Built)
**What it would test:** Users can remove stories from the session
- This feature isn't implemented yet
- Will test clicking delete button and confirming deletion

### ⏭️ Navigate between stories (SKIPPED - Not Yet Built)
**What it would test:** Users can move to previous/next stories
- This feature isn't implemented yet
- Will test Previous/Next navigation buttons

---

## 3️⃣ Voting and Estimation (6 tests)

These tests check the core planning poker voting functionality.

### ✅ Cast a vote
**What it tests:** Users can select an estimation card to vote
- Click on an estimation card (e.g., "5 points")
- Verify the card appears selected
- Confirm the vote is registered

### ✅ Change vote before it's revealed
**What it tests:** Users can change their mind before votes are shown
- Cast an initial vote (e.g., 3 points)
- Click a different card (e.g., 5 points)
- Verify the new selection replaces the old one

### ✅ Reveal votes when everyone has voted
**What it tests:** The facilitator can show everyone's votes
- Multiple users join and vote
- Facilitator clicks "Reveal Votes"
- Everyone can see all the votes
- Votes show which user voted for what

### ✅ Show voting statistics after reveal
**What it tests:** Statistics are displayed after votes are revealed
- Votes are revealed
- Check that average, minimum, and maximum are shown
- Verify a summary with vote totals appears

### ⏭️ Reset voting for next round (SKIPPED - Different Feature Exists)
**What it would test:** Starting a new voting round globally
- Currently, there's a "Revote" button for individual stories
- A global "New Round" button isn't implemented yet

### ✅ Support different estimation scales
**What it tests:** Users can choose different number sequences for voting
- Test Fibonacci scale (1, 2, 3, 5, 8, 13, 21)
- Test T-Shirt sizes (XS, S, M, L, XL)
- Verify the correct cards appear for each scale

---

## 4️⃣ Real-time Collaboration (3 tests)

These tests verify that updates happen instantly for all users in the session.

### ✅ Update participant list when users join
**What it tests:** The participant list updates live as people join
- Facilitator creates a session
- Participant joins in another browser
- Verify the facilitator sees the new participant appear immediately
- Check participant count updates from 1 to 2

### ✅ Show voting status in real-time
**What it tests:** Everyone sees when someone votes (without seeing the vote)
- Multiple users in a session
- One user casts a vote
- Other users see "voted" status appear next to that person's name
- Voting progress indicator updates

### ✅ Sync story changes across all participants
**What it tests:** When a story is added, everyone sees it instantly
- Facilitator and participant both in session
- Facilitator creates a new story
- Participant sees the new story appear without refreshing
- Story becomes the active voting item for everyone

---

## 5️⃣ Analytics Dashboard (4 tests)

These tests check the analytics and statistics features (for facilitators).

### ✅ Display session metrics
**What it tests:** Basic session statistics are shown correctly
- Navigate to Analytics tab
- Verify total participants count
- Check total stories count
- Confirm average estimate is calculated

### ✅ Show voting distribution chart
**What it tests:** A visual chart shows how votes are distributed
- Multiple votes are cast
- Analytics tab shows a bar chart
- Chart displays how many people voted for each value
- Percentages or counts are visible

### ✅ Display consensus indicator
**What it tests:** Shows how much agreement there is among voters
- When votes are similar (e.g., all 5s), consensus is high
- When votes are spread (e.g., 1, 5, 13), consensus is low
- A visual indicator (like "High Consensus" or "Low Consensus") appears

### ✅ Show story-specific analytics
**What it tests:** Analytics can be viewed for individual stories
- Multiple stories with votes
- Analytics tab shows breakdown by story
- Each story shows its own voting statistics
- Can see which stories had agreement vs. disagreement

---

## 6️⃣ Fixture Examples (4 tests)

These are example tests that demonstrate how to use test helpers/fixtures efficiently.

### ✅ Use session fixture for quick setup
**What it tests:** Our test helpers work correctly
- Demonstrates creating a session with less code
- Verifies the session fixture sets everything up properly

### ✅ Use multiUser fixture for collaboration tests
**What it tests:** Our multi-user test helper works
- Shows how to easily test features with multiple users
- Verifies facilitator and participants are set up correctly

### ✅ Handle voting consensus
**What it tests:** Test helper works when everyone agrees
- Multiple users vote the same value
- Verifies consensus is detected and displayed

### ✅ Handle voting divergence
**What it tests:** Test helper works when votes differ
- Multiple users vote different values
- Verifies divergence is detected and displayed

---

## 🎯 What Does This Mean?

Our E2E tests act like real users:
- They open the website in actual browsers (Chrome and Firefox)
- They click buttons, fill in forms, and interact with the interface
- They check that everything works as expected

When these tests pass, we know that:
- ✅ Users can successfully create and join sessions
- ✅ Voting works correctly for everyone
- ✅ Real-time updates happen instantly
- ✅ Analytics and statistics are accurate
- ✅ The app works in both Chrome and Firefox

---

## ⏭️ Skipped Tests (4)

These tests are written but skipped because the features aren't built yet:
1. Edit story - UI for editing stories doesn't exist
2. Delete story - Delete button not implemented
3. Navigate between stories - Previous/Next buttons not added
4. New Round button - Works differently (per-story Revote instead of global reset)

These are tracked in [FUTURE_FEATURES.md](../FUTURE_FEATURES.md) for future implementation.

---

## 📝 Test Files Location

All test files are in the `tests/` folder:
- `session.spec.js` - Session creation and joining
- `story-management.spec.js` - Adding/managing stories
- `voting.spec.js` - Voting and estimation
- `realtime-collaboration.spec.js` - Live updates
- `analytics.spec.js` - Statistics and charts
- `examples.spec.js` - Test helper demonstrations
