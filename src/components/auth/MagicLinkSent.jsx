export default function MagicLinkSent({ email, onBack, onResend }) {
  return (
    <div className="min-h-screen bg-bg-primary flex flex-col items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <div className="text-5xl mb-6">📬</div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">Check your email</h2>
        <p className="text-text-secondary text-sm mb-2">
          We sent a magic link to
        </p>
        <p className="text-text-primary font-medium mb-8">{email}</p>
        <button
          onClick={onResend}
          className="w-full border border-bg-tertiary text-text-secondary rounded-xl py-3 text-sm mb-4 hover:border-accent hover:text-text-primary transition-colors"
        >
          Resend link
        </button>
        <button
          onClick={onBack}
          className="text-text-muted text-sm hover:text-text-secondary transition-colors"
        >
          Use a different email
        </button>
      </div>
    </div>
  )
}
