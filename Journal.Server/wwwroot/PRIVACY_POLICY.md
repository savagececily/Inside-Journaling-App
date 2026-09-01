# Privacy Policy

**Last Updated:** February 11, 2026  
**Version:** 1.0

---

## Introduction

Mental Health Journal ("we," "us," "our") respects your privacy and is committed to protecting your personal information. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our mental health journaling service (the "Service").

**By using the Service, you consent to the data practices described in this policy.**

## 1. Information We Collect

### 1.1 Account Information
When you create an account, we collect:
- **Name** (from OAuth provider)
- **Email address** (from OAuth provider)
- **Profile picture** (optional, from OAuth provider)
- **Authentication provider** (e.g., Google)
- **Date of birth** (for age verification - you must be 13+)
- **Account creation and last login timestamps**

### 1.2 Journal Content
- **Journal entries** (text you write)
- **Audio recordings** (if you use voice journaling)
- **Transcribed text** (from audio recordings)
- **Custom usernames** (if you set one)
- **Timestamps** for all entries

### 1.3 AI-Generated Data
When you use AI features, we generate and store:
- **Sentiment analysis** (positive, negative, neutral, mixed)
- **Sentiment scores** (confidence levels)
- **Key phrases** (topics identified in your entries)
- **AI-generated summaries** (contextual summaries of entries)
- **Affirmations** (personalized encouraging messages)

### 1.4 Usage and Technical Data
- **IP addresses** (for security auditing)
- **User agents** (browser/device information)
- **Session data** (login times, session duration)
- **Feature usage** (which features you use)
- **Application telemetry** (performance, errors via Application Insights)

### 1.5 Audit Logs
We maintain comprehensive audit logs that record:
- **Data access events** (when you read, create, update, or delete content)
- **Resource types accessed** (journal entries, audio files, user profile)
- **Timestamps and IP addresses**
- **Success/failure status** of operations
- **User actions** (login, consent grants, data exports, account deletion)

## 2. How We Collect Information

### 2.1 Direct Collection
- Information you provide during registration
- Journal entries you create
- Audio recordings you upload
- Preferences and settings you configure

### 2.2 Automatic Collection
- Session data and cookies for authentication
- Technical data from your device and browser
- Application telemetry and error logs

### 2.3 Third-Party Services
- **Google OAuth** provides your name, email, and profile picture
- **Azure services** process your data for storage and AI features

## 3. How We Use Your Information

### 3.1 Core Service Delivery
- **Account management** (authentication, profile management)
- **Journal storage** (saving and retrieving your entries)
- **Audio processing** (transcription via Azure Speech Services)
- **AI analysis** (sentiment, key phrases, summaries, affirmations)
- **Data visualization** (trends, insights, progress tracking)

### 3.2 Security and Compliance
- **Audit logging** (tracking data access for compliance)
- **Security monitoring** (detecting unauthorized access)
- **Age verification** (ensuring users meet minimum age requirements)
- **Fraud prevention** (detecting and preventing abuse)

### 3.3 Service Improvement
- **Performance optimization** (monitoring app performance)
- **Feature development** (understanding how features are used)
- **Bug fixes** (identifying and resolving issues)
- **Analytics** (aggregate, anonymized usage patterns)

### 3.4 Communications
- **Important updates** (Terms changes, security alerts)
- **Feature announcements** (new capabilities)
- **Consent verification** (ensuring ongoing consent for data processing)

## 4. Data Sharing and Disclosure

### 4.1 Third-Party Service Providers

We share your data with the following services **only** for providing and improving the Service:

#### Microsoft Azure Services
- **Azure Cosmos DB** - Stores journal entries, user profiles, and metadata
- **Azure Blob Storage** - Stores audio recordings
- **Azure OpenAI (GPT-4)** - Generates personalized affirmations
- **Azure Cognitive Services** - Provides sentiment analysis and key phrase extraction
- **Azure Speech Services** - Transcribes audio recordings
- **Azure App Configuration** - Manages application settings
- **Application Insights** - Monitors app performance and errors

**Important:** Your data is protected by Microsoft Azure's enterprise privacy policies and **is NOT used to train public AI models**.

