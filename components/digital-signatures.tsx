'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Eye, Key, Shield, CheckCircle, XCircle, RotateCcw, Search } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  public_key?: string;
  private_key?: string;
  certificate?: string;
  certificate_valid_until?: string;
}

interface DigitalSignaturesProps {
  user: User;
}

export function DigitalSignatures({ user }: DigitalSignaturesProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isCertificateDialogOpen, setIsCertificateDialogOpen] = useState(false);
  const [isKeysDialogOpen, setIsKeysDialogOpen] = useState(false);
  const [generatingKeys, setGeneratingKeys] = useState<number | null>(null);
  const [resettingSignatures, setResettingSignatures] = useState(false);
  const [generatingAllSignatures, setGeneratingAllSignatures] = useState(false);
  const [resettingUserKeys, setResettingUserKeys] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    console.log('DigitalSignatures component mounted');
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      console.log('Fetching users...');
      const response = await fetch('/api/users');
      console.log('Users response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Users data:', data);
        // Fix: API returns { success: true, data: users } not { users }
        setUsers(data.data || []);
      } else {
        const errorData = await response.json();
        console.error('Error response:', errorData);
        setError(`Failed to fetch users: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      setError(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const generateKeys = async (userId: number) => {
    try {
      setGeneratingKeys(userId);
      console.log('Generating keys for user:', userId);
      const response = await fetch('/api/digital-signatures/generate-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      console.log('Generate keys response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Generate keys success:', data);
        // Show success message
        alert('Keys generated successfully!');
        await fetchUsers(); // Refresh the list
      } else {
        const errorData = await response.json();
        console.error('Generate keys error response:', errorData);
        // Show error message
        alert(`Error generating keys: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error generating keys:', error);
      // Show error message
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGeneratingKeys(null);
    }
  };

  const getCertificate = async (userId: number) => {
    try {
      const response = await fetch(`/api/digital-signatures/certificate?userId=${userId}`);
      if (response.ok) {
        const data = await response.json();
        setSelectedUser(users.find(u => u.id === userId) || null);
        setIsCertificateDialogOpen(true);
      }
    } catch (error) {
      console.error('Error fetching certificate:', error);
    }
  };

  const viewKeys = (userId: number) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      console.log('Viewing keys for user:', user);
      console.log('Public key:', user.public_key);
      console.log('Private key:', user.private_key);
      console.log('Certificate:', user.certificate);
      setSelectedUser(user);
      setIsKeysDialogOpen(true);
    }
  };

  const resetAllSignatures = async () => {
    if (!confirm('Are you sure you want to reset all digital signatures? This action cannot be undone.')) {
      return;
    }

    try {
      setResettingSignatures(true);
      console.log('Resetting all digital signatures...');
      const response = await fetch('/api/digital-signatures/reset', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('Reset signatures response status:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Reset signatures success:', data);
        alert('All digital signatures have been reset successfully!');
        await fetchUsers(); // Refresh the list
      } else {
        const errorData = await response.json();
        console.error('Reset signatures error response:', errorData);
        alert(`Error resetting signatures: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error resetting signatures:', error);
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setResettingSignatures(false);
    }
  };

  const generateAllSignatures = async () => {
    try {
      setGeneratingAllSignatures(true);
      console.log('Generating signatures for all users...');
      
      // Get all users without keys
      const usersWithoutKeys = users.filter(user => !user.public_key || !user.private_key);
      console.log('Users without keys:', usersWithoutKeys.length);
      
      if (usersWithoutKeys.length === 0) {
        alert('All users already have signatures generated!');
        return;
      }
      
      // Generate keys for each user without keys
      for (const user of usersWithoutKeys) {
        try {
          console.log(`Generating keys for user: ${user.name} (${user.id})`);
          const response = await fetch('/api/digital-signatures/generate-keys', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id })
          });
          
          if (response.ok) {
            console.log(`Keys generated successfully for ${user.name}`);
          } else {
            const errorData = await response.json();
            console.error(`Failed to generate keys for ${user.name}:`, errorData);
          }
        } catch (error) {
          console.error(`Error generating keys for ${user.name}:`, error);
        }
      }
      
      // Refresh the user list
      await fetchUsers();
      alert(`Successfully generated signatures for ${usersWithoutKeys.length} users!`);
      
    } catch (error) {
      console.error('Error generating all signatures:', error);
      alert(`Error generating all signatures: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setGeneratingAllSignatures(false);
    }
  };

  const resetUserKeys = async (userId: number) => {
    try {
      setResettingUserKeys(userId);
      console.log('Resetting keys for user:', userId);
      
      // First, clear the existing keys by calling the reset endpoint
      const resetResponse = await fetch('/api/digital-signatures/reset-user-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      if (resetResponse.ok) {
        console.log('Keys reset successfully for user:', userId);
        
        // Then generate new keys
        const generateResponse = await fetch('/api/digital-signatures/generate-keys', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        });

        if (generateResponse.ok) {
          console.log('New keys generated successfully for user:', userId);
          alert('Keys reset and regenerated successfully!');
          await fetchUsers(); // Refresh the list
        } else {
          const errorData = await generateResponse.json();
          console.error('Generate keys error response:', errorData);
          alert(`Error generating new keys: ${errorData.error || 'Unknown error'}`);
        }
      } else {
        const errorData = await resetResponse.json();
        console.error('Reset keys error response:', errorData);
        alert(`Error resetting keys: ${errorData.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error resetting user keys:', error);
      alert(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setResettingUserKeys(null);
    }
  };

  const getStatusBadge = (user: User) => {
    if (user.public_key && user.certificate && user.certificate_valid_until) {
      const isValid = new Date(user.certificate_valid_until) > new Date();
      return isValid ? (
        <Badge variant="default" className="bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Keys Generated
        </Badge>
      ) : (
        <Badge variant="destructive">
          <XCircle className="w-3 h-3 mr-1" />
          Expired
        </Badge>
      );
    }
    return (
      <Badge variant="secondary">
        <Key className="w-3 h-3 mr-1" />
        No Keys
      </Badge>
    );
  };

  const filteredUsers = users.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div>Loading digital signatures...</div>;
  }

  if (error) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Digital Signatures Management
            </CardTitle>
            <CardDescription>
              Manage cryptographic keys and certificates for all users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-red-600 p-4 border border-red-200 rounded-lg">
              <strong>Error:</strong> {error}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Digital Signatures Management
            </CardTitle>
            <CardDescription>
              Manage cryptographic keys and certificates for all users
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-gray-600 p-4 border border-gray-200 rounded-lg">
              No users found. Please check if the users API is working correctly.
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Digital Signatures Management
              </CardTitle>
              <CardDescription>
                Manage cryptographic keys and certificates for all users
              </CardDescription>
            </div>
            {user.role === 'Administrator' && (
              <div className="flex gap-2">
                <Button
                  variant="destructive"
                  onClick={resetAllSignatures}
                  disabled={resettingSignatures}
                  className="flex items-center gap-2"
                >
                  {resettingSignatures ? (
                    <>
                      <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Resetting...
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-4 h-4" />
                      Reset All Signatures
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={generateAllSignatures}
                  disabled={generatingAllSignatures}
                  className="flex items-center gap-2"
                >
                  {generatingAllSignatures ? (
                    <>
                      <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Key className="w-4 h-4 mr-1" />
                      Generate All Signatures
                    </>
                  )}
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search users by name, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            {searchTerm && (
              <Button variant="outline" onClick={() => setSearchTerm('')} size="sm">
                Clear
              </Button>
            )}
          </div>
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-gray-600">
              Showing {filteredUsers.length} of {users.length} users
              {searchTerm && ` matching "${searchTerm}"`}
            </p>
          </div>
          <div className="space-y-4">
            {filteredUsers.length === 0 ? (
              <div className="text-center py-8">
                <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-gray-600">
                  {searchTerm 
                    ? `No users match "${searchTerm}". Try a different search term.`
                    : 'No users available.'
                  }
                </p>
                {searchTerm && (
                  <Button 
                    variant="outline" 
                    onClick={() => setSearchTerm('')} 
                    className="mt-4"
                  >
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              filteredUsers.map((user) => (
                <div key={user.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-4">
                    <div>
                      <h4 className="font-medium">{user.name}</h4>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <p className="text-xs text-gray-500">{user.role}</p>
                    </div>
                    {getStatusBadge(user)}
                  </div>
                  <div className="flex gap-2">
                    {!user.public_key && (
                      <Button
                        size="sm"
                        onClick={() => generateKeys(user.id)}
                        disabled={generatingKeys === user.id}
                      >
                        {generatingKeys === user.id ? (
                          <>
                            <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Generating...
                          </>
                        ) : (
                          <>
                            <Key className="w-4 h-4 mr-1" />
                            Generate Keys
                          </>
                        )}
                      </Button>
                    )}
                    {user.public_key && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewKeys(user.id)}
                      >
                        <Key className="w-4 h-4 mr-1" />
                        View Keys
                      </Button>
                    )}
                    {user.certificate && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => getCertificate(user.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Certificate
                      </Button>
                    )}
                    {user.public_key && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => resetUserKeys(user.id)}
                        disabled={resettingUserKeys === user.id}
                      >
                        {resettingUserKeys === user.id ? (
                          <>
                            <div className="w-4 h-4 mr-1 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Resetting...
                          </>
                        ) : (
                          <>
                            <RotateCcw className="w-4 h-4 mr-1" />
                            Reset Keys
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Certificate Details Dialog */}
      <Dialog open={isCertificateDialogOpen} onOpenChange={setIsCertificateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Digital Certificate</DialogTitle>
            <DialogDescription>
              Certificate for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser?.certificate && (
            <div className="space-y-4">
              <div>
                <Label>Certificate Data</Label>
                <Textarea
                  value={selectedUser.certificate}
                  readOnly
                  className="font-mono text-xs"
                  rows={15}
                />
              </div>
              <div className="text-sm text-gray-600">
                <p><strong>Valid Until:</strong> {selectedUser.certificate_valid_until}</p>
                <p><strong>Status:</strong> {new Date(selectedUser.certificate_valid_until || '') > new Date() ? 'Valid' : 'Expired'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Keys Details Dialog */}
      <Dialog open={isKeysDialogOpen} onOpenChange={setIsKeysDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Generated Keys</DialogTitle>
            <DialogDescription>
              Cryptographic keys for {selectedUser?.name}
            </DialogDescription>
          </DialogHeader>
          {selectedUser?.public_key && (
            <div className="space-y-4">
              <div>
                <Label>Public Key</Label>
                <Textarea
                  value={selectedUser.public_key}
                  readOnly
                  className="font-mono text-xs"
                  rows={8}
                />
              </div>
              <div>
                <Label>Private Key (Keep Secure!)</Label>
                <Textarea
                  value={selectedUser.private_key || 'Private key not available'}
                  readOnly
                  className="font-mono text-xs"
                  rows={8}
                />
              </div>
              <div className="text-sm text-gray-600">
                <p><strong>Certificate Valid Until:</strong> {selectedUser.certificate_valid_until}</p>
                <p><strong>Status:</strong> {new Date(selectedUser.certificate_valid_until || '') > new Date() ? 'Valid' : 'Expired'}</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
} 