import React, { useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import { useUserProfiles } from '@/hooks/useUserProfiles';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Plus, Users } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

const AccountInventory: React.FC = () => {
  const { accountInventory, softwareInventory, addAccountItem, loading } = useInventory();
  const { profiles } = useUserProfiles();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [formData, setFormData] = useState({
    full_name: '',
    username_email: '',
    software: '',
    data_class: '',
    approval_status: 'Not submitted',
    authorized_by: '',
    date_access_created: '',
    date_access_revoked: '',
    date_column: '',
    status: 'Active',
  });

  const handleUserSelection = (userId: string) => {
    setSelectedUserId(userId);
    const selectedUser = profiles.find(profile => profile.id === userId);
    if (selectedUser) {
      setFormData(prev => ({
        ...prev,
        full_name: selectedUser.full_name || '',
        username_email: selectedUser.email || selectedUser.username || '',
      }));
    }
  };

  const resetForm = () => {
    setSelectedUserId('');
    setFormData({
      full_name: '',
      username_email: '',
      software: '',
      data_class: '',
      approval_status: 'Not submitted',
      authorized_by: '',
      date_access_created: '',
      date_access_revoked: '',
      date_column: '',
      status: 'Active',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addAccountItem({
        ...formData,
        date_access_created: formData.date_access_created || undefined,
        date_access_revoked: formData.date_access_revoked || undefined,
        date_column: formData.date_column || undefined,
      });
      toast({
        title: "Account item added",
        description: "Account inventory item has been successfully added.",
      });
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-green-500';
      case 'Inactive': return 'bg-red-500';
      case 'Suspended': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  if (loading) {
    return <div>Loading account inventory...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Account Inventory</h3>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button size="icon" className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Account</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="user_select">Select User *</Label>
                  <Select value={selectedUserId} onValueChange={handleUserSelection}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a user from User Management" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name || 'No name'} ({profile.email || profile.username || 'No email'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {selectedUserId && (
                  <div className="col-span-2 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium mb-2">Selected User Details:</h4>
                    <p><strong>Name:</strong> {formData.full_name}</p>
                    <p><strong>Username:</strong> {formData.username_email}</p>
                  </div>
                )}

                <div>
                  <Label htmlFor="full_name">Full Name *</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Auto-filled when user is selected"
                    required
                    disabled={!!selectedUserId}
                  />
                </div>
                <div>
                  <Label htmlFor="username_email">Username *</Label>
                  <Input
                    id="username_email"
                    value={formData.username_email}
                    onChange={(e) => setFormData({ ...formData, username_email: e.target.value })}
                    placeholder="Auto-filled when user is selected"
                    required
                    disabled={!!selectedUserId}
                  />
                </div>
                <div>
                  <Label htmlFor="software">Software</Label>
                  <Select value={formData.software} onValueChange={(value) => setFormData({ ...formData, software: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select software" />
                    </SelectTrigger>
                    <SelectContent>
                      {softwareInventory
                        .filter(software => software.status === 'Active' || !software.status)
                        .map((software) => (
                          <SelectItem key={software.id} value={software.software_name}>
                            {software.software_name}
                            {software.software_version && ` (${software.software_version})`}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="data_class">Data Class</Label>
                  <Select value={formData.data_class} onValueChange={(value) => setFormData({ ...formData, data_class: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select data class" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Public">Public</SelectItem>
                      <SelectItem value="Internal">Internal</SelectItem>
                      <SelectItem value="Confidential">Confidential</SelectItem>
                      <SelectItem value="Restricted">Restricted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="approval_status">Approval Status</Label>
                  <Select value={formData.approval_status} onValueChange={(value) => setFormData({ ...formData, approval_status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Not submitted">Not submitted</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="authorized_by">Authorized By</Label>
                  <Select value={formData.authorized_by} onValueChange={(value) => setFormData({ ...formData, authorized_by: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a user" />
                    </SelectTrigger>
                    <SelectContent>
                      {profiles.map((profile) => (
                        <SelectItem key={profile.id} value={profile.id}>
                          {profile.full_name || 'No name'} ({profile.email || profile.username || 'No email'})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="date_access_created">Date Access Created</Label>
                  <Input
                    id="date_access_created"
                    type="date"
                    value={formData.date_access_created}
                    onChange={(e) => setFormData({ ...formData, date_access_created: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="date_access_revoked">Date Access Revoked</Label>
                  <Input
                    id="date_access_revoked"
                    type="date"
                    value={formData.date_access_revoked}
                    onChange={(e) => setFormData({ ...formData, date_access_revoked: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Active">Active</SelectItem>
                      <SelectItem value="Inactive">Inactive</SelectItem>
                      <SelectItem value="Suspended">Suspended</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex gap-2 justify-end">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!selectedUserId}>
                  Add Account
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {accountInventory.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>No account items found</p>
          <p className="text-sm">Add your first account item to get started.</p>
        </div>
      ) : (
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Full Name</TableHead>
                <TableHead>Username</TableHead>
                <TableHead>Software</TableHead>
                <TableHead>Date Created</TableHead>
                <TableHead>Date Revoked</TableHead>
                <TableHead>Data Class</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accountInventory.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-medium">{item.full_name}</TableCell>
                  <TableCell>{item.username_email}</TableCell>
                  <TableCell>{item.software || 'Not specified'}</TableCell>
                  <TableCell>
                    {item.date_access_created 
                      ? new Date(item.date_access_created).toLocaleDateString() 
                      : 'Not specified'}
                  </TableCell>
                  <TableCell>
                    {item.date_access_revoked 
                      ? new Date(item.date_access_revoked).toLocaleDateString() 
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{item.data_class || 'Not specified'}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(item.status)} text-white`}>
                      {item.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default AccountInventory;
