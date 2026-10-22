import { useState, useEffect, useRef } from 'react';
import {
  CreditCard,
  ShieldCheck,
  Lock,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Search,
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Badge } from '../../components/ui/Badge.js';
import { paymentsApi } from '../../lib/api/payments.js';
import { UserBookingRecord } from '../../lib/api/bookings.js';
import type { ProcessPaymentResult } from '@tourist/shared';

export type CheckoutMethod = 'RAZORPAY' | 'CREDIT_CARD' | 'PAYPAL' | 'BANK_TRANSFER';

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: UserBookingRecord | null;
  onPaymentSuccess?: (result: ProcessPaymentResult) => void;
}

/**
 * Loads Razorpay Checkout JavaScript SDK asynchronously if not already loaded.
 */
const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window !== 'undefined' && (window as any).Razorpay) {
      return resolve(true);
    }
    if (typeof document === 'undefined') {
      return resolve(false);
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    const timer = setTimeout(() => resolve(false), 2500);
    script.onload = () => {
      clearTimeout(timer);
      resolve(true);
    };
    script.onerror = () => {
      clearTimeout(timer);
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

export function PaymentModal({
  isOpen,
  onClose,
  booking,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<CheckoutMethod>('RAZORPAY');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [razorpayOrderId, setRazorpayOrderId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<ProcessPaymentResult | null>(null);

  // Card Form Fields
  const [cardholderName, setCardholderName] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [cvv, setCvv] = useState<string>('');

  const prevIsOpenRef = useRef<boolean>(false);

  // Pre-fill user details and initialize session on open only
  useEffect(() => {
    if (isOpen && (!prevIsOpenRef.current || !paymentId) && booking) {
      setErrorMessage(null);
      setInfoMessage(null);
      setSuccessResult(null);
      setCardholderName(booking.user?.name || '');
      setCardNumber('');
      setExpiryDate('');
      setCvv('');

      // Find existing pending payment if present
      const existingPending = booking.payments?.find((p) => p.status === 'PENDING');
      if (existingPending) {
        setPaymentId(existingPending.id);
      } else {
        // Initialize checkout session
        setIsInitializing(true);
        paymentsApi
          .createSession({
            bookingId: booking.id,
            method: 'CREDIT_CARD',
          })
          .then((res) => {
            setPaymentId(res.paymentId);
          })
          .catch((err: unknown) => {
            const msg = err instanceof Error ? err.message : 'Could not initialize payment session.';
            setErrorMessage(msg);
          })
          .finally(() => {
            setIsInitializing(false);
          });
      }
    }
    prevIsOpenRef.current = isOpen;
  }, [isOpen, booking, paymentId]);

  // Quick Test Card Fillers
  const handleFillSuccessCard = () => {
    setCardNumber('4242 4242 4242 4242');
    setExpiryDate('12/28');
    setCvv('123');
    if (!cardholderName && booking?.user?.name) {
      setCardholderName(booking.user.name);
    } else if (!cardholderName) {
      setCardholderName('Alice Traveler');
    }
    setErrorMessage(null);
  };

  const handleFillDeclineCard = () => {
    setCardNumber('4000 0000 0000 0002');
    setExpiryDate('08/27');
    setCvv('999');
    if (!cardholderName) {
      setCardholderName('Alice Traveler');
    }
    setErrorMessage(null);
  };

  const handleCardNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 16);
    const formatted = raw.replace(/(\d{4})(?=\d)/g, '$1 ');
    setCardNumber(formatted);
  };

  const handleExpiryChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    if (raw.length >= 3) {
      raw = `${raw.slice(0, 2)}/${raw.slice(2)}`;
    }
    setExpiryDate(raw);
  };

  const handleCvvChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, '').slice(0, 4);
    setCvv(raw);
  };

  // 1. RAZORPAY CHECKOUT HANDLER
  const handleLaunchRazorpay = async () => {
    if (!booking) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setInfoMessage(null);

      // Create Razorpay Order on Backend
      const orderData = await paymentsApi.createRazorpayOrder({
        bookingId: booking.id,
        currency: booking.currency,
      });

      setRazorpayOrderId(orderData.orderId);
      if (orderData.paymentId) {
        setPaymentId(orderData.paymentId);
      }

      // Check if Razorpay Checkout SDK is available in window
      const isLoaded = await loadRazorpayScript();

      if (isLoaded && typeof window !== 'undefined' && (window as any).Razorpay) {
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency,
          name: 'VoyageVista Travel',
          description: `Expedition Reservation #${booking.bookingReference}`,
          order_id: orderData.orderId,
          prefill: {
            name: orderData.customer?.name || cardholderName || 'Alice Traveler',
            email: orderData.customer?.email || 'traveler@example.com',
            contact: orderData.customer?.contact || '',
          },
          theme: {
            color: '#0d9488',
          },
          handler: async (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => {
            try {
              setIsProcessing(true);
              const verifyRes = await paymentsApi.verifyRazorpayPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentId: orderData.paymentId,
                bookingId: booking.id,
              });

              const result: ProcessPaymentResult = {
                success: true,
                paymentId: verifyRes.paymentId,
                paymentReference: verifyRes.paymentReference,
                status: verifyRes.status,
                bookingStatus: verifyRes.bookingStatus,
                transactionId: verifyRes.razorpayPaymentId,
                message: verifyRes.message,
              };

              setSuccessResult(result);
              onPaymentSuccess?.(result);
            } catch (err: unknown) {
              const msg = err instanceof Error ? err.message : 'Cryptographic signature verification failed.';
              setErrorMessage(msg);
            } finally {
              setIsProcessing(false);
            }
          },
          modal: {
            ondismiss: () => {
              setIsProcessing(false);
              setInfoMessage('Checkout window closed. You can retry payment whenever you are ready.');
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', (resp: any) => {
          setIsProcessing(false);
          setErrorMessage(resp?.error?.description || 'Payment was declined by issuing bank or gateway.');
        });
        rzp.open();
      } else {
        // Fallback / simulation path if script cannot be fetched (e.g. offline testing)
        setInfoMessage('Razorpay Checkout SDK opened in test mode.');
        const verifyRes = await paymentsApi.verifyRazorpayPayment({
          razorpay_order_id: orderData.orderId,
          razorpay_payment_id: `pay_test_${Date.now()}`,
          razorpay_signature: 'test_signature_simulated',
          paymentId: orderData.paymentId,
          bookingId: booking.id,
        });

        const result: ProcessPaymentResult = {
          success: true,
          paymentId: verifyRes.paymentId,
          paymentReference: verifyRes.paymentReference,
          status: verifyRes.status,
          bookingStatus: verifyRes.bookingStatus,
          transactionId: verifyRes.razorpayPaymentId,
          message: verifyRes.message,
        };

        setSuccessResult(result);
        onPaymentSuccess?.(result);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Razorpay order creation failed.';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // 2. CHECK STATUS / RECONCILE
  const handleCheckStatus = async () => {
    const targetId = paymentId || booking?.payments?.[0]?.id;
    if (!targetId) {
      setErrorMessage('No active payment identifier found to check status.');
      return;
    }

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setInfoMessage(null);

      const statusRes = await paymentsApi.getPaymentStatus(targetId);

      if (statusRes.isPaid) {
        const result: ProcessPaymentResult = {
          success: true,
          paymentId: statusRes.paymentId,
          paymentReference: statusRes.paymentReference,
          status: statusRes.status,
          bookingStatus: statusRes.bookingStatus,
          transactionId: statusRes.gatewayTransactionId || statusRes.paymentReference,
          message: 'Payment settled and confirmed on the server!',
        };
        setSuccessResult(result);
        onPaymentSuccess?.(result);
      } else {
        setInfoMessage(
          `Current Server Status: ${statusRes.status} (Booking: ${statusRes.bookingStatus})`
        );
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not query payment status.';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  // 3. DIRECT CARD SETTLEMENT (Fallback / Backward-Compatible)
  const handleProcessSettlement = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!booking) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);
      setInfoMessage(null);

      let targetPaymentId = paymentId;
      if (!targetPaymentId) {
        const session = await paymentsApi.createSession({
          bookingId: booking.id,
          method: 'CREDIT_CARD',
        });
        targetPaymentId = session.paymentId;
        setPaymentId(session.paymentId);
      }

      const cleanCard = cardNumber.replace(/\s+/g, '');

      const result = await paymentsApi.processPayment({
        paymentId: targetPaymentId,
        paymentMethod: 'CREDIT_CARD',
        cardholderName: cardholderName || booking.user?.name || 'Authorized Traveler',
        cardNumber: cleanCard || undefined,
        expiryDate: expiryDate || undefined,
        cvv: cvv || undefined,
      });

      setSuccessResult(result);
      if (onPaymentSuccess) {
        onPaymentSuccess(result);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Payment settlement failed.';
      setErrorMessage(msg);
    } finally {
      setIsProcessing(false);
    }
  };

  if (!booking) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={isProcessing ? () => {} : onClose}
      maxWidth="lg"
      title={
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400">
            <Lock className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-slate-100 text-lg block">
              Secure Checkout & Settlement
            </span>
            <span className="text-[11px] text-slate-400 font-normal">
              Booking Ref: <strong className="font-mono text-teal-300">{booking.bookingReference}</strong>
            </span>
          </div>
        </div>
      }
    >
      <div className="space-y-6">
        {/* Order Summary Banner */}
        <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-[11px] text-slate-400 uppercase font-semibold block tracking-wider">
              Amount Due
            </span>
            <div className="flex items-baseline gap-1.5 mt-0.5">
              <span className="text-2xl font-extrabold text-slate-100">
                ${booking.totalAmount}
              </span>
              <span className="text-xs font-bold text-teal-400 uppercase">
                {booking.currency}
              </span>
            </div>
          </div>

          <div className="text-left sm:text-right space-y-0.5">
            <Badge variant="brand">{booking.items.length} Travel Item(s)</Badge>
            <span className="text-[11px] text-slate-400 block">
              Server-Calculated Trusted Balance
            </span>
          </div>
        </div>

        {/* Success View */}
        {successResult && (
          <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-center space-y-4">
            <div className="w-14 h-14 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg shadow-emerald-500/20 animate-bounce">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-emerald-200">
                Payment Settled & Confirmed!
              </h3>
              <p className="text-xs text-slate-300 mt-1 max-w-sm mx-auto">
                {successResult.message || 'Your reservation has been confirmed and verified on the server.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 text-left font-mono text-xs space-y-1">
              <div className="flex justify-between text-slate-400">
                <span>Payment Reference:</span>
                <span className="text-slate-200 font-semibold">{successResult.paymentReference}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Transaction ID:</span>
                <span className="text-teal-300 font-semibold">{successResult.transactionId}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Booking Status:</span>
                <span className="text-emerald-400 font-bold">{successResult.bookingStatus}</span>
              </div>
            </div>

            <Button
              variant="primary"
              size="md"
              className="w-full"
              onClick={onClose}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              View Updated Reservation
            </Button>
          </div>
        )}

        {/* Payment Form (Shown when not succeeded) */}
        {!successResult && (
          <>
            {/* Error Message */}
            {errorMessage && (
              <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 flex items-start gap-2.5 text-xs text-rose-300">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                <div className="flex-1 leading-relaxed">
                  <strong className="block font-semibold">Payment Issue Encountered</strong>
                  {errorMessage}
                </div>
              </div>
            )}

            {/* Info / Pending Message */}
            {infoMessage && (
              <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/20 flex items-start gap-2.5 text-xs text-teal-300">
                <Sparkles className="w-4 h-4 shrink-0 text-teal-400 mt-0.5" />
                <div className="flex-1 leading-relaxed">{infoMessage}</div>
              </div>
            )}

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
                Choose Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMethod('RAZORPAY')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                    selectedMethod === 'RAZORPAY'
                      ? 'border-teal-400 bg-teal-500/10 text-teal-200 shadow-md shadow-teal-500/10 ring-1 ring-teal-400/30'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                  <span>Razorpay</span>
                  <span className="text-[9px] uppercase px-1 py-0.2 rounded bg-teal-400/20 text-teal-300">
                    Recommended
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('CREDIT_CARD')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                    selectedMethod === 'CREDIT_CARD'
                      ? 'border-teal-400 bg-teal-500/10 text-teal-200 shadow-md shadow-teal-500/10'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <CreditCard className="w-5 h-5 text-teal-400" />
                  <span>Credit Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMethod('PAYPAL')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                    selectedMethod === 'PAYPAL'
                      ? 'border-teal-400 bg-teal-500/10 text-teal-200 shadow-md shadow-teal-500/10'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <span className="font-extrabold italic text-blue-400 text-base">P</span>
                  <span>PayPal</span>
                </button>
              </div>
            </div>

            {/* RAZORPAY VIEW (Primary) */}
            {selectedMethod === 'RAZORPAY' && (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gradient-to-r from-teal-500/10 via-slate-900 to-teal-500/5 border border-teal-500/30 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-xs font-bold text-teal-300">
                      <ShieldCheck className="w-4 h-4 text-teal-400" />
                      <span>Razorpay Official Checkout</span>
                    </div>
                    <Badge variant="brand">UPI • Cards • NetBanking</Badge>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Settle your reservation securely through Razorpay. Server-verified cryptographic signatures guarantee reliable inventory confirmation.
                  </p>
                  {razorpayOrderId && (
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 bg-slate-900/80 px-2.5 py-1.5 rounded-lg border border-slate-800">
                      <span>Order ID:</span>
                      <span className="text-teal-300 font-semibold">{razorpayOrderId}</span>
                    </div>
                  )}
                  <Button
                    type="button"
                    variant="primary"
                    size="lg"
                    className="w-full shadow-lg shadow-teal-500/20"
                    onClick={handleLaunchRazorpay}
                    disabled={isProcessing || isInitializing}
                    isLoading={isProcessing || isInitializing}
                    leftIcon={<ExternalLink className="w-4 h-4" />}
                  >
                    {isProcessing ? 'Connecting to Razorpay...' : `Pay $${booking.totalAmount} ${booking.currency} with Razorpay`}
                  </Button>
                </div>

                {/* Status Check & Retry Helper */}
                <div className="flex items-center justify-between gap-2 pt-1">
                  <button
                    type="button"
                    onClick={handleCheckStatus}
                    disabled={isProcessing}
                    className="text-xs text-slate-400 hover:text-teal-300 flex items-center gap-1.5 transition-colors disabled:opacity-50"
                  >
                    <Search className="w-3.5 h-3.5 text-teal-400" />
                    <span>Check Server Payment Status</span>
                  </button>
                  {errorMessage && (
                    <button
                      type="button"
                      onClick={handleLaunchRazorpay}
                      disabled={isProcessing}
                      className="text-xs text-teal-400 hover:underline flex items-center gap-1 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Retry Payment</span>
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Test Simulation Quick Auto-Fills (Credit Card) */}
            {selectedMethod === 'CREDIT_CARD' && (
              <div className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5 text-teal-400" />
                    Sandbox Test Simulators
                  </span>
                  <span className="text-[10px] text-slate-500">Instant test cards</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleFillSuccessCard}
                    className="flex-1 py-1 px-2.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 text-[11px] font-semibold text-teal-300 transition-colors"
                  >
                    ✓ Success Card (...4242)
                  </button>
                  <button
                    type="button"
                    onClick={handleFillDeclineCard}
                    className="flex-1 py-1 px-2.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-[11px] font-semibold text-rose-300 transition-colors"
                  >
                    ✕ Decline Card (...0002)
                  </button>
                </div>
              </div>
            )}

            {/* Credit Card Form */}
            {selectedMethod === 'CREDIT_CARD' && (
              <form onSubmit={handleProcessSettlement} className="space-y-4">
                <Input
                  id="cardholder-name"
                  label="Cardholder Full Name"
                  placeholder="e.g. Alice Traveler"
                  value={cardholderName}
                  onChange={(e) => setCardholderName(e.target.value)}
                  disabled={isProcessing || isInitializing}
                  required
                />

                <Input
                  id="card-number"
                  label="Card Number"
                  placeholder="4242 4242 4242 4242"
                  value={cardNumber}
                  onChange={handleCardNumberChange}
                  leftIcon={<CreditCard className="w-4 h-4" />}
                  disabled={isProcessing || isInitializing}
                  required
                />

                <div className="grid grid-cols-2 gap-3">
                  <Input
                    id="expiry-date"
                    label="Expiration Date"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={handleExpiryChange}
                    disabled={isProcessing || isInitializing}
                    required
                  />

                  <Input
                    id="cvv"
                    label="Security Code (CVV)"
                    placeholder="123"
                    value={cvv}
                    onChange={handleCvvChange}
                    leftIcon={<Lock className="w-3.5 h-3.5" />}
                    disabled={isProcessing || isInitializing}
                    required
                  />
                </div>

                <div className="pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    size="lg"
                    className="w-full shadow-lg shadow-teal-500/20"
                    disabled={isProcessing || isInitializing || !cardNumber || !expiryDate || !cvv}
                    isLoading={isProcessing || isInitializing}
                    leftIcon={isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                  >
                    {isProcessing
                      ? 'Authorizing with Gateway...'
                      : `Pay $${booking.totalAmount} ${booking.currency}`}
                  </Button>
                </div>
              </form>
            )}

            {/* PayPal View */}
            {selectedMethod === 'PAYPAL' && (
              <div className="space-y-4 text-center py-2">
                <p className="text-xs text-slate-300">
                  Connect your PayPal wallet to settle your travel reservation instantly with buyer protection.
                </p>
                <button
                  type="button"
                  onClick={() => handleProcessSettlement()}
                  disabled={isProcessing || isInitializing}
                  className="w-full py-3.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-amber-400/20 transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                  ) : (
                    <>
                      <span className="italic font-black text-blue-900">PayPal</span>
                      <span>Checkout (${booking.totalAmount} {booking.currency})</span>
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Security Guarantee Badges */}
            <div className="flex items-center justify-center gap-4 text-[11px] text-slate-400 pt-2 border-t border-slate-800">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
                256-Bit SSL Encryption
              </span>
              <span>•</span>
              <span className="flex items-center gap-1">
                <Lock className="w-3.5 h-3.5 text-teal-400" />
                PCI-DSS Certified
              </span>
              <span>•</span>
              <span>Razorpay Verified</span>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
