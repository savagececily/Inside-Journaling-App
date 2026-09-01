# Payment Strategy

**Last Updated:** April 30, 2026  
**Status:** Planning Phase

## Overview

This document outlines the payment and subscription strategy for the Inside Journaling App freemium model, including provider selection, implementation approach, and platform-specific considerations.

---

## Pricing Model

### Premium Tier: $4.99/month

**Includes:**
- Unlimited AI-analyzed journal entries
- Unlimited voice transcriptions
- Advanced analytics and insights
- Priority support
- Ad-free experience

**Free Tier (No Payment Required):**
- 50 AI entries/month
- 10 voice transcriptions/month
- Basic features and analytics

---

## Payment Provider Comparison

### Recommended: Stripe

** Pros:**
- Industry-standard, trusted by millions
- Excellent developer experience with comprehensive APIs
- Built-in subscription management
- Automatic invoice generation
- SCA (Strong Customer Authentication) compliance
- Multi-currency support (58+ countries)
- Low transaction fees: 2.9% + $0.30 per transaction
- Extensive fraud protection (Radar)
- Webhooks for real-time payment events
- No monthly fees (pay-as-you-go)
- PCI DSS Level 1 compliant (handles card data security)
- React/TypeScript SDK available

** Cons:**
- Requires business verification for payouts
- 7-day rolling payout schedule initially

**Implementation Effort:** Medium (3-5 days for web, 2-3 days for mobile)

---

### Alternative: PayPal

** Pros:**
- Widely recognized and trusted
- No setup fees
- Quick integration
- Users can pay without credit cards (PayPal balance)

** Cons:**
- Higher fees: 3.49% + $0.49 per transaction
- Less developer-friendly API
- Limited subscription customization
- Webhooks less reliable than Stripe

**Implementation Effort:** Medium (3-4 days)

---

### Alternative: Square

** Pros:**
- Simple pricing: 2.9% + $0.30
- Great for small businesses
- In-person payment options (if needed later)

** Cons:**
- Less international support
- Fewer subscription features than Stripe
- Limited webhooks

**Implementation Effort:** Medium (3-4 days)

---

## Recommended Approach: **Stripe**

**Reasoning:**
1. Best developer experience and documentation
2. Comprehensive subscription management
3. Industry standard for SaaS applications
4. Excellent security and fraud protection
5. Future-proof (easy to add features like annual plans, trials, etc.)

---

## Technical Implementation

### Architecture Overview

```
┌─────────────┐         ┌──────────────┐         ┌─────────────┐
│   Client    │         │   Backend    │         │   Stripe    │
│  (Web/App)  │         │  .NET API    │         │     API     │
└──────┬──────┘         └──────┬───────┘         └──────┬──────┘
       │                       │                        │
       │ 1. Request Checkout   │                        │
       ├──────────────────────>│                        │
       │                       │ 2. Create Session      │
       │                       ├───────────────────────>│
       │                       │ 3. Session URL         │
       │                       │<───────────────────────┤
       │ 4. Redirect to Stripe │                        │
       │<──────────────────────┤                        │
       │                       │                        │
       │ 5. Complete Payment   │                        │
       ├───────────────────────┼───────────────────────>│
       │                       │                        │
       │                       │ 6. Webhook: Success    │
       │                       │<───────────────────────┤
       │                       │ 7. Activate Premium    │
       │                       │   (Update UserQuota)   │
       │ 8. Redirect Success   │                        │
       │<──────────────────────┤                        │
```

---

## Web Implementation (Stripe Checkout)

### Phase 1: Basic Implementation (Week 1)

#### Backend Setup

**1. Install Stripe SDK**
```bash
cd Journal.Server
dotnet add package Stripe.net
```

**2. Add Configuration (appsettings.json)**
```json
{
  "Stripe": {
    "SecretKey": "sk_test_...",
    "PublishableKey": "pk_test_...",
    "WebhookSecret": "whsec_...",
    "PriceId": "price_...",
    "SuccessUrl": "https://inside-journal.app/premium/success",
    "CancelUrl": "https://inside-journal.app/premium/cancel"
  }
}
```

**3. Create Stripe Service**

Create `Journal.Services/IStripeService.cs`:
```csharp
public interface IStripeService
{
    Task<string> CreateCheckoutSessionAsync(string userId, string email, CancellationToken cancellationToken);
    Task<string> CreateCustomerPortalSessionAsync(string userId, CancellationToken cancellationToken);
    Task HandleWebhookEventAsync(string payload, string signature, CancellationToken cancellationToken);
}
```

