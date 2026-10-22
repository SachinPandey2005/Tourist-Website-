# Razorpay Payment Integration Guide (Phase 10)

This document details the architecture, setup, security controls, API contracts, and troubleshooting procedures for the end-to-end Razorpay payment integration in VoyageVista.

---

## 1. Architectural Overview & Workflow

VoyageVista integrates Razorpay via a secure, server-authoritative checkout pipeline:

```
[ Traveler Browser / React Client ]
       │
       │ 1. Initiate Checkout (Booking ID)
       ▼
[ VoyageVista API (Express.js) ]
       │ 2. Validate booking ownership & PENDING status
       │ 3. Compute trusted amount in subunits (e.g. $1320.00 -> 132000 paise/cents)
       ▼
[ Razorpay API ]
       │ 4. Create Order (orders.create) -> returns order_id
       ▼
[ VoyageVista Database (PostgreSQL + Prisma) ]
       │ 5. Stage Payment record with status: PENDING, paymentReference: order_id
       ▼
[ React Client (PaymentModal) ]
       │ 6. Launch Razorpay Checkout Modal (checkout.js)
       │ 7. Traveler enters payment credentials (UPI / Card / NetBanking)
       ▼
[ Razorpay Gateway ]
       │ 8. Settle transaction -> returns { order_id, payment_id, signature }
       ▼
[ VoyageVista API (POST /api/payments/verify) ]
       │ 9. Server-side HMAC SHA256 verification (timing-safe comparison)
       │ 10. Atomic DB Transaction: Payment -> SUCCEEDED, Booking -> CONFIRMED
       │ 11. Dispatch Booking Confirmation & Boarding Voucher Notification
       ▼
[ React Client ]
       │ 12. Display verified confirmation & updated reservation state
```

### Key Architectural Tenets
1. **Never Trust the Client**: Frontend amounts are completely ignored. The backend retrieves the booking from the database, computes subtotal + tax - discounts, and enforces subunit conversion.
2. **Cryptographic Verification**: A booking is never marked as `CONFIRMED` until either the client callback HMAC signature or the webhook signature is verified using `crypto.timingSafeEqual` with `RAZORPAY_KEY_SECRET` or `RAZORPAY_WEBHOOK_SECRET`.
3. **Idempotency & Replay Protection**: Repeated verification calls or duplicate webhook events return immediate 200 responses without re-running transactions or dispatching duplicate vouchers.
4. **State Machine Integrity**: If a booking is cancelled before payment verification, verification is rejected with 400 Bad Request to prevent resurrecting cancelled bookings.

---

## 2. Environment Configuration

### Backend (`apps/api/.env`)
Add the following variables to your `.env` file (see `apps/api/.env.example`):

```bash
# Razorpay API Credentials
RAZORPAY_KEY_ID="rzp_test_your_test_key_id"
RAZORPAY_KEY_SECRET="your_test_key_secret"

# Razorpay Webhook Secret (Configured in Razorpay Dashboard)
RAZORPAY_WEBHOOK_SECRET="whsec_voyagevista_webhook_secret_key"
```

For development and automated test suites, safe fallback values (`rzp_test_voyagevista_dev_key`, `rzp_test_voyagevista_secret_key`, and `whsec_voyagevista_webhook_secret_key`) are automatically provided in `apps/api/src/config/env.ts`.

---

## 3. Backend Endpoints & API Contracts

### 3.1. Create Razorpay Order
- **Method**: `POST`
- **Route**: `/api/payments/create-order`
- **Authentication**: Required (`authenticate`)
- **Request Body**:
  ```json
  {
    "bookingId": "40000000-0000-4000-a000-000000000004",
    "currency": "USD"
  }
  ```
- **Response (`201 Created`)**:
  ```json
  {
    "success": true,
    "data": {
      "orderId": "order_OG9234j2ks",
      "paymentId": "50000000-0000-4000-a000-000000000005",
      "amount": 132000,
      "currency": "USD",
      "keyId": "rzp_test_your_test_key_id",
      "bookingId": "40000000-0000-4000-a000-000000000004",
      "bookingReference": "VV-2026-999",
      "customer": {
        "name": "Alice Traveler",
        "email": "alice@example.com",
        "contact": "+15550001"
      }
    }
  }
  ```

### 3.2. Cryptographic Signature Verification
- **Method**: `POST`
- **Route**: `/api/payments/verify`
- **Authentication**: Required (`authenticate`)
- **Request Body**:
  ```json
  {
    "razorpay_order_id": "order_OG9234j2ks",
    "razorpay_payment_id": "pay_OG9281ks91",
    "razorpay_signature": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
    "paymentId": "50000000-0000-4000-a000-000000000005",
    "bookingId": "40000000-0000-4000-a000-000000000004"
  }
  ```
