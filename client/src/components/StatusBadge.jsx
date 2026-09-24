export default function StatusBadge({ status }) {
  const labels = {
    'NEW': 'New',
    'UNDER_REVIEW': 'Under Review',
    'ASSIGNED': 'Assigned',
    'IN_PROGRESS': 'In Progress',
    'RESOLVED': 'Resolved',
    'CITIZEN_VERIFICATION': 'Verification',
    'CLOSED': 'Closed',
    'REOPENED': 'Reopened',
  };

  const className = `badge badge-${status?.toLowerCase()}`;
  return <span className={className}>{labels[status] || status}</span>;
}

export function PriorityBadge({ priority }) {
  const className = `badge badge-${priority?.toLowerCase()}`;
  return <span className={className}>{priority}</span>;
}