#### Authentication Providers
- **Google OAuth** - Handles account authentication (Google's privacy policy applies)

### 4.2 What We Do NOT Do
We do **NOT**:
- ❌ Sell your personal information to third parties
- ❌ Share your journal entries with advertisers
- ❌ Use your data to train public AI models
- ❌ Share your data with social media platforms (beyond authentication)
- ❌ Allow third-party analytics to track your journal content
- ❌ Browse or read your journal entries unless required for support or legal compliance

### 4.3 Legal Requirements
We may disclose your information if required to:
- Comply with legal obligations (court orders, subpoenas)
- Protect rights, property, or safety
- Enforce our Terms of Service
- Detect, prevent, or address fraud or security issues

### 4.4 Business Transfers
If we are acquired, merged, or undergo restructuring, your data may be transferred to the new entity. We will notify you of such changes.

## 5. Data Security

### 5.1 Security Measures
We implement industry-standard security practices:
- ✅ **Encryption at rest** (Cosmos DB and Blob Storage use AES-256 encryption)
- ✅ **Encryption in transit** (all data transmitted via HTTPS/TLS)
- ✅ **Azure Managed Identity** (no stored credentials)
- ✅ **Authentication** (JWT tokens with 30-minute expiration)
- ✅ **Audit logging** (comprehensive tracking of data access)
- ✅ **Access controls** (role-based permissions, you can only access your own data)
- ✅ **Security monitoring** (Application Insights alerts)

### 5.2 Data Retention
- **Active accounts**: Data is retained as long as your account is active
- **Deleted accounts**: Data is permanently deleted within **30 days** of account deletion request
- **Audit logs**: Retained for **7 years** for legal compliance (cannot be deleted by users)
- **Consent records**: Retained permanently for legal compliance

### 5.3 Your Responsibility
You are responsible for:
- Keeping your account credentials secure
- Logging out of shared devices
- Notifying us of suspected unauthorized access
- Using strong passwords or secure OAuth

## 6. Your Privacy Rights

### 6.1 Right to Access
You can:
- View all your journal entries and data
- Download your data in a portable format
- **View your audit logs** (see who accessed your data and when)

**API:** `GET /api/UserData/audit-logs`

### 6.2 Right to Deletion
You can:
- Delete individual journal entries
- Delete specific audio recordings
- **Delete your entire account and all data** (irreversible)

**API:** `DELETE /api/UserData/delete-all`

**What gets deleted:**
- ✅ All journal entries
- ✅ All audio recordings
- ✅ User profile
- ✅ AI-generated insights
- ⚠️ Audit logs (retained for 7 years for compliance)
- ⚠️ Consent records (retained for legal compliance)

### 6.3 Right to Consent Management
You can:
- **Grant consent** for specific data processing activities
- **View consent history** (all consents you've given)
- **Revoke consent** (though this may limit Service functionality)

**Consent Types:**
1. **Terms of Service** - Agreement to our terms (required)
2. **Privacy Policy** - Acknowledgment of data practices (required)
3. **AI Processing** - Permission for AI analysis of entries (required for AI features)

**API:** `POST /api/Consent/record`, `GET /api/Consent/status`, `POST /api/Consent/revoke`

### 6.4 Right to Data Portability
You can export your data in machine-readable formats (JSON, CSV) for transfer to other services.

### 6.5 California Privacy Rights (CCPA/CPRA)
If you are a California resident, you have additional rights:
- Right to know what personal information is collected
- Right to know if personal information is sold (we do NOT sell data)
- Right to opt-out of data sales (not applicable)
- Right to deletion (as described above)
- Right to non-discrimination for exercising privacy rights

### 6.6 How to Exercise Your Rights
To exercise any of these rights:
- Use the in-app features (Account Settings, Data Management)
- Use the provided API endpoints
- Contact us at [privacy@inside-journal.app]

## 7. Children's Privacy (COPPA Compliance)

### 7.1 Age Requirements
- Minimum age: **13 years old**
- Users under 18 should have parental consent
- We verify age during registration

### 7.2 Parental Rights
If you are a parent or guardian and believe your child under 13 has created an account:
- Contact us immediately at [privacy@inside-journal.app]
- We will delete the account and all data promptly

### 7.3 Data Collection from Minors
We do not knowingly collect additional information from minors beyond what is necessary for the Service.

## 8. Consent and Data Processing

### 8.1 Explicit Consent
By using the Service, you explicitly consent to:
- Collection and storage of your journal entries and audio
- Processing by AI services for sentiment analysis and insights
- Sharing with third-party service providers (Azure)
- Audit logging of data access
- Session timeout after 30 minutes of inactivity

### 8.2 Consent Versions
We track consent versions. If our policies change materially, we will:
- Notify you via email and in-app
- Request updated consent
- Allow you to review changes before accepting

### 8.3 Withdrawal of Consent
You may revoke consent for AI processing, though this will limit functionality. Account deletion withdraws all consent.

## 9. Cookies and Tracking

### 9.1 Authentication Cookies
We use session cookies for:
- Maintaining your login state
- JWT token storage (client-side)
- Session timeout enforcement (30 minutes)

### 9.2 Analytics
We use Azure Application Insights for:
- Aggregate usage statistics
- Performance monitoring
- Error tracking

### 9.3 No Advertising Trackers
We do **NOT** use:
- Third-party advertising cookies
- Social media tracking pixels
- Cross-site tracking

## 10. Data Breaches and Notifications

### 10.1 Breach Response
In the event of a data breach affecting your personal information:
- We will investigate and contain the breach
- Notify affected users within **60 days**
- Report to relevant authorities as required by law
- Provide information on steps to protect yourself

### 10.2 Audit Trail
Our comprehensive audit logging helps us:
- Detect unauthorized access quickly
- Determine scope of any breach
- Provide detailed incident reports

## 11. International Data Transfers

### 11.1 Data Location
Your data is primarily stored in Microsoft Azure data centers located in **[Your Region, e.g., United States]**.

### 11.2 Cross-Border Transfers
If you access the Service from outside the United States, your data may be transferred to, stored in, and processed in the US. By using the Service, you consent to this transfer.

## 12. Updates to This Privacy Policy

### 12.1 Policy Changes
We may update this Privacy Policy to reflect:
- Changes in our practices
- Legal or regulatory requirements
- New features or services

### 12.2 Notification of Changes
We will notify you of material changes via:
- Email to your registered email address
- In-app notification upon login
- Updated "Last Updated" date at the top

### 12.3 Continued Use
Your continued use of the Service after changes constitutes acceptance of the updated Privacy Policy.

## 13. Contact Us

For privacy-related questions, requests, or concerns:

**Email:** [privacy@inside-journal.app]
**Data Protection Contact:** [dpo@inside-journal.app]
**Support:** [support@inside-journal.app]
**Mailing Address:** [Your Business Address]

### Response Time
We will respond to privacy requests within **30 days**.

## 14. Special Provisions

### 14.1 Mental Health Data Sensitivity
We recognize that mental health information is highly sensitive. We:
- Treat all journal entries as confidential
- Do not share entries with third parties except as described
- Implement heightened security measures
- Provide comprehensive audit logging for transparency

### 14.2 Crisis Information
If you enter information indicating imminent danger to yourself or others:
- We may be required to report to authorities (mandated reporting)
- We display crisis resources (988 Suicide & Crisis Lifeline)
- This is NOT an emergency service - call 911 in emergencies

### 14.3 No Therapeutic Privilege
We do not claim therapist-patient privilege. Information you enter is not protected by doctor-patient confidentiality.

## 15. Transparency Report

We believe in transparency. Our audit logging system allows you to:
- See every time your data is accessed
- View what actions were performed
- Check IP addresses and timestamps
- Verify no unauthorized access

**Transparency API:** `GET /api/UserData/audit-logs`

## 16. Privacy Policy Summary

**Quick Overview:**

| What We Collect | Why We Collect It | Who Sees It |
|----------------|-------------------|-------------|
| Journal entries | To provide journaling service | Only you (and Azure for storage) |
| Audio recordings | For voice journaling feature | Only you (and Azure Speech Services) |
| Email, name | For account management | OAuth provider, Azure |
| AI insights | To provide analysis features | Only you (generated by Azure AI) |
| Audit logs | For security and compliance | You can view your own logs |
| Age information | To verify 13+ requirement | Stored securely, not shared |

**Your Controls:**
- ✅ Delete your account anytime
- ✅ View all your data
- ✅ Export your data
- ✅ View audit logs (transparency)
- ✅ Revoke consent
- ✅ 30-minute session timeout (security)

**What We Don't Do:**
- ❌ Sell your data
- ❌ Share entries with advertisers
- ❌ Train AI models on your data
- ❌ Read your journals unless legally required

---

## Acknowledgment

By clicking "I Agree" or using the Service, you acknowledge that you have read, understood, and agree to this Privacy Policy.

---

**Version History:**
- v1.0 (February 11, 2026): Initial Privacy Policy with compliance features

**Effective Date:** February 11, 2026

© 2026 Mental Health Journal. All rights reserved.
