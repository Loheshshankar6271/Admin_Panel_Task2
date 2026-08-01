import { ShieldCheck } from 'lucide-react';
import PublicDataTable from './PublicDataTable';

const fmt = (d) => d ? new Date(d).toLocaleString() : '—';

export default function UserRolesPage() {
  return (
    <PublicDataTable
      endpoint="/user-roles"
      icon={ShieldCheck}
      titleSingular="User Role"
      titlePlural="User Roles"
      description="Roles available to system users — sourced from GET /api/user-roles"
      searchPlaceholder="Search user roles..."
      searchKeys={['name', 'description', 'type']}
      columns={[
        { key: 'name', label: 'Name' },
        {
          key: 'description',
          label: 'Description',
          render: (i) => (
            <span style={{ display: 'block', maxWidth: 320, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {i.description || '—'}
            </span>
          ),
        },
        { key: 'type', label: 'Type' },
        { key: 'createdAt', label: 'Created At', render: (i) => fmt(i.createdAt) },
        { key: 'updatedAt', label: 'Updated At', render: (i) => fmt(i.updatedAt) },
      ]}
    />
  );
}
