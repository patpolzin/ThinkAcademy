# Make.com Webhook Setup for UTHINK Reminders

## Overview
The UTHINK platform can trigger webhooks to Make.com when users set reminders for live sessions. This allows you to create automated email/SMS notifications using Make.com scenarios.

## Setup Instructions

### 1. Create a Make.com Scenario
1. Go to [Make.com](https://make.com) and create a new scenario
2. Add a "Webhooks" module as the trigger
3. Choose "Custom Webhook" and copy the webhook URL

### 2. Add Environment Variable
Add the webhook URL to your Replit environment variables:
```
MAKE_WEBHOOK_URL=https://hook.eu1.make.com/your-webhook-id
```

### 3. Webhook Data Structure
When a reminder is created, the webhook receives this JSON payload:
```json
{
  "type": "reminder_created",
  "userId": "user-wallet-address",
  "userEmail": "user@example.com",
  "userPhone": "+1234567890",
  "preferredContactMethod": "email", // "email", "phone", or "none"
  "sessionTitle": "Live Session Title",
  "sessionTime": "2024-01-15T10:00:00Z",
  "reminderTime": "2024-01-15T09:30:00Z",
  "minutesBefore": 30,
  "message": "Reminder: \"Live Session Title\" starts in 30 minutes at 1/15/2024, 10:00:00 AM"
}
```

### 4. Make.com Scenario Example
1. **Webhook Trigger**: Receives the reminder data
2. **Filter**: Check if `preferredContactMethod` is "email" or "phone"
3. **Email Module** (if email preferred):
   - To: `userEmail`
   - Subject: `Live Session Reminder: {{sessionTitle}}`
   - Body: `{{message}}`
4. **SMS Module** (if phone preferred):
   - To: `userPhone`
   - Message: `{{message}}`

### 5. Testing
1. Set the MAKE_WEBHOOK_URL environment variable
2. Create a reminder in UTHINK
3. Check Make.com scenario logs to verify webhook reception
4. Test email/SMS delivery

## Advanced Features
- Add calendar event creation
- Send follow-up reminders at different intervals
- Track reminder effectiveness
- Integration with other notification services

## Environment Variables
Required for webhook functionality:
- `MAKE_WEBHOOK_URL`: Your Make.com webhook URL

## Support
The webhook system is designed to be fault-tolerant - if Make.com is unavailable, reminder creation will still succeed, but notifications won't be sent.