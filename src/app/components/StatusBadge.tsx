interface StatusBadgeProps {
  status: 'pending' | 'downloaded' | 'not-downloaded' | 'approved' | 'rejected';
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const styles = {
    pending: 'bg-amber-100 text-amber-800 border-amber-200',
    approved: 'bg-blue-100 text-blue-800 border-blue-200',
    rejected: 'bg-red-100 text-red-800 border-red-200',
    downloaded: 'bg-green-100 text-green-800 border-green-200',
    'not-downloaded': 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const labels = {
    pending: 'Pending',
    approved: 'Approved',
    rejected: 'Rejected',
    downloaded: 'Downloaded',
    'not-downloaded': 'Not Downloaded',
  };

  return (
    <span className={`inline-flex min-w-max items-center justify-center whitespace-nowrap rounded-md border px-3 py-1 text-sm font-medium leading-none ${styles[status]}`}>
      {labels[status]}
    </span>
  );
}
