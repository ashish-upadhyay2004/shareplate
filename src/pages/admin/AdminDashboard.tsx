import { useState } from 'react';
import { Layout } from '@/components/Layout';
import { StatCard } from '@/components/StatCard';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdmin } from '@/hooks/useAdmin';
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
  Loader2
} from 'lucide-react';

const AdminDashboard = () => {
  const { 
    profiles, 
    listings, 
    stats, 
    isLoading, 
    updateVerification 
  } = useAdmin();
  const [activeTab, setActiveTab] = useState('overview');

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  const pendingUsers = profiles.filter(u => u.verification_status === 'pending');
  const approvedUsers = profiles.filter(u => u.verification_status === 'approved');

  const handleVerify = async (userId: string, status: 'approved' | 'rejected') => {
    await updateVerification({ userId, status });
  };

  // Chart data
  const monthlyData = [
    { month: 'Jan', donations: 120, meals: 1800 },
    { month: 'Feb', donations: 145, meals: 2100 },
    { month: 'Mar', donations: 180, meals: 2700 },
    { month: 'Apr', donations: 210, meals: 3150 },
    { month: 'May', donations: 195, meals: 2925 },
    { month: 'Jun', donations: 240, meals: 3600 },
  ];

  const statusData = [
    { name: 'Completed', value: listings.filter(l => l.status === 'completed').length || 45, color: '#22c55e' },
    { name: 'Active', value: listings.filter(l => ['posted', 'requested', 'confirmed'].includes(l.status)).length || 12, color: '#f97316' },
    { name: 'Expired', value: listings.filter(l => l.status === 'expired').length || 8, color: '#94a3b8' },
  ];

  const userDistribution = [
    { name: 'Restaurants', value: stats.totalDonors, color: '#f97316' },
    { name: 'NGOs', value: stats.totalNgos, color: '#22c55e' },
  ];

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
                trend={{ value: 18, isPositive: true }}
                delay={0}
              />
              <StatCard 
                icon={Heart} 
                label="Completed" 
                value={listings.filter(l => l.status === 'completed').length}
                trend={{ value: 23, isPositive: true }}
                delay={100}
              />
              <StatCard 
                icon={Users} 
                label="Active Users" 
                value={approvedUsers.length}
                trend={{ value: 12, isPositive: true }}
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
                      <YAxis stroke="#9ca3af" fontSize={12} />
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
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground text-center mb-2">User Types</p>
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
                    {pendingUsers.slice(0, 3).map((user) => (
                      <div key={user.id} className="flex items-center justify-between p-3 rounded-lg bg-amber-50">
                        <div>
                          <p className="font-medium">{user.org_name || user.name}</p>
                          <p className="text-sm text-muted-foreground">{user.name} • {user.email}</p>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            onClick={() => handleVerify(user.user_id, 'approved')}
                          >
                            <CheckCircle2 className="h-4 w-4" />
                            Approve
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleVerify(user.user_id, 'rejected')}
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
            <div className="grid sm:grid-cols-3 gap-4 mb-6">
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
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Status</th>
                        <th className="text-left p-3 text-sm font-medium text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {profiles.map((user) => (
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
                            <Badge variant={
                              user.verification_status === 'approved' ? 'default' :
                              user.verification_status === 'rejected' ? 'destructive' : 'secondary'
                            }>
                              {user.verification_status}
                            </Badge>
                          </td>
                          <td className="p-3">
                            {user.verification_status === 'pending' && (
                              <div className="flex gap-2">
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleVerify(user.user_id, 'approved')}
                                >
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                </Button>
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  onClick={() => handleVerify(user.user_id, 'rejected')}
                                >
                                  <XCircle className="h-4 w-4 text-red-600" />
                                </Button>
                              </div>
                            )}
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
                <CardTitle>All Listings</CardTitle>
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

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <Card className="glass-card">
              <CardHeader>
                <CardTitle>Meals Served Over Time</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" stroke="#9ca3af" fontSize={12} />
                    <YAxis stroke="#9ca3af" fontSize={12} />
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
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
