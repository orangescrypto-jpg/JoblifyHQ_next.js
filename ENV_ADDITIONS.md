# New Environment Variables Required

Add these to your .env.local and Vercel project settings:

```
# Paystack (for Nigeria + other African countries)
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_xxxxxxxxxxxx

# Flutterwave (already in codebase, used for non-Nigeria Africa)
NEXT_PUBLIC_FLUTTERWAVE_PUBLIC_KEY=FLWPUBK_TEST-xxxxxxxxxxxx

# Existing Firebase vars (keep as-is)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
```

## Payment Logic Summary
- Nigeria + bank transfer → user sends to bank, admin confirms in /admin
- Nigeria + Paystack → card/bank debit, auto-confirmed
- Other Africa + Flutterwave → card/mobile money, auto-confirmed
- Escrow always uses a gateway (Paystack/FLW) for security
