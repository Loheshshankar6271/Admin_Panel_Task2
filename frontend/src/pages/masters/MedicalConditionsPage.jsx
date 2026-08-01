import { Activity } from 'lucide-react';
import PublicDataTable from './PublicDataTable';

const fmt = (d) => d ? new Date(d).toLocaleString() : '—';

export default function MedicalConditionsPage() {
  return (
    <PublicDataTable
      endpoint="/medical-conditions"
      icon={Activity}
      titleSingular="Medical Condition"
      titlePlural="Medical Conditions"
      description="Medical conditions used across patient records — sourced from GET /api/medical-conditions"
      searchPlaceholder="Search medical conditions..."
      searchKeys={['condition_name', 'description']}
      columns={[
        { key: 'condition_name', label: 'Condition Name' },
        {
          key: 'description',
          label: 'Description',
          render: (i) => (
            <span style={{ display: 'block', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {i.description || '—'}
            </span>
          ),
        },
        {
          key: 'is_active',
          label: 'Status',
          render: (i) => <span className={`badge ${i.is_active ? 'badge-active' : 'badge-inactive'}`}>{i.is_active ? 'Active' : 'Inactive'}</span>,
        },
        { key: 'created_at', label: 'Created At', render: (i) => fmt(i.created_at) },
      ]}
    />
  );
}
