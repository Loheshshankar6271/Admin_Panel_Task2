import { Heart } from 'lucide-react';
import PublicDataTable from './PublicDataTable';

const fmt = (d) => d ? new Date(d).toLocaleString() : '—';

export default function RelationshipsPage() {
  return (
    <PublicDataTable
      endpoint="/relationships"
      icon={Heart}
      titleSingular="Relationship"
      titlePlural="Relationships"
      description="Patient relationship types (Self, Spouse, Father, Guardian, etc.) — sourced from GET /api/relationships"
      searchPlaceholder="Search relationships..."
      searchKeys={['name']}
      columns={[
        { key: 'name', label: 'Name' },
        { key: 'created_at', label: 'Created At', render: (i) => fmt(i.created_at) },
      ]}
    />
  );
}
