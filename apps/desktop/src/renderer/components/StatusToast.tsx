interface Props {
  message: string;
  kind: 'success' | 'error';
}

export function StatusToast({ message, kind }: Props) {
  return (
    <div className={`status-toast ${kind}`} role="status">
      <span className="status-mark" aria-hidden="true" />
      <span>{message}</span>
    </div>
  );
}