- **Verification Logic**:
  ```typescript
  const expectedSignature = crypto
    .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const isValid =
    expectedSignature.length === razorpay_signature.length &&
    crypto.timingSafeEqual(Buffer.from(expectedSignature), Buffer.from(razorpay_signature));
  ```
- **Success Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "success": true,
      "paymentId": "50000000-0000-4000-a000-000000000005",
      "paymentReference": "order_OG9234j2ks",
      "razorpayOrderId": "order_OG9234j2ks",
      "razorpayPaymentId": "pay_OG9281ks91",
      "status": "SUCCEEDED",
      "bookingStatus": "CONFIRMED",
      "message": "Payment verified and booking confirmed successfully."
    }
  }
  ```

### 3.3. Webhook Reconciliation
- **Method**: `POST`
- **Route**: `/api/payments/webhook`
- **Authentication**: Validated via `x-razorpay-signature` HTTP header
- **Supported Events**:
  - `order.paid` / `payment.captured`: Confirms payment and reservation atomically.
  - `payment.failed`: Records failure reason and notifies traveler.
- **Verification Logic**:
  ```typescript
  const expected = crypto
    .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  const isValid =
    expected.length === signature.length &&
    crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  ```

### 3.4. Payment Status Reconciliation
- **Method**: `GET`
- **Route**: `/api/payments/:paymentId/status`
- **Authentication**: Required (`authenticate`). Allowed for payment owner or platform `ADMIN`.
- **Response (`200 OK`)**:
  ```json
  {
    "success": true,
    "data": {
      "paymentId": "50000000-0000-4000-a000-000000000005",
      "paymentReference": "order_OG9234j2ks",
      "gatewayTransactionId": "pay_OG9281ks91",
      "status": "SUCCEEDED",
      "amount": "1320.00",
      "currency": "USD",
      "bookingId": "40000000-0000-4000-a000-000000000004",
      "bookingStatus": "CONFIRMED",
      "bookingReference": "VV-2026-999",
      "isPaid": true,
      "isCancellable": false,
      "createdAt": "2026-10-22T10:00:00.000Z",
      "paidAt": "2026-10-22T10:05:00.000Z"
    }
  }
  ```

---

## 4. Frontend Integration (`PaymentModal.tsx`)

The frontend integrates Razorpay using an asynchronous script loader that dynamically fetches `https://checkout.razorpay.com/v1/checkout.js`:

```typescript
const isLoaded = await loadRazorpayScript();
if (isLoaded && (window as any).Razorpay) {
  const options = {
    key: orderData.keyId,
    amount: orderData.amount,
    currency: orderData.currency,
    name: 'VoyageVista Travel',
    description: `Expedition Reservation #${booking.bookingReference}`,
    order_id: orderData.orderId,
    prefill: {
      name: orderData.customer.name,
      email: orderData.customer.email,
      contact: orderData.customer.contact,
    },
    theme: { color: '#0d9488' },
    handler: async (response) => {
      // Send cryptographic payload to backend
      const result = await paymentsApi.verifyRazorpayPayment(response);
      onPaymentSuccess(result);
    },
    modal: {
      ondismiss: () => {
        setInfoMessage('Checkout closed. You can retry whenever you are ready.');
      },
    },
  };
  const rzp = new (window as any).Razorpay(options);
  rzp.open();
}
```

---

## 5. Testing & Verification

### Running Automated Backend Tests
```bash
npm --prefix apps/api test tests/razorpay-payment.test.ts
```

All 18 Razorpay integration test cases pass:
- Order creation with subunit currency conversion
- Booking ownership validation
- Pending status enforcement
- Cryptographic HMAC SHA256 signature verification
- Rejection of tampered signatures
- Idempotent repeated verification
- Cancellation guards
- Webhook signature validation using unparsed raw request bytes
- Duplicate webhook replay protection
- Real-time status reconciliation and authorization checks

### Manual Sandbox Verification
1. Log in as an authenticated traveler or register a new account.
2. Select any expedition or package and proceed through the booking flow.
3. On the booking confirmation screen, click **Pay Now** to open the Payment Modal.
4. Select the **Razorpay** tab (recommended default).
5. Click **Pay with Razorpay**. In test mode, Razorpay displays the test payment options (UPI, NetBanking, Cards).
6. Complete the checkout with standard Razorpay test credentials.
7. Observe immediate transition to the verified confirmation receipt with transaction ID and booking status `CONFIRMED`.
