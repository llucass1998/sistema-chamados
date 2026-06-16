interface StatusAlertProps {
  message: string;
  type: 'success' | 'error';
}

function StatusAlert({ message, type }: StatusAlertProps) {
  if (!message) {
    return null;
  }

  const classes =
    type === 'success'
      ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
      : 'border-red-200 bg-red-50 text-red-900';

  return (
    <div className={`mb-4 rounded-xl border px-4 py-3 text-sm font-bold shadow-sm ${classes}`}>
      {message}
    </div>
  );
}

export default StatusAlert;
