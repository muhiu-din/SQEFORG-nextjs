
import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { User } from '@/api/entities';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, Trash2, User as UserIcon } from 'lucide-react';
import EditMockDialog from '@/components/admin/EditMockDialog'; // Assuming this is for user edits now
import AddCreditsDialog from '@/components/admin/AddCreditsDialog';
import EmailAllUsersDialog from '@/components/admin/EmailAllUsersDialog'; // Import the new component

export default function UserManagement() {
    const queryClient = useQueryClient();

    const { data: users, isLoading, error } = useQuery({
        queryKey: ['users'],
        queryFn: () => User.list()
    });

    const updateUserMutation = useMutation({
        mutationFn: ({ id, data }) => User.update(id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['users'] });
        },
    });

    if (isLoading) {
        return <div className="p-10 text-center"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>;
    }

    if (error) {
        return <div className="p-10 text-center text-red-500">Error loading users.</div>;
    }

    return (
        <div className="p-10">
            <h1 className="text-3xl font-bold mb-6">User Management</h1>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>All Users</CardTitle>
                    <EmailAllUsersDialog />
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Full Name</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Role</TableHead>
                                <TableHead>Subscription</TableHead>
                                <TableHead>Mock Credits</TableHead>
                                <TableHead>AI Credits</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {users.map((user) => (
                                <TableRow key={user.id}>
                                    <TableCell>{user.full_name}</TableCell>
                                    <TableCell>{user.email}</TableCell>
                                    <TableCell>
                                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                                            {user.role}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline">{user.subscription_tier || 'starter'}</Badge>
                                    </TableCell>
                                    <TableCell>{user.mock_exam_credits || 0}</TableCell>
                                    <TableCell>{user.ai_credits || 0}</TableCell>
                                    <TableCell className="flex gap-2">
                                        <AddCreditsDialog user={user} onSuccess={() => queryClient.invalidateQueries(['users'])} />
                                        {/* Placeholder for other actions */}
                                        <Button variant="ghost" size="icon" disabled>
                                            <UserIcon className="w-4 h-4" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