Create `Journal.Services/StripeService.cs`:
```csharp
using Stripe;
using Stripe.Checkout;
using Microsoft.Extensions.Options;
using Microsoft.Extensions.Logging;

public class StripeService : IStripeService
{
    private readonly ILogger<StripeService> _logger;
    private readonly IQuotaService _quotaService;
    private readonly ICosmosDbService _cosmosDb;
    private readonly StripeSettings _settings;

    public StripeService(
        ILogger<StripeService> logger,
        IQuotaService quotaService,
        ICosmosDbService cosmosDb,
        IOptions<StripeSettings> settings)
    {
        _logger = logger;
        _quotaService = quotaService;
        _cosmosDb = cosmosDb;
        _settings = settings.Value;
        
        StripeConfiguration.ApiKey = _settings.SecretKey;
    }

    public async Task<string> CreateCheckoutSessionAsync(string userId, string email, CancellationToken cancellationToken)
    {
        var options = new SessionCreateOptions
        {
            Mode = "subscription",
            PaymentMethodTypes = new List<string> { "card" },
            LineItems = new List<SessionLineItemOptions>
            {
                new SessionLineItemOptions
                {
                    Price = _settings.PriceId,
                    Quantity = 1,
                }
            },
            SuccessUrl = $"{_settings.SuccessUrl}?session_id={{CHECKOUT_SESSION_ID}}",
            CancelUrl = _settings.CancelUrl,
            CustomerEmail = email,
            ClientReferenceId = userId, // Store userId for webhook processing
            Metadata = new Dictionary<string, string>
            {
                { "user_id", userId }
            }
        };

        var service = new SessionService();
        var session = await service.CreateAsync(options, cancellationToken: cancellationToken);

        _logger.LogInformation("Created Stripe checkout session {SessionId} for user {UserId}", session.Id, userId);

        return session.Url;
    }

    public async Task<string> CreateCustomerPortalSessionAsync(string userId, CancellationToken cancellationToken)
    {
        // Get user's Stripe customer ID from database
        var user = await _cosmosDb.GetUserByIdAsync(userId, cancellationToken);
        
        if (string.IsNullOrEmpty(user.StripeCustomerId))
        {
            throw new InvalidOperationException("User does not have a Stripe customer ID");
        }

        var options = new Stripe.BillingPortal.SessionCreateOptions
        {
            Customer = user.StripeCustomerId,
            ReturnUrl = "https://inside-journal.app/settings/billing",
        };

        var service = new Stripe.BillingPortal.SessionService();
        var session = await service.CreateAsync(options, cancellationToken: cancellationToken);

        return session.Url;
    }

    public async Task HandleWebhookEventAsync(string payload, string signature, CancellationToken cancellationToken)
    {
        try
        {
            var stripeEvent = EventUtility.ConstructEvent(
                payload,
                signature,
                _settings.WebhookSecret
            );

            _logger.LogInformation("Processing Stripe webhook event: {EventType}", stripeEvent.Type);

            switch (stripeEvent.Type)
            {
                case Events.CheckoutSessionCompleted:
                    await HandleCheckoutSessionCompletedAsync(stripeEvent, cancellationToken);
                    break;

                case Events.CustomerSubscriptionCreated:
                case Events.CustomerSubscriptionUpdated:
                    await HandleSubscriptionUpdatedAsync(stripeEvent, cancellationToken);
                    break;

                case Events.CustomerSubscriptionDeleted:
                    await HandleSubscriptionDeletedAsync(stripeEvent, cancellationToken);
                    break;

                case Events.InvoicePaymentSucceeded:
                    await HandleInvoicePaymentSucceededAsync(stripeEvent, cancellationToken);
                    break;

                case Events.InvoicePaymentFailed:
                    await HandleInvoicePaymentFailedAsync(stripeEvent, cancellationToken);
                    break;

                default:
                    _logger.LogInformation("Unhandled webhook event type: {EventType}", stripeEvent.Type);
                    break;
            }
        }
        catch (StripeException ex)
        {
            _logger.LogError(ex, "Stripe webhook processing failed");
            throw;
        }
    }

    private async Task HandleCheckoutSessionCompletedAsync(Event stripeEvent, CancellationToken cancellationToken)
    {
        var session = stripeEvent.Data.Object as Session;
        if (session == null) return;

        var userId = session.Metadata["user_id"];
        var customerId = session.Customer.Id;
        var subscriptionId = session.Subscription.Id;

        _logger.LogInformation("Checkout completed for user {UserId}, subscription {SubscriptionId}", userId, subscriptionId);

        // Update user record with Stripe IDs
        var user = await _cosmosDb.GetUserByIdAsync(userId, cancellationToken);
        user.StripeCustomerId = customerId;
        user.StripeSubscriptionId = subscriptionId;
        await _cosmosDb.UpdateUserAsync(user, cancellationToken);

        // Activate premium
        await _quotaService.UpgradeToPremiumAsync(userId, subscriptionId, cancellationToken);
    }

    private async Task HandleSubscriptionUpdatedAsync(Event stripeEvent, CancellationToken cancellationToken)
    {
        var subscription = stripeEvent.Data.Object as Subscription;
        if (subscription == null) return;

        // Find user by subscription ID
        var users = await _cosmosDb.GetUsersByStripeSubscriptionIdAsync(subscription.Id, cancellationToken);
        var user = users.FirstOrDefault();

        if (user == null)
        {
            _logger.LogWarning("No user found for subscription {SubscriptionId}", subscription.Id);
            return;
        }

        // Update premium status based on subscription state
        if (subscription.Status == "active")
        {
            var expiresAt = DateTimeOffset.FromUnixTimeSeconds(subscription.CurrentPeriodEnd).UtcDateTime;
            await _quotaService.UpgradeToPremiumAsync(user.UserId, subscription.Id, cancellationToken, expiresAt);
            _logger.LogInformation("Premium renewed for user {UserId} until {ExpiresAt}", user.UserId, expiresAt);
        }
    }

    private async Task HandleSubscriptionDeletedAsync(Event stripeEvent, CancellationToken cancellationToken)
    {
        var subscription = stripeEvent.Data.Object as Subscription;
        if (subscription == null) return;

        var users = await _cosmosDb.GetUsersByStripeSubscriptionIdAsync(subscription.Id, cancellationToken);
        var user = users.FirstOrDefault();

        if (user == null) return;

        await _quotaService.DowngradeToFreeAsync(user.UserId, cancellationToken);
        _logger.LogInformation("Premium cancelled for user {UserId}", user.UserId);
    }

    private async Task HandleInvoicePaymentSucceededAsync(Event stripeEvent, CancellationToken cancellationToken)
    {
        var invoice = stripeEvent.Data.Object as Invoice;
        if (invoice == null) return;

        _logger.LogInformation("Payment succeeded for invoice {InvoiceId}, amount: ${Amount}", 
            invoice.Id, invoice.AmountPaid / 100.0);
        
        // Optional: Send receipt email, update analytics, etc.
    }

    private async Task HandleInvoicePaymentFailedAsync(Event stripeEvent, CancellationToken cancellationToken)
    {
        var invoice = stripeEvent.Data.Object as Invoice;
        if (invoice == null) return;

        _logger.LogWarning("Payment failed for invoice {InvoiceId}", invoice.Id);
        
        // Optional: Send payment failure notification to user
    }
}

public class StripeSettings
{
    public string SecretKey { get; set; } = string.Empty;
    public string PublishableKey { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
    public string PriceId { get; set; } = string.Empty;
    public string SuccessUrl { get; set; } = string.Empty;
    public string CancelUrl { get; set; } = string.Empty;
}
```

