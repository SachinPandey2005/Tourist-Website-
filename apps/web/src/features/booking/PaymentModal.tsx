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
} from 'lucide-react';
import { Modal } from '../../components/ui/Modal.js';
import { Button } from '../../components/ui/Button.js';
import { Input } from '../../components/ui/Input.js';
import { Badge } from '../../components/ui/Badge.js';
import { paymentsApi } from '../../lib/api/payments.js';
import { UserBookingRecord } from '../../lib/api/bookings.js';
import type { PaymentMethod, ProcessPaymentResult } from '@tourist/shared';

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: UserBookingRecord | null;
  onPaymentSuccess?: (result: ProcessPaymentResult) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  booking,
  onPaymentSuccess,
}: PaymentModalProps) {
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod>('CREDIT_CARD');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successResult, setSuccessResult] = useState<ProcessPaymentResult | null>(null);

  // Form Fields
  const [cardholderName, setCardholderName] = useState<string>('');
  const [cardNumber, setCardNumber] = useState<string>('');
  const [expiryDate, setExpiryDate] = useState<string>('');
  const [cvv, setCvv] = useState<string>('');

  const prevIsOpenRef = useRef<boolean>(false);

  // Pre-fill user details and initialize session on open only
  useEffect(() => {
    if (isOpen && (!prevIsOpenRef.current || !paymentId) && booking) {
      setErrorMessage(null);
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
            method: selectedMethod,
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
  }, [isOpen, booking, selectedMethod, paymentId]);

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

  const handleProcessSettlement = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!booking) return;

    try {
      setIsProcessing(true);
      setErrorMessage(null);

      let targetPaymentId = paymentId;
      if (!targetPaymentId) {
        const session = await paymentsApi.createSession({
          bookingId: booking.id,
          method: selectedMethod,
        });
        targetPaymentId = session.paymentId;
        setPaymentId(session.paymentId);
      }

      const cleanCard = cardNumber.replace(/\s+/g, '');

      const result = await paymentsApi.processPayment({
        paymentId: targetPaymentId,
        paymentMethod: selectedMethod,
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
        {/* Order Summary Pill */}
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
              Server-Verified Final Balance
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
                {successResult.message || 'Your reservation has been confirmed and official boarding vouchers were issued.'}
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

            {/* Payment Method Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-300 block">
                Choose Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
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

                <button
                  type="button"
                  onClick={() => setSelectedMethod('BANK_TRANSFER')}
                  className={`p-3 rounded-xl border text-xs font-semibold flex flex-col items-center gap-1.5 transition-all ${
                    selectedMethod === 'BANK_TRANSFER'
                      ? 'border-teal-400 bg-teal-500/10 text-teal-200 shadow-md shadow-teal-500/10'
                      : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <ShieldCheck className="w-5 h-5 text-teal-400" />
                  <span>Direct Transfer</span>
                </button>
              </div>
            </div>

            {/* Test Simulation Quick Auto-Fills */}
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

            {/* Bank Transfer View */}
            {selectedMethod === 'BANK_TRANSFER' && (
              <div className="space-y-4 py-2">
                <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1.5 text-slate-300">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Bank Name:</span>
                    <span className="font-semibold text-slate-100">Global Alpine Reserve</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Account Reference:</span>
                    <span className="font-mono text-teal-300 font-semibold">{booking.bookingReference}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">Routing / Swift:</span>
                    <span className="font-mono text-slate-100">VOYAGEUS33</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="primary"
                  size="md"
                  className="w-full"
                  onClick={() => handleProcessSettlement()}
                  disabled={isProcessing || isInitializing}
                  isLoading={isProcessing || isInitializing}
                >
                  Verify Wire & Settle Reservation
                </Button>
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
              <span>Zero-Storage Card Vault</span>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
}
