interface Props {
  message: string;
  kind: 'success' | 'error';
}

export function StatusToast({ message, kind }: Props) {
  return (
    <div className={`status-toast ${kind}`} role="status">
      {kind === 'success' ? (
        <svg className="status-icon" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <circle cx="9" cy="9" r="8" fill="rgba(52,199,89,0.15)" stroke="#34c759" strokeWidth="1.2" />
          <path d="M5.4 9.2l2.4 2.4 4.8-5" fill="none" stroke="#34c759" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg className="status-icon" width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
          <circle cx="9" cy="9" r="8" fill="rgba(255,59,48,0.14)" stroke="#ff3b30" strokeWidth="1.2" />
          <path d="M6.2 6.2l5.6 5.6M11.8 6.2l-5.6 5.6" fill="none" stroke="#ff3b30" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      )}
      <span>{message}</span>
    </div>
  );
}