**4. Update UserController**

Replace the placeholder upgrade method:
```csharp
[HttpPost("upgrade")]
public async Task<ActionResult> UpgradeToPremium(CancellationToken cancellationToken = default)
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    var email = User.FindFirst(ClaimTypes.Email)?.Value;
    
    if (string.IsNullOrEmpty(userId) || string.IsNullOrEmpty(email))
    {
        return Unauthorized();
    }

    try
    {
        var checkoutUrl = await _stripeService.CreateCheckoutSessionAsync(userId, email, cancellationToken);
        return Ok(new { checkoutUrl });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error creating checkout session for user {UserId}", userId);
        return StatusCode(500, "Unable to create checkout session");
    }
}

[HttpPost("portal")]
public async Task<ActionResult> GetCustomerPortal(CancellationToken cancellationToken = default)
{
    var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    if (string.IsNullOrEmpty(userId))
    {
        return Unauthorized();
    }

    try
    {
        var portalUrl = await _stripeService.CreateCustomerPortalSessionAsync(userId, cancellationToken);
        return Ok(new { portalUrl });
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error creating portal session for user {UserId}", userId);
        return StatusCode(500, "Unable to access billing portal");
    }
}
```

**5. Add Webhook Endpoint**

Create `Journal.Server/Controllers/WebhooksController.cs`:
```csharp
[ApiController]
[Route("api/[controller]")]
public class WebhooksController : ControllerBase
{
    private readonly ILogger<WebhooksController> _logger;
    private readonly IStripeService _stripeService;

    public WebhooksController(ILogger<WebhooksController> logger, IStripeService stripeService)
    {
        _logger = logger;
        _stripeService = stripeService;
    }

    [HttpPost("stripe")]
    [AllowAnonymous]
    public async Task<IActionResult> HandleStripeWebhook(CancellationToken cancellationToken = default)
    {
        var payload = await new StreamReader(HttpContext.Request.Body).ReadToEndAsync();
        var signature = Request.Headers["Stripe-Signature"];

        try
        {
            await _stripeService.HandleWebhookEventAsync(payload, signature, cancellationToken);
            return Ok();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Webhook processing failed");
            return BadRequest();
        }
    }
}
```

