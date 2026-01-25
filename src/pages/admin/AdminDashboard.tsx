import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ConfirmDialog } from '@/components/ConfirmDialog';
import { useAdmin, UserProfile } from '@/hooks/useAdmin';
import { useComplaints } from '@/hooks/useComplaints';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { 
  Users, 
  UtensilsCrossed, 
  Heart, 
  Leaf,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  AlertTriangle,
  TrendingUp,
  Loader2,
  Ban,
  Unlock,
  MessageSquare,
  RotateCcw
} from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const AdminDashboard = () => {
  const { 
    profiles, 
    listings, 
    stats,
    analytics, 
    isLoading, 
    updateVerification,
    blockUser,
  } = useAdmin();
  const { complaints, pendingComplaints, updateComplaint } = useComplaints();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    title: string;
    description: string;
    onConfirm: () => void;
    variant?: 'default' | 'destructive';
  }>({ open: false, title: '', description: '', onConfirm: () => {} });
  const [blockReason, setBlockReason] = useState('');
  const [selectedComplaint, setSelectedComplaint] = useState<string | null>(null);
  const [adminNotes, setAdminNotes] = useState('');

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const pendingUsers = profiles.filter(u => u.verification_status === 'pending' && u.role !== 'admin');
  const approvedUsers = profiles.filter(u => u.verification_status === 'approved');

  const handleVerify = (user: UserProfile, status: 'approved' | 'rejected' | 'pending') => {
    const statusText = status === 'approved' ? 'approve' : status === 'rejected' ? 'reject' : 'set to pending';
    setConfirmDialog({
      open: true,
      title: `${status.charAt(0).toUpperCase() + status.slice(1)} User?`,
      description: `Are you sure you want to ${statusText} ${user.org_name || user.name}? This will ${status === 'approved' ? 'grant' : status === 'rejected' ? 'revoke' : 'suspend'} their access to the platform.`,
      variant: status === 'rejected' ? 'destructive' : 'default',
      onConfirm: async () => {
        await updateVerification({ userId: user.user_id, status });
        setConfirmDialog(prev => ({ ...prev, open: false }));
      },
    });
  };

  const handleBlock = (user: UserProfile) => {
    if (user.is_blocked) {
      setConfirmDialog({
        open: true,
        title: 'Unblock User?',
        description: `Are you sure you want to unblock ${user.org_name || user.name}? They will be able to access the platform again.`,
        onConfirm: async () => {
          await blockUser({ userId: user.user_id, blocked: false });
          setConfirmDialog(prev => ({ ...prev, open: false }));
        },
      });
    } else {
      setBlockReason('');
      setConfirmDialog({
        open: true,
        title: 'Block User?',
        description: `Are you sure you want to block ${user.org_name || user.name}? They will not be able to log in.`,
        variant: 'destructive',
        onConfirm: async () => {
          await blockUser({ userId: user.user_id, blocked: true, reason: blockReason });
          setConfirmDialog(prev => ({ ...prev, open: false }));
        },
      });
    }
  };

  // Prepare chart data from real analytics
  const chartData = analytics.map(a => ({
    month: MONTH_NAMES[a.month - 1],
    donations: a.donations_count,
    meals: a.meals_served,
  }));

  // If no real data, generate placeholder showing current activity
  const monthlyData = chartData.length > 0 ? chartData : (() => {
    const currentMonth = new Date().getMonth();
    return MONTH_NAMES.slice(0, currentMonth + 1).map((month, index) => {
      const completedThisMonth = listings.filter(l => {
        if (l.status !== 'completed') return false;
        const date = new Date(l.created_at);
        return date.getMonth() === index;
      });
      return {
        month,
        donations: completedThisMonth.length,
        meals: completedThisMonth.reduce((sum, l) => sum + (l.quantity || 0), 0),
      };
    });
  })();

  const statusData = [
    { name: 'Completed', value: listings.filter(l => l.status === 'completed').length, color: '#22c55e' },
    { name: 'Active', value: listings.filter(l => ['posted', 'requested', 'confirmed'].includes(l.status)).length, color: '#f97316' },
    { name: 'Expired', value: listings.filter(l => l.status === 'expired').length, color: '#94a3b8' },
  ].filter(d => d.value > 0);

  const userDistribution = [
    { name: 'Restaurants', value: stats.totalDonors, color: '#f97316' },
    { name: 'NGOs', value: stats.totalNgos, color: '#22c55e' },
  ].filter(d => d.value > 0);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Admin Dashboard</h1>
          <p className="text-muted-foreground">Platform overview and management</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="complaints">
              Complaints
              {pendingComplaints.length > 0 && (
                <Badge variant="destructive" className="ml-2">{pendingComplaints.length}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Stats */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                icon={UtensilsCrossed} 
                label="Total Donations" 
                value={stats.totalListings}
                delay={0}
              />
              <StatCard 
                icon={Heart} 
                label="Completed" 
                value={stats.completedDonations}
                delay={100}
              />
              <StatCard 
                icon={Users} 
                label="Active Users" 
                value={approvedUsers.length}
                delay={200}
              />
              <StatCard 
                icon={Leaf} 
                label="Pending Requests" 
                value={listings.filter(l => l.status === 'requested').length}
                delay={300}
              />
            </div>

            {/* Charts Row */}
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Monthly Donations Chart */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Monthly Donations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <BarChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 'auto']} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }} 
                      />
                      <Bar dataKey="donations" fill="#f97316" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Distribution Charts */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Platform Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground text-center mb-2">Listing Status</p>
                      {statusData.length > 0 ? (
                        <>
                          <ResponsiveContainer width="100%" height={150}>
                            <PieChart>
                              <Pie
                                data={statusData}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={55}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {statusData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex justify-center gap-3 text-xs">
                            {statusData.map((item) => (
                              <div key={item.name} className="flex items-center gap-1">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                {item.name}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
                          No listings yet
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground text-center mb-2">User Types</p>
                      {userDistribution.length > 0 ? (
                        <>
                          <ResponsiveContainer width="100%" height={150}>
                            <PieChart>
                              <Pie
                                data={userDistribution}
                                cx="50%"
                                cy="50%"
                                innerRadius={35}
                                outerRadius={55}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {userDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                              </Pie>
                              <Tooltip />
                            </PieChart>
                          </ResponsiveContainer>
                          <div className="flex justify-center gap-3 text-xs">
                            {userDistribution.map((item) => (
                              <div key={item.name} className="flex items-center gap-1">
                                <div className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />
                                {item.name}
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="h-[150px] flex items-center justify-center text-muted-foreground text-sm">
                          No users yet
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Pending Verifications */}
            {pendingUsers.length > 0 && (
              <Card className="glass-card border-amber-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-700">
                    <AlertTriangle className="h-5 w-5" />
                    Pending Verifications ({pendingUsers.length})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pendingUsers.slice(0, 5).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                        <div>
                          <p className="font-medium">{user.org_name || user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.name} • {user.email}</p>
                          <Badge variant="outline" className="mt-1 text-xs">{user.role}</Badge>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleVerify(user, 'approved')}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleVerify(user, 'rejected')}
                          >
                            <XCircle className="h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid sm:grid-cols-4 gap-4 mb-6">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{profiles.length}</p>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-100">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{pendingUsers.length}</p>
                    <p className="text-sm text-muted-foreground">Pending</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <ShieldCheck className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{approvedUsers.length}</p>
                    <p className="text-sm text-muted-foreground">Verified</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-red-100">
                    <Ban className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold">{profiles.filter(p => p.is_blocked).length}</p>
                    <p className="text-sm text-muted-foreground">Blocked</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card className="glass-card">
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Organization</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Contact</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Role</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.filter(u => u.role !== 'admin').map((user) => (
                        <tr key={user.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <div>
                              <p className="font-medium">{user.org_name || user.name}</p>
                              <p className="text-sm text-muted-foreground">{user.name}</p>
                            </div>
                          </td>
                          <td className="p-3">
                            <p className="text-sm">{user.email}</p>
                            <p className="text-sm text-muted-foreground">{user.contact}</p>
                          </td>
                          <td className="p-3">
                            <Badge variant="outline">{user.role}</Badge>
                          </td>
                          <td className="p-3">
                            <div className="flex flex-col gap-1">
                              <Badge variant={
                                user.verification_status === 'approved' ? 'default' :
                                user.verification_status === 'rejected' ? 'destructive' : 'secondary'
                              }>
                                {user.verification_status}
                              </Badge>
                              {user.is_blocked && (
                                <Badge variant="destructive" className="text-xs">
                                  <Ban className="h-3 w-3 mr-1" />
                                  Blocked
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-3">
                            <div className="flex gap-2 flex-wrap">
                              {user.verification_status !== 'approved' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleVerify(user, 'approved')}
                                  title="Approve"
                                >
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              {user.verification_status !== 'rejected' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleVerify(user, 'rejected')}
                                  title="Reject"
                                >
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                              )}
                              {user.verification_status !== 'pending' && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleVerify(user, 'pending')}
                                  title="Set to Pending"
                                >
                                  <RotateCcw className="h-4 w-4 text-amber-600" />
                                </Button>
                              )}
                              <Button 
                                size="sm" 
                                variant="ghost"
                                onClick={() => handleBlock(user)}
                                title={user.is_blocked ? 'Unblock' : 'Block'}
                              >
                                {user.is_blocked ? (
                                  <Unlock className="h-4 w-4 text-green-600" />
                                ) : (
                                  <Ban className="h-4 w-4 text-red-600" />
                                )}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Listings Tab */}
          <TabsContent value="listings" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>All Listings ({listings.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Food</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Donor</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Quantity</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Created</th>
                      </tr>
                    </thead>
                    <tbody>
                      {listings.map((listing) => (
                        <tr key={listing.id} className="border-b hover:bg-muted/50">
                          <td className="p-3">
                            <div className="flex items-center gap-3">
                              <img 
                                src={listing.photos?.[0] || 'https://images.unsplash.com/photo-1547592180-85f173990554?w=400&h=300&fit=crop'} 
                                alt={listing.food_category}
                                className="h-10 w-10 rounded-lg object-cover"
                              />
                              <span className="font-medium">{listing.food_category}</span>
                            </div>
                          </td>
                          <td className="p-3 text-sm">{listing.donor_profile?.org_name || 'Unknown'}</td>
                          <td className="p-3 text-sm">{listing.quantity} {listing.quantity_unit}</td>
                          <td className="p-3">
                            <StatusBadge status={listing.status} />
                          </td>
                          <td className="p-3 text-sm text-muted-foreground">
                            {format(new Date(listing.created_at), 'MMM d, h:mm a')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Complaints Tab */}
          <TabsContent value="complaints" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Complaints & Reports ({complaints.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {complaints.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No complaints submitted yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {complaints.map((complaint) => (
                      <div key={complaint.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-start justify-between gap-4 mb-3">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge variant="outline">{complaint.type.replace(/_/g, ' ')}</Badge>
                              <Badge variant={
                                complaint.status === 'resolved' ? 'default' :
                                complaint.status === 'dismissed' ? 'secondary' :
                                complaint.status === 'reviewing' ? 'outline' : 'destructive'
                              }>
                                {complaint.status}
                              </Badge>
                            </div>
                            <p className="text-sm">
                              <strong>{complaint.from_profile?.org_name || complaint.from_profile?.name}</strong>
                              {' reported '}
                              <strong>{complaint.to_profile?.org_name || complaint.to_profile?.name}</strong>
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(complaint.created_at), 'MMM d, yyyy h:mm a')}
                            </p>
                          </div>
                        </div>
                        <p className="text-sm mb-3">{complaint.description}</p>
                        
                        {complaint.admin_notes && (
                          <div className="p-2 rounded bg-muted/50 mb-3">
                            <p className="text-xs font-medium text-muted-foreground">Admin Notes:</p>
                            <p className="text-sm">{complaint.admin_notes}</p>
                          </div>
                        )}

                        {selectedComplaint === complaint.id ? (
                          <div className="space-y-3 p-3 rounded-lg bg-muted/30">
                            <Textarea
                              placeholder="Add admin notes..."
                              value={adminNotes}
                              onChange={(e) => setAdminNotes(e.target.value)}
                              rows={2}
                            />
                            <div className="flex gap-2 flex-wrap">
                              <Button
                                size="sm"
                                onClick={async () => {
                                  await updateComplaint({ 
                                    complaintId: complaint.id, 
                                    status: 'reviewing',
                                    admin_notes: adminNotes 
                                  });
                                  setSelectedComplaint(null);
                                  setAdminNotes('');
                                }}
                              >
                                Mark Reviewing
                              </Button>
                              <Button
                                size="sm"
                                variant="default"
                                onClick={async () => {
                                  await updateComplaint({ 
                                    complaintId: complaint.id, 
                                    status: 'resolved',
                                    admin_notes: adminNotes 
                                  });
                                  setSelectedComplaint(null);
                                  setAdminNotes('');
                                }}
                              >
                                Resolve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={async () => {
                                  await updateComplaint({ 
                                    complaintId: complaint.id, 
                                    status: 'dismissed',
                                    admin_notes: adminNotes 
                                  });
                                  setSelectedComplaint(null);
                                  setAdminNotes('');
                                }}
                              >
                                Dismiss
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                  setSelectedComplaint(null);
                                  setAdminNotes('');
                                }}
                              >
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedComplaint(complaint.id);
                              setAdminNotes(complaint.admin_notes || '');
                            }}
                          >
                            Manage
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Meals Served Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                {monthlyData.some(d => d.meals > 0) ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={monthlyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                      <YAxis stroke="#9ca3af" fontSize={12} domain={[0, 'auto']} allowDecimals={false} />
                      <Tooltip 
                        contentStyle={{ 
                          borderRadius: '8px', 
                          border: '1px solid #e5e7eb',
                          boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="meals" 
                        stroke="#22c55e" 
                        strokeWidth={3}
                        dot={{ fill: '#22c55e', strokeWidth: 2 }}
                        connectNulls={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    <div className="text-center">
                      <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No meal data available yet</p>
                      <p className="text-sm">Complete donations to see analytics</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <ConfirmDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog(prev => ({ ...prev, open }))}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={confirmDialog.onConfirm}
        variant={confirmDialog.variant}
      />
    </Layout>
  );
};

export default AdminDashboard;
