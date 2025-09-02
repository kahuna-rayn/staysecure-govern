
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { EditableTable } from '@/components/ui/editable-table';
import type { UserProfile } from '@/hooks/useUserProfiles';

interface UserTableProps {
  profiles: UserProfile[];
  onEdit: (user: UserProfile) => void;
  onDelete: (userId: string) => void;
  onUpdate: (id: string, updates: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
  onCreate?: (data: Partial<UserProfile>) => Promise<{ success: boolean; error?: string }>;
}

const UserTable: React.FC<UserTableProps> = ({ 
  profiles, 
  onUpdate,
  onDelete,
  onCreate 
}) => {
  const navigate = useNavigate();

  const columns = [
    { 
      key: 'full_name', 
      header: 'Full Name', 
      type: 'text' as const, 
      editable: true, 
      required: true,
      sortable: true,
      width: '180px'
    },
    { 
      key: 'username', 
      header: 'Username', 
      type: 'text' as const, 
      editable: true,
      sortable: true,
      width: '140px'
    },
    { 
      key: 'department_role_pairs', 
      header: 'Department → Role', 
      type: 'custom' as const, 
      editable: false,
      sortable: false,
      customComponent: 'DepartmentRolePairsDisplay',
      width: '280px'
    },
    { 
      key: 'employee_id', 
      header: 'Employee ID', 
      type: 'text' as const, 
      editable: true,
      sortable: true,
      width: '120px'
    },
    { 
      key: 'phone', 
      header: 'Phone', 
      type: 'text' as const, 
      editable: true,
      sortable: false,
      width: '130px'
    },
    { 
      key: 'location', 
      header: 'Location', 
      type: 'text' as const, 
      editable: true,
      sortable: true,
      width: '120px'
    },
    { 
      key: 'status', 
      header: 'Status', 
      type: 'badge' as const, 
      editable: true,
      sortable: true,
      options: ['Active', 'Inactive', 'OnLeave'],
      width: '100px'
    },
    { 
      key: 'access_level', 
      header: 'Access Level', 
      type: 'select' as const, 
      editable: true,
      sortable: true,
      options: ['User', 'Manager', 'Admin'],
      width: '130px'
    },
    { 
      key: 'language', 
      header: 'Language', 
      type: 'select' as const, 
      editable: true,
      sortable: true,
      options: [
        'Bahasa Indonesia',
        'Bahasa Malaysia', 
        'Burmese',
        'Cambodian',
        'English',
        'Filipino',
        'Lao',
        'Thai',
        'Vietnamese'
      ],
      width: '140px'
    }
  ];

  const handleDelete = async (id: string) => {
    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      onDelete(id);
      resolve({ success: true });
    });
  };

  const handleViewUser = (user: UserProfile) => {
    navigate(`/admin/users/${user.id}`);
  };

  return (
    <div className="w-full">
      <EditableTable
        data={profiles}
        columns={columns}
        onUpdate={onUpdate}
        onDelete={handleDelete}
        onCreate={onCreate}
        onViewUser={handleViewUser}
        allowAdd={true}
        allowDelete={true}
        allowView={true}
        className="w-full"
      />
    </div>
  );
};

export default UserTable;
