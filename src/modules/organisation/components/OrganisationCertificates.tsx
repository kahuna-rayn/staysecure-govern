import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Award, Calendar, User, Building, Plus } from 'lucide-react';
import { useOrganisationContext } from '../context/OrganisationContext';
import type { OrgCertificate } from '../types';

interface UserProfile {
  id: string;
  full_name?: string;
  username?: string;
}

export const OrganisationCertificates: React.FC = () => {
  const { supabaseClient, hasPermission } = useOrganisationContext();
  const [certificates, setCertificates] = useState<OrgCertificate[]>([]);
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getTypeIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'security':
        return <Award className="h-4 w-4" />;
      case 'compliance':
        return <Building className="h-4 w-4" />;
      default:
        return <Award className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'security':
        return 'bg-blue-100 text-blue-800';
      case 'compliance':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getValidityStatus = (expiryDate?: string) => {
    if (!expiryDate) return 'No Expiry';
    
    const expiry = new Date(expiryDate);
    const today = new Date();
    const daysUntilExpiry = Math.ceil((expiry.getTime() - today.getTime()) / (1000 * 3600 * 24));
    
    if (daysUntilExpiry < 0) return 'Expired';
    if (daysUntilExpiry <= 30) return 'Expiring Soon';
    return 'Valid';
  };

  const getValidityStatusColor = (status: string) => {
    switch (status) {
      case 'Valid':
        return 'bg-green-100 text-green-800';
      case 'Expiring Soon':
        return 'bg-yellow-100 text-yellow-800';
      case 'Expired':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUserDisplayName = (userId?: string) => {
    if (!userId) return 'Unassigned';
    const user = userProfiles.find(u => u.id === userId);
    return user?.full_name || user?.username || 'Unknown User';
  };

  const fetchOrganisationCertificates = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch certificates
      const { data: certsData, error: certsError } = await supabaseClient
        .from('certificates')
        .select('*')
        .eq('org_cert', true)
        .order('created_at', { ascending: false });

      if (certsError) throw certsError;

      // Fetch user profiles for assigned users
      const { data: profilesData, error: profilesError } = await supabaseClient
        .from('profiles')
        .select('id, full_name, username');

      if (profilesError) throw profilesError;

      setCertificates(certsData || []);
      setUserProfiles(profilesData || []);
    } catch (err: any) {
      console.error('Error fetching organisation certificates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganisationCertificates();
  }, [supabaseClient]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-red-600">
        <p>Error loading certificates: {error}</p>
        <Button 
          variant="outline" 
          onClick={fetchOrganisationCertificates}
          className="mt-4"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">Organisation Certificates</h2>
          <p className="text-sm text-muted-foreground">
            Manage and track organizational certificates and compliance documents
          </p>
        </div>
        {hasPermission('canManageCertificates') && (
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Certificate
          </Button>
        )}
      </div>

      {certificates.length === 0 ? (
        <div className="text-center py-12">
          <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium mb-2">No Certificates Found</h3>
          <p className="text-muted-foreground mb-4">
            Start by adding your organization's certificates and compliance documents.
          </p>
          {hasPermission('canManageCertificates') && (
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Certificate
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {certificates.map((cert) => (
            <Card key={cert.id} className="hover:shadow-md transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      {getTypeIcon(cert.name)}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{cert.name}</CardTitle>
                      <CardDescription className="flex items-center space-x-4 mt-1">
                        <span className="flex items-center">
                          <Building className="h-3 w-3 mr-1" />
                          Issued by {cert.issued_by}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {formatDate(cert.date_acquired)}
                        </span>
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-2">
                    <Badge variant="outline" className={getTypeColor(cert.name)}>
                      {cert.status}
                    </Badge>
                    <Badge variant="outline" className={getValidityStatusColor(getValidityStatus(cert.expiry_date))}>
                      {getValidityStatus(cert.expiry_date)}
                    </Badge>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Assigned To</p>
                    <div className="flex items-center mt-1">
                      <User className="h-3 w-3 mr-1" />
                      <span>{getUserDisplayName(cert.assigned_to)}</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Acquired</p>
                    <p className="mt-1">{formatDate(cert.date_acquired)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Expires</p>
                    <p className="mt-1">
                      {cert.expiry_date ? formatDate(cert.expiry_date) : 'No expiry date'}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Document</p>
                    <div className="mt-1">
                      {cert.file_url ? (
                        <Button variant="outline" size="sm" asChild>
                          <a href={cert.file_url} target="_blank" rel="noopener noreferrer">
                            View Document
                          </a>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">No document</span>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};