interface Props {
  message: string;
  kind: 'success' | 'error';
}

export function StatusToast({ message, kind }: Props) {
  return <div className={`status-toast ${kind}`}>{message}</div>;
}