**6. Register Services (Program.cs)**
```csharp
// Add Stripe configuration
builder.Services.Configure<StripeSettings>(builder.Configuration.GetSection("Stripe"));

// Register Stripe service
builder.Services.AddSingleton<IStripeService, StripeService>();
```

---

#### Frontend Setup (React)

**1. Install Stripe SDK**
```bash
cd journal.client
npm install @stripe/stripe-js
```

**2. Create Upgrade Component**

`src/components/UpgradeModal.tsx`:
```typescript
import { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

export function UpgradeModal({ isOpen, onClose, token }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleUpgrade = async () => {
    setLoading(true);
    setError('');

    try {
      // Request checkout session from backend
      const response = await fetch('/api/user/upgrade', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { checkoutUrl } = await response.json();

      // Redirect to Stripe Checkout
      window.location.href = checkoutUrl;
    } catch (err) {
      setError('Unable to start checkout. Please try again.');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Upgrade to Premium</h2>
        
        <div className="pricing-card">
          <h3>$4.99/month</h3>
          <ul>
 <li> Unlimited AI-analyzed entries</li>
 <li> Unlimited voice transcriptions</li>
 <li> Advanced analytics</li>
 <li> Priority support</li>
          </ul>
        </div>

        {error && <div className="error-message">{error}</div>}

        <div className="modal-actions">
          <button onClick={onClose} disabled={loading}>Cancel</button>
          <button 
            onClick={handleUpgrade} 
            disabled={loading}
            className="btn-primary"
          >
            {loading ? 'Processing...' : 'Continue to Payment'}
          </button>
        </div>

        <p className="secure-payment-notice">
 Secure payment powered by Stripe
        </p>
      </div>
    </div>
  );
}
```

**3. Create Success Page**

`src/pages/PremiumSuccess.tsx`:
```typescript
import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export function PremiumSuccess() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    // Optional: Verify session with backend
    // Redirect to dashboard after 3 seconds
    const timer = setTimeout(() => {
      navigate('/dashboard');
    }, 3000);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="success-page">
 <div className="success-icon"></div>
      <h1>Welcome to Premium!</h1>
      <p>Your subscription is now active.</p>
      <p>You now have unlimited access to all features.</p>
      <button onClick={() => navigate('/dashboard')}>
        Go to Dashboard
      </button>
    </div>
  );
}
```

**4. Add Environment Variable**

`.env`:
```
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
```

---

### Phase 2: Customer Portal (Week 2)

**Allow users to manage subscriptions:**
- View billing history
- Update payment method
- Cancel subscription
- Download invoices

**Implementation:**
```typescript
// Add button to settings page
const handleManageBilling = async () => {
  const response = await fetch('/api/user/portal', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  const { portalUrl } = await response.json();
  window.location.href = portalUrl;
};

<button onClick={handleManageBilling}>
  Manage Billing
</button>
```

---

## Mobile Implementation (Web Browser Flow)

### Recommended: External Browser + Stripe

**Strategy:** Open web browser from mobile app for payment, then return to app.

** Benefits:**
- Same 3.4% Stripe fees as web ($4.82 net per subscription)
- No 30% Apple tax
- Unified payment system (one codebase)
- Better margins = more money for development

** App Store Compliance Note:**
Apple's App Store Review Guideline 3.1.1 requires digital subscriptions use Apple IAP. However, many apps successfully use this pattern by:
- Framing premium as "web features" rather than "app subscription"
- Ensuring core app functionality works without payment
- Not mentioning payment options in the app UI (users discover via web)
- Alternative: Only show upgrade option in Android app, direct iOS users to website

**For Android:** Google Play allows external payments with just a 4% service fee (vs 15-30% for IAP).

### Revenue Impact Comparison

| Platform | Your Revenue | Fee | Net Revenue |
|----------|--------------|-----|-------------|
| **Web (Stripe)** | $4.99 | $0.17 (3.4%) | **$4.82** |
| **Mobile Web Browser (Stripe)** | $4.99 | $0.17 (3.4%) | **$4.82** |
| iOS (Apple IAP) | $4.99 | $1.50 (30%) | $3.49 |
| Android (Google IAP) | $4.99 | $0.75 (15%) | $4.24 |

**Savings:** $1.33 per iOS subscription ($15.96/year per user!)

### Implementation: External Browser Flow

**User Experience:**
1. User taps "Upgrade to Premium" in mobile app
2. App opens device browser with Stripe Checkout
3. User completes payment in browser
4. Success page shows: " Payment Complete! You may close this page and return to the app."
5. User returns to app
6. App checks premium status shows premium features unlocked

