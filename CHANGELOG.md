# Mental Health Journal - Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Changed
- Refactored chat models into separate files (February 9, 2026)
- Changed ChatSession partition key from userId to ChatSessionId for better scalability
- Updated all chat-related tests to use new model structure

## [2.0.0] - February 9, 2026

### Changed - Chat Model Refactoring
- Created `MentalHealthJournal.Models/ChatSessionModels/` folder for better organization
- Split combined ChatMessage.cs into four separate files:
  - `ChatSession.cs` - Main session entity with new partition key strategy
  - `ChatMessage.cs` - Individual message entity
  - `ChatRequest.cs` - API request model
  - `ChatResponse.cs` - API response model
- **BREAKING**: Changed ChatSession partition key from `userId` to `ChatSessionId`
- **BREAKING**: Changed ChatSession.Id to ChatSession.id (lowercase) for Cosmos DB compatibility
- Updated ChatService to verify UserId for security with new partition key
- All 58 tests passing after refactoring

### Migration Notes
- Existing ChatSession data will need migration to add ChatSessionId field
- Old sessions may be inaccessible without migration script
- See CHAT_DOCUMENTATION.md for migration guidance

## [1.2.0] - January 16, 2026

### Fixed - User ID Consistency Bug
**Severity**: High  
**Impact**: Resolved issue where older journal entries would disappear after a few days

#### Root Cause
- JWT token was using `user.id` instead of `user.userId` (partition key)
- Username availability check was comparing wrong ID field
- Inconsistency caused journal entries to become inaccessible

#### Files Changed
- `/MentalHealthJournal.Server/Controllers/AuthController.cs` (Line 244)
  - Changed JWT NameIdentifier claim from `user.id` to `user.userId`
  - Added admin role support via email-based authorization
- `/MentalHealthJournal.Services/UserService.cs` (Line 97)
  - Fixed username check to compare `userId` instead of `id`
  - Added consistency validation in CreateOrUpdateUserAsync

#### Additional Changes
- Created AdminController with duplicate user cleanup endpoint
- Removed standalone cleanup scripts in favor of API endpoint
- Enabled Swagger in production for easier admin operations

## [1.1.0] - January 12, 2026

### Added - Comprehensive Test Coverage
- Added 29 chat feature unit tests (total: 58 tests)
- ChatServiceTests: 19 tests covering all service methods
- ChatControllerTests: 10 tests covering all API endpoints
- Test helpers for chat-related models
- Input validation in ChatService

### Changed
- Improved error handling consistency across chat endpoints
- Fixed type ambiguity between OpenAI and application ChatMessage models
- Updated authentication pattern to match project conventions

## [1.0.0] - January 11, 2026

### Added - Virtual Therapist Chat Feature
- Real-time AI-powered chat using Azure OpenAI (GPT-4)
- Conversation history stored in Cosmos DB
- Multi-session support for users
- Context-aware responses (maintains last 10 messages)
- Crisis detection awareness in system prompt
- Modern, responsive chat UI with animations

#### Backend
- `ChatService` with Azure OpenAI integration
- `ChatController` with full CRUD operations
- Chat models: ChatSession, ChatMessage, ChatRequest, ChatResponse
- JWT authentication for all endpoints
- User isolation via partition keys

#### Frontend
- VirtualTherapist React component
- Chat service API client
- Session management sidebar
- Real-time messaging with loading states
- Mobile-responsive design

#### Infrastructure
- New Cosmos DB container: ChatSessions
- Partition key: /userId (later changed to /ChatSessionId)
- 400 RU/s baseline throughput

### API Endpoints
- `POST /api/chat/message` - Send message and get AI response
- `GET /api/chat/sessions` - Get user's chat sessions
- `GET /api/chat/session/{id}` - Get specific session
- `DELETE /api/chat/session/{id}` - Delete session

## Earlier Versions

### Features Present Before January 2026
- Journal entry CRUD operations
- Azure Cosmos DB integration
- Google OAuth authentication
- Blob storage for attachments
- Speech-to-text transcription
- AI-powered journal analysis
- Sentiment analysis
- Streak tracking
- Data visualization
- Crisis support resources
- Performance optimizations (streak caching)

---

## Migration Guides

### Migrating ChatSessions to New Partition Key (v2.0.0)

If you have existing ChatSession data:

```csharp
// Pseudocode - create actual migration script as needed
var sessions = await GetAllChatSessionsAsync();
foreach (var session in sessions)
{
    // Add new partition key field
    session.ChatSessionId = session.id;
    
    // Upsert with new partition key
    await _container.UpsertItemAsync(
        session,
        new PartitionKey(session.ChatSessionId)
    );
}
```

### Fixing User ID Consistency (v1.2.0)

No migration needed - fix prevents future duplicates.  
If you have duplicate users:
1. Use AdminController cleanup endpoint
2. Or manually merge using Azure Portal

## Version History

- **v2.0.0** (Feb 9, 2026) - Chat model refactoring with new partition strategy
- **v1.2.0** (Jan 16, 2026) - User ID consistency bug fix
- **v1.1.0** (Jan 12, 2026) - Comprehensive test coverage
- **v1.0.0** (Jan 11, 2026) - Virtual Therapist chat feature
- **v0.x.x** - Initial development (journal, auth, analysis)
