# Virtual Therapist Chat Feature - Complete Documentation

**Last Updated**: February 9, 2026  
**Status**: Production Ready ✅  
**Test Coverage**: 29 tests, 100% passing

---

## Table of Contents
1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Setup Instructions](#setup-instructions)
4. [Model Structure](#model-structure)
5. [API Reference](#api-reference)
6. [Testing](#testing)
7. [Recent Changes](#recent-changes)
8. [Usage Guide](#usage-guide)
9. [Security & Privacy](#security--privacy)
10. [Cost Considerations](#cost-considerations)
11. [Troubleshooting](#troubleshooting)

---

## Overview

The Virtual Therapist is a compassionate AI-powered chat feature that provides emotional support and mental health guidance to users. It uses Azure OpenAI to deliver empathetic, supportive conversations while maintaining appropriate boundaries.

### Features

✅ **Real-time AI Chat** - Powered by Azure OpenAI with therapeutic system prompts  
✅ **Conversation History** - All chat sessions stored in Cosmos DB with user isolation  
✅ **Multi-Session Support** - Users can have multiple independent conversations  
✅ **Context-Aware Responses** - Maintains conversation context (last 10 messages)  
✅ **Crisis Detection Awareness** - Includes guidelines for crisis situations  
✅ **Beautiful UI** - Modern, responsive chat interface with smooth animations  
✅ **Scalable Architecture** - Session-based partition key for unlimited growth

---

## Architecture

### Backend Components

#### 1. Models (`MentalHealthJournal.Models/ChatSessionModels/`)

**ChatSession.cs** - Main session entity
```csharp
public class ChatSession
{
    [JsonPropertyName("id")]
    public string id { get; set; } = string.Empty;  // Cosmos DB document ID
    
    public string ChatSessionId { get; set; } = string.Empty;  // Partition key
    public string UserId { get; set; } = string.Empty;  // For filtering
    public string Title { get; set; } = "New Conversation";
    public List<ChatMessage> Messages { get; set; } = new();
    public DateTime CreatedAt { get; set; }
    public DateTime LastMessageAt { get; set; }
    public bool IsActive { get; set; } = true;
}
```

**ChatMessage.cs** - Individual message
```csharp
public class ChatMessage
{
    public string Role { get; set; } = string.Empty;  // "user" or "assistant"
    public string Content { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
```

**ChatRequest.cs** - API request format
```csharp
public class ChatRequest
{
    public string Message { get; set; } = string.Empty;
    public string? SessionId { get; set; }  // null = new session
}
```

**ChatResponse.cs** - API response format
```csharp
public class ChatResponse
{
    public string SessionId { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public DateTime Timestamp { get; set; }
}
```

#### 2. Service Layer

**IChatService** - Service interface
- `SendMessageAsync(userId, request)` - Send message and get AI response
- `GetSessionAsync(userId, sessionId)` - Retrieve specific session
- `GetUserSessionsAsync(userId)` - List all user sessions
- `DeleteSessionAsync(userId, sessionId)` - Soft delete session

**ChatService** - Implementation highlights
- Azure OpenAI integration with therapeutic system prompt
- Cosmos DB persistence with partition key optimization
- Context management (last 10 messages)
- Security verification (UserId check)
- Error handling and logging

#### 3. Controller (`MentalHealthJournal.Server/Controllers/ChatController.cs`)

**Endpoints:**
- `POST /api/chat/message` - Send message and get AI response
- `GET /api/chat/sessions` - Get user's chat sessions
- `GET /api/chat/session/{id}` - Get specific session
- `DELETE /api/chat/session/{id}` - Delete session

**Authentication:** All endpoints require JWT authentication

### Frontend Components

#### 1. React Component (`VirtualTherapist.tsx`)
- Chat interface with message history
- Session management sidebar
- Real-time message sending
- Loading states and error handling
- Typing indicators
- Mobile-responsive layout

#### 2. API Service (`chatService.ts`)
- TypeScript API client
- JWT token handling
- Error handling
- Type-safe interfaces

#### 3. Styling (`VirtualTherapist.css`)
- Modern gradient design
- Smooth animations
- Dark theme optimized
- Mobile-friendly

---

## Setup Instructions

### 1. Azure Cosmos DB Setup

Create a new container for chat sessions:

```bash
# Using Azure CLI
az cosmosdb sql container create \
  --account-name <your-cosmos-account> \
  --database-name MentalHealthJournalDb \
  --name ChatSessions \
  --partition-key-path /ChatSessionId \
  --throughput 400
```

**Important**: Partition key is `/ChatSessionId` (not `/userId`) as of v2.0.0

Or create manually in Azure Portal:
- Container name: `ChatSessions`
- Partition key: `/ChatSessionId`
- Throughput: 400 RU/s (can scale up as needed)

### 2. Azure App Configuration

Add the configuration value:

```bash
az appconfig kv set \
  --name <your-app-config-name> \
  --key CosmosDb:ChatSessionContainer \
  --value ChatSessions
```

### 3. Configuration Files

Update your `appsettings.json`:

```json
{
  "CosmosDb": {
    "Endpoint": "your-cosmos-db-endpoint",
    "Key": "your-cosmos-db-key",
    "DatabaseName": "MentalHealthJournalDb",
    "JournalEntryContainer": "JournalEntries",
    "UserContainer": "Users",
    "ChatSessionContainer": "ChatSessions"
  },
  "AzureOpenAI": {
    "Endpoint": "your-openai-endpoint",
    "DeploymentName": "gpt-4"
  }
}
```

### 4. Azure OpenAI Deployment

Required deployment:
- **Model**: GPT-4 or GPT-4o (recommended for therapeutic conversations)
- **Deployment name**: Must match `AzureOpenAI:DeploymentName` config
- **Managed Identity**: Enabled for secure authentication

### 5. Build and Run

```bash
# Backend
cd MentalHealthJournal.Server
dotnet build
dotnet run

# Frontend
cd mentalhealthjournal.client
npm install
npm run dev

# Run Tests
dotnet test
```

---

## Model Structure

### Partition Key Strategy (v2.0.0)

**Previous (v1.x)**: Partition key was `/userId`
- Limited to 20GB per user
- Hot partition for active users
- Simple queries within partition

**Current (v2.0.0)**: Partition key is `/ChatSessionId`
- No per-user storage limits
- Better write distribution
- Cross-partition query for user sessions
- Improved scalability

### Three ID Fields Explained

```csharp
id            // Cosmos DB document ID (lowercase, required by SDK)
ChatSessionId // Partition key (same value as id)
UserId        // For filtering sessions by user (cross-partition query)
```

**Why three IDs?**
1. `id` - Required by Cosmos DB SDK, document identifier
2. `ChatSessionId` - Partition key for scalability
3. `UserId` - Links session to user for queries and security

---

## API Reference

### Send Message

**Endpoint**: `POST /api/chat/message`  
**Auth**: Required (JWT)

**Request Body:**
```json
{
  "message": "I've been feeling anxious lately",
  "sessionId": null  // null for new session, string for existing
}
```

**Response (200 OK):**
```json
{
  "sessionId": "abc123",
  "message": "I hear that you're feeling anxious...",
  "timestamp": "2026-02-09T10:30:00Z"
}
```

**Curl Example:**
```bash
curl -X POST https://your-app.azurewebsites.net/api/chat/message \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I need someone to talk to",
    "sessionId": null
  }'
```

### Get User Sessions

**Endpoint**: `GET /api/chat/sessions`  
**Auth**: Required (JWT)

**Response (200 OK):**
```json
[
  {
    "id": "session-1",
    "chatSessionId": "session-1",
    "userId": "user-123",
    "title": "Conversation about anxiety",
    "messages": [...],
    "createdAt": "2026-02-09T10:00:00Z",
    "lastMessageAt": "2026-02-09T10:30:00Z",
    "isActive": true
  }
]
```

### Get Specific Session

**Endpoint**: `GET /api/chat/session/{sessionId}`  
**Auth**: Required (JWT)

**Response (200 OK):** Returns full ChatSession object  
**Response (404 Not Found):** Session doesn't exist or doesn't belong to user

### Delete Session

**Endpoint**: `DELETE /api/chat/session/{sessionId}`  
**Auth**: Required (JWT)

**Response (204 No Content):** Successfully deleted  
**Response (404 Not Found):** Session doesn't exist

**Note**: Soft delete - sets `IsActive = false`

---

## Testing

### Test Coverage: 29 Tests, 100% Passing

#### ChatServiceTests (19 tests)

**Constructor Validation:**
- ✅ Missing AzureOpenAI deployment name throws exception
- ✅ Missing Cosmos DB database name throws exception

**SendMessageAsync Tests:**
- ✅ Empty message throws ArgumentException
- ✅ Null user ID throws ArgumentException
- ✅ Empty user ID throws ArgumentException
- ✅ Invalid session ID throws InvalidOperationException
- ✅ New session creates ChatSession with matching id/ChatSessionId
- ✅ Existing session adds message to session

**GetSessionAsync Tests:**
- ✅ Valid session ID returns correct session
- ✅ Non-existent session returns null
- ✅ Session not belonging to user returns null (security check)
- ✅ Proper handling of Cosmos DB NotFound exception

**GetUserSessionsAsync Tests:**
- ✅ Valid user ID returns list of sessions
- ✅ User with no sessions returns empty list
- ✅ All returned sessions match the requested user ID
- ✅ Handles cross-partition query correctly

**DeleteSessionAsync Tests:**
- ✅ Valid session sets IsActive to false
- ✅ Non-existent session does not throw exception
- ✅ Proper upsert call with ChatSessionId partition key

#### ChatControllerTests (10 tests)

**Endpoint Tests:**
- ✅ SendMessage with valid request returns OK
- ✅ SendMessage with existing session ID works correctly
- ✅ GetSession returns OK with session data
- ✅ GetSessions returns OK with session list
- ✅ DeleteSession returns NoContent (204)

**Validation Tests:**
- ✅ Empty message returns BadRequest
- ✅ Whitespace-only message returns BadRequest

**Error Handling:**
- ✅ Non-existent session returns NotFound
- ✅ Service exceptions return 500 Internal Server Error

**Authentication:**
- ✅ All endpoints without auth return Unauthorized

### Running Tests

```bash
# All tests
dotnet test

# Chat tests only
dotnet test --filter "FullyQualifiedName~Chat"

# With detailed output
dotnet test --logger "console;verbosity=detailed"

# With coverage
dotnet test /p:CollectCoverage=true
```

### Test Helpers

Available in `TestHelper.cs`:
- `CreateChatMessage()` - Creates test messages
- `CreateChatSession()` - Creates sessions with proper id/ChatSessionId
- `CreateSampleChatSessionList()` - Multiple test sessions
- `CreateChatRequest()` - API request objects
- `CreateChatResponse()` - API response objects

---

## Recent Changes

### v2.0.0 - Model Refactoring (February 9, 2026)

**Breaking Changes:**
1. Partition key changed from `/userId` to `/ChatSessionId`
2. Property renamed: `ChatSession.Id` → `ChatSession.id` (lowercase)
3. Models split into separate files in `ChatSessionModels/` folder

**Benefits:**
- Better scalability (no 20GB per-user limit)
- Improved write performance
- Better code organization
- Clearer separation of concerns

**Migration Required:** Yes, for existing data  
**See**: CHANGELOG.md for migration script

### Files Refactored
- ✅ Created ChatSessionModels/ folder
- ✅ Separated ChatSession.cs
- ✅ Separated ChatMessage.cs
- ✅ Separated ChatRequest.cs
- ✅ Separated ChatResponse.cs
- ✅ Updated ChatService for new partition key
- ✅ Updated all 29 tests
- ✅ Deleted old combined ChatMessage.cs

---

## Usage Guide

### User Workflow

1. **Start Conversation**
   - Navigate to "💬 Virtual Support" tab
   - Type message or click starter prompt
   - System creates new session automatically

2. **Continue Conversation**
   - Messages maintain context
   - AI remembers last 10 messages
   - Session saved automatically

3. **Manage Sessions**
   - View past conversations in sidebar
   - Click to resume any session
   - Delete unwanted sessions

4. **Get Support**
   - Ask about feelings, thoughts, experiences
   - Receive empathetic, validating responses
   - Get coping strategy suggestions
   - Crisis resources provided when needed

### System Prompt Highlights

The AI is trained to:
- Provide compassionate, empathetic support
- Validate feelings without judgment
- Suggest healthy coping strategies
- Recognize crisis situations
- Maintain appropriate boundaries
- Encourage professional help when appropriate

**Example Interactions:**

User: "I've been feeling really anxious lately"  
AI: "I hear that you're experiencing anxiety. That must feel overwhelming at times. Anxiety is a common response to stress, and it's brave of you to acknowledge it..."

---

## Security & Privacy

### Security Features

✅ **User Isolation** - Sessions partitioned by ChatSessionId, UserId verified  
✅ **Authentication Required** - JWT for all endpoints  
✅ **Authorization Check** - GetSessionAsync verifies session belongs to user  
✅ **Encrypted Storage** - Data encrypted at rest in Cosmos DB  
✅ **HTTPS Only** - All communication encrypted in transit  
✅ **No Data Sharing** - Conversations are private to each user  
✅ **Soft Delete** - Deleted sessions marked inactive, not permanently removed

### Privacy Considerations

- Conversations stored in Azure Cosmos DB (your tenant)
- Azure OpenAI processes messages (Microsoft)
- No third-party data sharing
- Complies with HIPAA/GDPR requirements (with proper BAA)
- Users should be informed this is NOT therapy

**Disclaimer**: This feature provides supportive conversation but is NOT a replacement for professional mental health care.

---

## Cost Considerations

### Azure Cosmos DB

**Baseline (400 RU/s)**:
- ~$24/month
- Suitable for 100-500 users
- ~1000 messages/day

**Storage**:
- ~$0.25/GB/month
- Average: 1KB per message
- 10,000 messages ≈ 10MB

**Scaling**:
- Auto-scale to 4000 RU/s: ~$240/month
- Consider serverless for variable load

### Azure OpenAI

**GPT-4 Pricing** (as of Feb 2026):
- Input: ~$0.03 per 1K tokens
- Output: ~$0.06 per 1K tokens
- Average conversation: 500-1000 tokens
- **Cost per conversation**: ~$0.03-0.05

**GPT-3.5-Turbo Alternative**:
- 10x cheaper (~$0.005 per conversation)
- Acceptable quality for most use cases
- Consider for budget constraints

### Cost Optimization Tips

1. **Limit Context Window** - Already implemented (last 10 messages)
2. **Use GPT-3.5-Turbo** - Good quality, much lower cost
3. **Rate Limiting** - Prevent abuse with per-user limits
4. **Autoscaling** - Use Cosmos DB autoscale for variable load
5. **Monitoring** - Set up budget alerts in Azure
6. **Caching** - Consider caching common responses

### Monthly Cost Estimates

| Users | Messages/Day | Cosmos DB | OpenAI | Total |
|-------|--------------|-----------|--------|-------|
| 100   | 500          | $24       | $15    | $39   |
| 500   | 2,500        | $50       | $75    | $125  |
| 1,000 | 5,000        | $100      | $150   | $250  |

*Estimates based on GPT-4, actual costs may vary*

---

## Troubleshooting

### Common Issues

#### "Session not found" error
**Symptoms**: 404 when accessing session  
**Causes**:
- Session doesn't exist
- Session belongs to different user
- Wrong partition key configuration

**Solutions**:
1. Verify ChatSessions container exists
2. Check partition key is `/ChatSessionId`
3. Verify user is authenticated
4. Check Application Insights logs

#### AI responses are slow
**Symptoms**: Long wait times for responses  
**Causes**:
- Azure OpenAI quota limits
- GPT-4 slower than GPT-3.5
- High latency to Azure region

**Solutions**:
1. Check Azure OpenAI quotas
2. Consider GPT-3.5-Turbo instead
3. Monitor Application Insights latency
4. Use preferred region in config

#### Chat history not loading
**Symptoms**: Empty session list or errors  
**Causes**:
- JWT token invalid/expired
- Cosmos DB connection issues
- Cross-partition query failures

**Solutions**:
1. Verify JWT token is valid
2. Check Cosmos DB connection string
3. Review Application Insights logs
4. Test Cosmos DB connectivity

#### Tests failing after model changes
**Symptoms**: Build errors about Id vs id  
**Causes**:
- Property name mismatch
- Missing ChatSessionId initialization
- Wrong partition key in mocks

**Solutions**:
1. Use lowercase `id` not `Id`
2. Initialize both `id` and `ChatSessionId`
3. Update mock partition keys to use `sessionId`

### Monitoring

**Azure Portal Metrics**:
- Cosmos DB: Request units, latency, storage
- OpenAI: Token usage, request count, latency
- App Service: CPU, memory, response time

**Application Insights**:
- API performance
- Error rates
- User activity patterns
- Custom events

**Logging**:
- ChatService logs all operations
- Error messages in Application Insights
- Cosmos DB diagnostic logs

### Support Resources

1. **Application Insights** - Check logs and traces
2. **Cosmos DB Metrics** - Monitor performance
3. **Azure OpenAI Metrics** - Track usage and quotas
4. **GitHub Issues** - Report bugs
5. **Documentation** - README.md, TESTING_GUIDE.md

---

## Future Enhancements

Potential features to consider:

- 🔄 **Export chat history** - Download conversations as PDF/JSON
- 🎯 **Mood tracking integration** - Connect chats with journal entries
- 🔔 **Proactive check-ins** - Scheduled wellness prompts
- 🎨 **Customizable AI personality** - User preferences
- 📊 **Chat analytics** - Sentiment trends, topic analysis
- 🌐 **Multi-language support** - Translations
- 🎤 **Voice chat** - Speech-to-text integration
- 🤖 **RAG with resources** - Enhanced with therapeutic resources
- 🏥 **Crisis escalation** - Automatic detection and resource linking
- 👥 **Group support** - Moderated group chats

---

## Related Documentation

- [CHANGELOG.md](CHANGELOG.md) - Version history and breaking changes
- [TESTING_GUIDE.md](TESTING_GUIDE.md) - Comprehensive testing procedures
- [README.md](README.md) - Project overview
- [AZURE_DEPLOYMENT.md](AZURE_DEPLOYMENT.md) - Deployment instructions

---

**Version**: 2.0.0  
**Last Updated**: February 9, 2026  
**Status**: Production Ready ✅  
**Test Coverage**: 29/29 tests passing (100%)
