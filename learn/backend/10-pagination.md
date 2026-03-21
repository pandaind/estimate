# 10 — Pagination with Spring Data

## The problem with returning everything

Every controller endpoint that lists a collection — stories, users, votes — originally returned a `List<T>`. This works fine for a small planning session with 10 stories, but breaks down at scale:

- A session with 500 stories returns 500 JSON objects in one response
- Memory spikes on the server as the entire list is loaded into RAM
- The client receives more data than it can display
- Sorting and filtering are done in Java, not in the database

**Pagination** solves this by requesting a *page* of results at a time.

---

## Spring Data Pageable

Spring Data JPA has built-in pagination support through two types:

| Type | Role |
|---|---|
| `Pageable` | Input: which page, how many results, sort order |
| `Page<T>` | Output: the results + total count + page metadata |

### Repository — adding paged query methods

For any repository method that returns `List<T>`, you can add an overload that accepts `Pageable` and returns `Page<T>`:

```java
// StoryRepository.java
@Repository
public interface StoryRepository extends JpaRepository<Story, Long> {

    // Original list methods — kept for backward compatibility
    List<Story> findBySessionOrderByOrderIndex(Session session);
    List<Story> findBySessionAndStatusOrderByOrderIndex(Session session, StoryStatus status);

    // New paged overloads — same query, returns a Page instead of a List
    Page<Story> findBySessionOrderByOrderIndex(Session session, Pageable pageable);
    Page<Story> findBySessionAndStatusOrderByOrderIndex(Session session, StoryStatus status, Pageable pageable);
}
```

Spring Data generates the SQL automatically — you just add the `Pageable` parameter and change the return type. No implementation needed.

The generated SQL looks like:
```sql
SELECT * FROM stories
WHERE session_id = ?
ORDER BY order_index
LIMIT ? OFFSET ?    -- the database does the slicing, not Java
```

### Service — exposing a paged method

Keep the original `getStories()` for non-paged callers, add `getStoriesPage()` for callers that want pagination:

```java
// IStoryService.java
public interface IStoryService {
    List<Story> getStories(String sessionCode, StoryStatus status);
    Page<Story> getStoriesPage(String sessionCode, StoryStatus status, Pageable pageable);
    // ...
}

// StoryServiceImpl.java
public Page<Story> getStoriesPage(String sessionCode, StoryStatus status, Pageable pageable) {
    Session session = sessionService.getSession(sessionCode);
    if (status != null) {
        return storyRepository.findBySessionAndStatusOrderByOrderIndex(session, status, pageable);
    }
    return storyRepository.findBySessionOrderByOrderIndex(session, pageable);
}
```

### Controller — optional pagination

The controller accepts optional `page` and `size` query parameters. If both are provided, return a `Page`; otherwise fall back to the full `List`:

```java
// StoryController.java
@GetMapping
public ResponseEntity<?> getStories(
        @PathVariable String sessionCode,
        @RequestParam(required = false) StoryStatus status,
        @RequestParam(required = false) Integer page,
        @RequestParam(required = false) Integer size) {

    if (page != null && size != null) {
        // Paged response
        Page<Story> stories = storyService.getStoriesPage(
            sessionCode, status, PageRequest.of(page, size));
        return ResponseEntity.ok(stories);
    }

    // Full list response (original behaviour)
    List<Story> stories = storyService.getStories(sessionCode, status);
    return ResponseEntity.ok(stories);
}
```

`PageRequest.of(page, size)` creates a `Pageable` for page `N` with `size` results per page. Pages are **zero-indexed**: page 0 = first page.

---

## The `Page<T>` response format

When the endpoint returns `Page<Story>`, Spring serialises it to JSON with this structure:

```json
{
  "content": [
    { "id": 1, "title": "Login feature", ... },
    { "id": 2, "title": "Dashboard", ... }
  ],
  "page": {
    "size": 10,
    "number": 0,
    "totalElements": 47,
    "totalPages": 5
  }
}
```

- `content` — the actual data for this page
- `totalElements` — total rows in the database (from a `COUNT(*)` query)
- `totalPages` — how many pages at the requested size
- `number` — current page number (0-based)

The frontend can use `totalPages` to render "Page 1 of 5" navigation.

---

## How to call the paginated endpoint

```
# First page, 10 items
GET /api/sessions/ABC123/stories?page=0&size=10

# Second page, 10 items
GET /api/sessions/ABC123/stories?page=1&size=10

# First page, only IN_PROGRESS stories, 5 items
GET /api/sessions/ABC123/stories?status=IN_PROGRESS&page=0&size=5

# No pagination params — returns full list (original behaviour)
GET /api/sessions/ABC123/stories
```

---

## Why `ResponseEntity<?>` for the mixed response

When a controller can return either `List<Story>` or `Page<Story>`, the generic type must accommodate both. Using `ResponseEntity<?>` (wildcard) lets the method return either type:

```java
public ResponseEntity<?> getStories(...) {
    if (page != null && size != null) {
        return ResponseEntity.ok(pagedResult);   // Page<Story>
    }
    return ResponseEntity.ok(listResult);         // List<Story>
}
```

The `?` wildcard loses compile-time type safety for the return, but in this pattern it is acceptable because both branches are clearly typed internally.

---

## Testing paged queries

In Mockito tests, use `PageImpl` to create a concrete `Page<T>` for stubs:

```java
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

@Test
void getStoriesPage_noStatus_returnsPagedStories() {
    Pageable pageable = PageRequest.of(0, 10);
    Page<Story> fakePage = new PageImpl<>(List.of(story1), pageable, 1);

    when(storyRepository.findBySessionOrderByOrderIndex(session, pageable))
            .thenReturn(fakePage);

    Page<Story> result = storyService.getStoriesPage("SES001", null, pageable);

    assertThat(result.getTotalElements()).isEqualTo(1);
    assertThat(result.getContent()).contains(story1);
}
```

`PageImpl` takes three arguments: the content list, the Pageable, and the total element count (for `COUNT(*)`).