**No app store required, no 30% fee! **

---

#### Step 1: Mobile App Code (React Native)

**UpgradeButton Component:**

```typescript
// src/components/UpgradeButton.tsx
import { Linking, Platform, Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

export function UpgradeButton({ userId, token }: Props) {
  const [checking, setChecking] = useState(false);

  const handleUpgrade = async () => {
    try {
      // 1. Get checkout URL from backend
      const response = await fetch(`${API_BASE_URL}/api/user/upgrade`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to create checkout session');
      }

      const { checkoutUrl } = await response.json();

      // 2. Open external browser with Stripe Checkout
      // Use WebBrowser for better UX (in-app browser with return capability)
      const result = await WebBrowser.openBrowserAsync(checkoutUrl, {
        // iOS: Safari View Controller
        // Android: Chrome Custom Tabs
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.FORM_SHEET,
        controlsColor: '#6366F1', // Your brand color
      });

      // 3. When user returns, check premium status
      if (result.type === 'dismiss' || result.type === 'cancel') {
        // User returned to app - check if they completed payment
        await checkPremiumStatus();
      }
    } catch (error) {
      Alert.alert(
        'Error',
        'Unable to open checkout. Please try again later.'
      );
    }
  };

  const checkPremiumStatus = async () => {
    setChecking(true);
    try {
      // Poll for premium activation (Stripe webhook may take a few seconds)
      for (let i = 0; i < 5; i++) {
        const response = await fetch(`${API_BASE_URL}/api/user/quota`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.tier === 'premium') {
          Alert.alert(
 ' Welcome to Premium!',
            'Your subscription is now active. Enjoy unlimited features!',
            [{ text: 'Get Started', onPress: () => navigation.navigate('Dashboard') }]
          );
          return;
        }
        
        // Wait 2 seconds before checking again
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
      
      // If still not premium after 10 seconds, show message
      Alert.alert(
        'Processing Payment',
        'Your payment is being processed. Premium features will activate shortly.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error checking premium status:', error);
    } finally {
      setChecking(false);
    }
  };

  return (
    <TouchableOpacity 
      style={styles.upgradeButton}
      onPress={handleUpgrade}
      disabled={checking}
    >
      <Text style={styles.buttonText}>
 {checking ? 'Checking Status...' : ' Upgrade to Premium'}
      </Text>
    </TouchableOpacity>
  );
}
```

**Install Required Package:**
```bash
cd Journal.Mobile
npx expo install expo-web-browser
```

---

#### Step 2: Success Page Enhancement (Web)

**Update the success page to detect mobile browsers:**

```typescript
// journal.client/src/pages/PremiumSuccess.tsx
import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

export function PremiumSuccess() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get('session_id');
  const [isMobile] = useState(() => {
    // Detect if opened from mobile app
    return /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
  });

  useEffect(() => {
    // Auto-redirect desktop users after 3 seconds
    if (!isMobile) {
      const timer = setTimeout(() => {
        window.location.href = '/dashboard';
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isMobile]);

  return (
    <div className="success-page">
 <div className="success-icon"></div>
      <h1>Payment Complete!</h1>
      
      {isMobile ? (
        <>
          <p className="mobile-message">
            Your subscription is now active.
          </p>
          <div className="return-notice">
 <p> You may now close this page and return to the app.</p>
            <p className="small-text">
              Your premium features will be available immediately.
            </p>
          </div>
          <button 
            onClick={() => window.close()} 
            className="close-button"
          >
            Close This Page
          </button>
        </>
      ) : (
        <>
          <p>Your subscription is now active.</p>
          <p>Redirecting to dashboard...</p>
          <a href="/dashboard" className="manual-link">
            Click here if not redirected automatically
          </a>
        </>
      )}
      
      {sessionId && (
        <p className="session-id">Session ID: {sessionId}</p>
      )}
    </div>
  );
}
```

**Styling for mobile message:**

```css
/* src/pages/PremiumSuccess.css */
.success-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  padding: 2rem;
  text-align: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.success-icon {
  font-size: 5rem;
  margin-bottom: 1rem;
  animation: bounce 1s ease-in-out;
}

.mobile-message {
  font-size: 1.2rem;
  margin: 1rem 0;
}

.return-notice {
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  padding: 1.5rem;
  margin: 2rem 0;
  backdrop-filter: blur(10px);
}

.return-notice p {
  margin: 0.5rem 0;
  font-size: 1.1rem;
  font-weight: 600;
}

.small-text {
  font-size: 0.9rem !important;
  font-weight: 400 !important;
  opacity: 0.9;
}

.close-button {
  background: white;
  color: #667eea;
  border: none;
  padding: 1rem 2rem;
  border-radius: 8px;
  font-size: 1.1rem;
  font-weight: 600;
  cursor: pointer;
  margin-top: 1rem;
  transition: transform 0.2s;
}

.close-button:hover {
  transform: scale(1.05);
}

.close-button:active {
  transform: scale(0.95);
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-20px); }
}
```

