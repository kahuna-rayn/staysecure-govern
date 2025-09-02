import React, { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Edit, Check, X, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface EditableFieldProps {
  value: string;
  fieldKey: string;
  label?: string;
  placeholder?: string;
  className?: string;
  inputClassName?: string;
  onSave: (fieldKey: string, value: string) => Promise<void>;
  isEditing: boolean;
  onEdit: (fieldKey: string) => void;
  onCancel: () => void;
  saving: boolean;
  departmentValue?: string; // For filtering roles by department
}

const EditableField: React.FC<EditableFieldProps> = ({
  value,
  fieldKey,
  label,
  placeholder,
  className = "",
  inputClassName = "",
  onSave,
  isEditing,
  onEdit,
  onCancel,
  saving,
  departmentValue
}) => {
  const [editValue, setEditValue] = useState(value);

  // Fetch options for dropdown fields
  const { data: locations } = useQuery({
    queryKey: ['locations-for-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('locations')
        .select('id, name')
        .eq('status', 'Active')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: fieldKey === 'location',
  });

  const { data: roles } = useQuery({
    queryKey: ['roles-for-profile', departmentValue],
    queryFn: async () => {
      let query = supabase
        .from('roles')
        .select('role_id, name, department_id, departments(name)')
        .eq('is_active', true);

      // Filter roles by department if departmentValue is provided
      if (departmentValue && departmentValue !== '') {
        const { data: department, error: deptError } = await supabase
          .from('departments')
          .select('id')
          .eq('name', departmentValue)
          .maybeSingle();
        
        if (!deptError && department) {
          // Show roles that either belong to the selected department OR have no department (designation roles)
          query = query.or(`department_id.eq.${department.id},department_id.is.null`);
        } else {
          // If department not found, only show designation roles
          query = query.is('department_id', null);
        }
      }
      // If no department is selected, show all roles (default behavior)

      const { data, error } = await query.order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: fieldKey === 'role',
  });

  const { data: departments } = useQuery({
    queryKey: ['departments-for-profile'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');
      
      if (error) throw error;
      return data;
    },
    enabled: fieldKey === 'department',
  });

  const isDropdownField = fieldKey === 'location' || fieldKey === 'role' || fieldKey === 'department';

  React.useEffect(() => {
    setEditValue(value);
  }, [value, isEditing]);

  const handleSave = async () => {
    await onSave(fieldKey, editValue);
  };

  const handleCancel = () => {
    setEditValue(value);
    onCancel();
  };

  if (isEditing) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        {label && <span className="text-sm text-muted-foreground">{label}</span>}
        {isDropdownField ? (
          <Select value={editValue} onValueChange={async (value) => {
            setEditValue(value);
            await onSave(fieldKey, value);
          }}>
            <SelectTrigger className={inputClassName}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {fieldKey === 'location' && locations?.map((location) => (
                <SelectItem key={location.id} value={location.name}>
                  {location.name}
                </SelectItem>
              ))}
              {fieldKey === 'role' && roles?.map((role) => (
                <SelectItem key={role.role_id} value={role.name}>
                  {role.name}
                </SelectItem>
              ))}
              {fieldKey === 'department' && departments?.map((department) => (
                <SelectItem key={department.id} value={department.name}>
                  {department.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : (
          <Input
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            className={inputClassName}
            placeholder={placeholder}
            onKeyDown={async (e) => {
              if (e.key === 'Enter') {
                await onSave(fieldKey, editValue);
              } else if (e.key === 'Escape') {
                setEditValue(value);
                onCancel();
              }
            }}
            autoFocus
           />
        )}
        {!isDropdownField && (
          <div className="flex gap-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={handleSave}
              disabled={saving}
              className="h-6 w-6 p-0"
            >
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={handleCancel}
              className="h-6 w-6 p-0"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {label && <span className="text-sm text-muted-foreground">{label}</span>}
      <span className={className.includes('text-right') ? 'text-right' : ''}>{value}</span>
      <Button
        size="sm"
        variant="ghost"
        onClick={() => { console.log('Edit icon clicked for field:', fieldKey); onEdit(fieldKey); }}
        className="h-6 w-6 p-0"
      >
        <Edit className="h-3 w-3" />
      </Button>
    </div>
  );
};

export default EditableField;
