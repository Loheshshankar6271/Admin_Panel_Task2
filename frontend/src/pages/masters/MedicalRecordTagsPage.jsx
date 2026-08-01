import { Tag } from 'lucide-react';
import PublicDataTable from './PublicDataTable';

const fmt = (d) => d ? new Date(d).toLocaleString() : '—';

export default function MedicalRecordTagsPage() {
  return (
    <PublicDataTable
      endpoint="/medical-record-tags"
      icon={Tag}
      titleSingular="Medical Record Tag"
      titlePlural="Medical Record Tags"
      description="Tags used to label medical records — sourced from GET /api/medical-record-tags"
      searchPlaceholder="Search tags..."
      searchKeys={['tag_name']}
      columns={[
        { key: 'tag_name', label: 'Tag Name' },
        {
          key: 'is_active',
          label: 'Status',
          render: (i) => <span className={`badge ${i.is_active ? 'badge-active' : 'badge-inactive'}`}>{i.is_active ? 'Active' : 'Inactive'}</span>,
        },
        { key: 'created_at', label: 'Created At', render: (i) => fmt(i.created_at) },
        { key: 'updated_at', label: 'Updated At', render: (i) => fmt(i.updated_at) },
      ]}
    />
  );
}