---

#### Step 3: App Lifecycle Handling

**Detect when user returns to app and refresh quota:**

```typescript
// App.tsx or main navigation file
import { AppState } from 'react-native';
import { useEffect, useRef } from 'react';

export function App() {
  const appState = useRef(AppState.currentState);
  const [userTier, setUserTier] = useState<'free' | 'premium'>('free');

  useEffect(() => {
    const subscription = AppState.addEventListener('change', async (nextAppState) => {
      // When app comes to foreground
      if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
        console.log('App returned to foreground - checking premium status');
        await refreshUserQuota();
      }
      appState.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const refreshUserQuota = async () => {
    try {
      const token = await getAuthToken(); // Your auth method
      const response = await fetch(`${API_BASE_URL}/api/user/quota`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      const data = await response.json();
      setUserTier(data.tier);
      
      // If newly premium, show celebration
      if (data.tier === 'premium' && userTier === 'free') {
        showPremiumActivatedToast();
      }
    } catch (error) {
      console.error('Error refreshing quota:', error);
    }
  };

  return (
    // Your app navigation
  );
}
```

---

#### Step 4: Android-Specific Configuration

**For Android, you can be explicit about external payments:**

```typescript
// Only show upgrade button on Android (avoid Apple rejection)
const canShowUpgrade = Platform.OS === 'android' || __DEV__;

{canShowUpgrade && (
  <UpgradeButton userId={userId} token={token} />
)}

// For iOS users, show a hint to visit website
{Platform.OS === 'ios' && !isPremium && (
  <Text style={styles.hint}>
    Want unlimited features? Visit inside-journal.app
  </Text>
)}
```

---

### Recommended Mobile Strategy

**Approach: External Browser + Stripe (Recommended)**

**Unified Payment System:**
1. **All platforms** Open browser with Stripe Checkout
2. **Single backend** StripeService handles everything
3. **Same margins** 3.4% fees everywhere
4. **Simple codebase** No platform-specific payment code

**Compliance Strategy:**
- **Android:** Show upgrade button freely (Google allows external payments with 4% fee)
- **iOS:** Either:
  - Option A: Don't show upgrade in app, users discover on web
  - Option B: Frame premium as "web features" accessible via account
  - Option C: Show upgrade in development builds only

**User Flow:**
```
Mobile User Taps Upgrade Browser Opens Stripe Checkout
Payment Complete "Close this page" Returns to App
App Refreshes Quota Premium Unlocked
```

**Revenue Per Platform:**
- Web: $4.82 net (96.6% margin)
- Android (browser): $4.82 net (96.6% margin) 
- iOS (browser): $4.82 net (96.6% margin)
- iOS (if forced IAP): $3.49 net (70% margin)

**Savings:** $1.33 per subscription vs Apple IAP

---

## Testing Strategy

### Stripe Test Mode

**1. Use Test API Keys:**
```
sk_test_... (Secret Key)
pk_test_... (Publishable Key)
```

**2. Test Card Numbers:**
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

**3. Test Webhooks Locally:**
```bash
# Install Stripe CLI
brew install stripe/stripe-cli/stripe

# Login
stripe login

# Forward webhooks to localhost
stripe listen --forward-to http://localhost:5173/api/webhooks/stripe

# Get webhook signing secret
stripe listen --print-secret
```

### Mobile Web Browser Flow Testing

**Test the complete mobile flow:**

1. **In Mobile Simulator/Device:**
```bash
# Run mobile app
cd Journal.Mobile
npm start
```

2. **Tap upgrade button** Should open device browser

3. **Complete test payment** using Stripe test card:
   - Card: 4242 4242 4242 4242
   - Expiry: Any future date (e.g., 12/34)
   - CVC: Any 3 digits (e.g., 123)
   - ZIP: Any 5 digits (e.g., 90210)

4. **Verify success page** shows:
 - Payment Complete!
   - "You may close this page and return to the app"
   - Close button

5. **Return to app** (close browser or tap close)

6. **Verify app detects premium:**
   - Check quota API response
   - Verify premium badge shows
   - Verify unlimited access unlocked

**Test Cases:**
- Successful payment Premium activated
- User cancels checkout Returns to free tier
- Payment fails Error message, remains free
- Network failure Graceful error handling
- App backgrounded during payment Status refresh on return

**iOS Testing (Pre-Production):**
- Test on physical device with TestFlight
- Ensure browser opens correctly (Safari View Controller)
- Verify return to app works smoothly

**Android Testing:**
- Test on physical device or emulator
- Verify Chrome Custom Tabs opens
- Test deep linking back to app

