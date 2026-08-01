import { Stethoscope, ImageOff } from 'lucide-react';
import PublicDataTable from './PublicDataTable';

const fmt = (d) => d ? new Date(d).toLocaleString() : '—';
const fmtBytes = (n) => {
  if (!n && n !== 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
};

export default function SpecialtiesPage() {
  return (
    <PublicDataTable
      endpoint="/specialties"
      icon={Stethoscope}
      titleSingular="Specialty"
      titlePlural="Specialties"
      description="Doctor / department specialties (Cardiology, Dermatology, etc.) — sourced from GET /api/specialties"
      searchPlaceholder="Search specialties..."
      searchKeys={['name']}
      columns={[
        {
          key: 'image_url',
          label: 'Image',
          render: (i) => i.image_url ? (
            <img
              src={i.image_url}
              alt={i.name}
              title={`${i.image_file_name || ''} (${fmtBytes(i.image_file_size)})`}
              style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover', border: '1px solid var(--border)' }}
            />
          ) : (
            <div style={{ width: 36, height: 36, borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-4)' }}>
              <ImageOff size={16} />
            </div>
          ),
        },
        { key: 'name', label: 'Name' },
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