---

## Security & Compliance

### PCI Compliance

** Using Stripe = Automatic PCI compliance:**
- Card data never touches your servers
- Stripe handles all card processing
- You're automatically PCI DSS Level 1 compliant

### Webhook Security

**Always verify webhook signatures:**
```csharp
var stripeEvent = EventUtility.ConstructEvent(
    payload,
    signature,
    webhookSecret // Verifies this came from Stripe
);
```

### Mobile Browser Security

**For external browser flow:**
- Always verify premium status server-side (GET /api/user/quota)
- Use secure HTTPS for all checkout URLs
- Implement session timeout for checkout URLs (Stripe expires after 24h)
- Poll backend for status updates (don't trust client-only state)

### Data Privacy

**Store minimal payment data:**
- Stripe Customer ID (for portal access)
- Subscription ID (for status checks)
- Card numbers (never store these)
- CVV codes (never store these)

---

## Analytics & Monitoring

### Key Metrics

**Revenue Metrics:**
- MRR (Monthly Recurring Revenue)
- Churn rate
- LTV (Lifetime Value)
- ARPU (Average Revenue Per User)

**Conversion Metrics:**
- Free Premium conversion rate
- Checkout abandonment rate
- Payment failure rate

**Application Insights Queries:**

```kusto
// Monthly Recurring Revenue
customEvents
| where name == "SubscriptionCreated" or name == "SubscriptionRenewed"
| extend amount = todouble(customDimensions.amount)
| summarize MRR = sum(amount) by bin(timestamp, 30d)

// Conversion Rate
let totalUsers = toscalar(
    customEvents
    | where name == "UserCreated"
    | summarize count()
);
let premiumUsers = toscalar(
    customEvents
    | where name == "SubscriptionCreated"
    | summarize dcount(tostring(customDimensions.userId))
);
print ConversionRate = premiumUsers * 100.0 / totalUsers

// Payment Failures
customEvents
| where name == "PaymentFailed"
| summarize failures = count() by bin(timestamp, 1h)
| order by timestamp desc
```

---

## � App Store Compliance Strategies

### Understanding the Rules

**Apple App Store Guideline 3.1.1:**
> "If you want to unlock features or functionality within your app, (by way of example: subscriptions, in-game currencies, game levels, access to premium content, or unlocking a full version), you must use in-app purchase."

**Google Play Policy:**
> Allows external payments but requires 4% fee if you want to avoid 15-30% IAP fee.

### Recommended Approaches (Ranked by Risk)

#### Lowest Risk: Android-Only Upgrade in App

**Implementation:**
```typescript
// Only show upgrade button on Android
{Platform.OS === 'android' && (
  <UpgradeButton />
)}

// iOS users see informational message
{Platform.OS === 'ios' && (
  <View style={styles.infoCard}>
    <Text>Want unlimited features?</Text>
    <Text style={styles.small}>
      Visit inside-journal.app on your web browser
    </Text>
  </View>
)}
```

**Why This Works:**
- Android explicitly allows it (with 4% fee)
- iOS app never mentions payment
- Users naturally discover web version
- Compliant with both stores

**Expected Revenue:** 60% web, 40% Android mobile (all at 96%+ margins)

---

#### Medium Risk: "Web Features" Positioning

**Implementation:**
```typescript
// Frame as accessing web account features
<Text>Premium features available on your web account</Text>
<Button onPress={openWebBrowser}>
  Access Web Account
</Button>

// Success page says:
"Your web account is now premium!"
```

**Why This Might Work:**
- Not selling "app subscription"
- Just providing access to web account
- Similar to newspaper/magazine apps
- App provides authentication, web provides premium content

**Precedent:** Many productivity apps (Notion, Evernote, etc.) let you upgrade on web

---

#### Higher Risk: Upgrade Button for All Users

**Implementation:**
```typescript
// Show upgrade for everyone
<UpgradeButton onPress={openWebBrowser} />
```

**Why This Is Risky:**
- Clearly circumventing IAP
- Likely to get flagged in review
- Could result in app rejection

**Mitigation:**
- Make most features available without payment
- Position as "web sync" or "account features"
- Ensure app has value without premium

---

### Real-World Examples

**Apps Using External Payments Successfully:**

1. **Netflix** - Removed in-app signup, directs to website
2. **Spotify** - Can't upgrade in iOS app, must use web
3. **Amazon Kindle** - Can't buy books in app, must use web
4. **Hey Email** - No IAP, directs to web for signup

**Key Pattern:** These apps provide *access* to content/features purchased elsewhere, rather than selling subscriptions within the app.

---

### Recommendation for Inside Journaling App

**Phase 1: Conservative Approach (Launch)**
- Android app: Show upgrade button (use external browser)
- iOS app: No payment UI, mention website in settings
- Website: Primary upgrade path (market heavily)

**Phase 2: Test Expansion (3-6 months)**
- Submit iOS update with "web account features" approach
- Monitor App Review response
- Have rollback plan ready (remove if rejected)

**Phase 3: Compliance Option (If Required)**
- Implement Apple IAP for iOS only (30% fee)
- Keep Android external payment (4% fee)
- Maintain web Stripe (3.4% fee)
- Revenue: Mixed, but still profitable

---

## � Implementation Timeline

### Week 1: Stripe Web Integration
- [ ] Set up Stripe account
- [ ] Create product and price in Stripe Dashboard
- [ ] Implement StripeService backend
- [ ] Update UserController endpoints
- [ ] Create webhook endpoint
- [ ] Build upgrade modal in frontend
- [ ] Test with Stripe test mode

### Week 2: Customer Portal & Polish
- [ ] Implement customer portal access
- [ ] Add billing page to settings
- [ ] Create success/cancel pages
- [ ] Add upgrade CTAs throughout app
- [ ] Test complete user journey
- [ ] Deploy to production

### Week 3-4: Mobile Web Flow (Optional)
- [ ] Install expo-web-browser in mobile app
- [ ] Implement UpgradeButton with external browser
- [ ] Add mobile detection to success page
- [ ] Implement app lifecycle quota refresh
- [ ] Test complete flow on iOS and Android
- [ ] Add Android-specific upgrade UI
- [ ] Test TestFlight build (iOS compliance check)

---

## Future Enhancements

### Phase 3: Advanced Features

**Annual Plans (20% discount):**
- $49.99/year (vs $59.88/year monthly)
- Better retention and cash flow

**Free Trials:**
- 7-day free trial for new users
- Automatic conversion to paid after trial

**Promo Codes:**
- Stripe coupon support
- Limited-time discounts
- Referral bonuses

**Team/Family Plans:**
- $9.99/month for up to 5 users
- Shared billing, individual accounts

**Enterprise Tier:**
- Custom pricing
- SSO integration
- Advanced analytics
- Dedicated support

---

## Go-Live Checklist

### Stripe Setup
- [ ] Create production Stripe account
- [ ] Complete business verification
- [ ] Create product and monthly price
- [ ] Configure webhook endpoint URL
- [ ] Set up email receipts
- [ ] Enable Stripe Radar (fraud protection)
- [ ] Configure tax collection (if required)

### Backend Configuration
- [ ] Add Stripe production keys to Azure App Configuration
- [ ] Deploy StripeService and webhook handler
- [ ] Test webhook delivery
- [ ] Set up monitoring alerts for payment failures

### Frontend Updates
- [ ] Add Stripe publishable key to production environment
- [ ] Deploy upgrade modal and success pages
- [ ] Add upgrade CTAs to quota limit messages
- [ ] Test complete payment flow in production

### Legal & Compliance
- [ ] Update Terms of Service (subscription terms)
- [ ] Update Privacy Policy (payment data handling)
- [ ] Add refund policy
- [ ] Configure automatic email receipts

### Monitoring
- [ ] Set up revenue tracking in Application Insights
- [ ] Create payment failure alerts
- [ ] Monitor churn rate
- [ ] Track conversion funnel

---

## Resources

**Stripe Documentation:**
- [Stripe Subscriptions](https://stripe.com/docs/billing/subscriptions/overview)
- [Stripe Checkout](https://stripe.com/docs/payments/checkout)
- [Stripe Webhooks](https://stripe.com/docs/webhooks)
- [Stripe .NET SDK](https://github.com/stripe/stripe-dotnet)

**Mobile Browser Integration:**
- [expo-web-browser](https://docs.expo.dev/versions/latest/sdk/webbrowser/) - Open external browser from React Native
- [React Native Linking](https://reactnative.dev/docs/linking) - Handle deep links and app returns
- [React Native AppState](https://reactnative.dev/docs/appstate) - Detect when user returns to app

**Alternative (Native IAP - If Required):**
- [react-native-iap](https://github.com/dooboolab/react-native-iap) - If forced to use Apple/Google IAPs
- [Apple StoreKit](https://developer.apple.com/documentation/storekit)
- [Google Play Billing](https://developer.android.com/google/play/billing)

**RevenueCat (Unified IAP Management):**
- [RevenueCat Docs](https://www.revenuecat.com/docs) - Consider if implementing native IAPs

---

## Support

For payment integration questions:
- Stripe Support: support@stripe.com
- Stripe Discord: https://stripe.com/discord
- Stack Overflow: `stripe-payments` tag

---

**Status:** Ready to implement Stripe integration

**Recommended First Step:** Set up Stripe test account and implement web checkout (Week 1)
