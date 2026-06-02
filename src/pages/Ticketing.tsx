import React, { useState, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  Calendar, 
  Download,
  Plus,
  MoreHorizontal,
  Search,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  PieChart as PieChartIcon,
  Activity,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Upload,
  X,
  Tag,
  Wallet
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

const salesData = [
  { time: '10:00', sales: 120, capacity: 500 },
  { time: '11:00', sales: 180, capacity: 500 },
  { time: '12:00', sales: 250, capacity: 500 },
  { time: '13:00', sales: 310, capacity: 500 },
  { time: '14:00', sales: 380, capacity: 500 },
  { time: '15:00', sales: 420, capacity: 500 },
  { time: '16:00', sales: 480, capacity: 500 },
];

const genderData = [
  { name: 'Male', value: 60, color: '#4F46E5' },
  { name: 'Female', value: 35, color: '#EC4899' },
  { name: 'Other', value: 5, color: '#10B981' },
];

const ticketTiers = [
  { id: 1, name: 'Early Bird', capacity: 100, sold: 100, status: 'sold_out' },
  { id: 2, name: 'General Admission', capacity: 300, sold: 245, status: 'active' },
  { id: 3, name: 'VIP Pass', capacity: 50, sold: 32, status: 'active' },
  { id: 4, name: 'Backstage Access', capacity: 10, sold: 2, status: 'active' },
];

const guestList = [
  { id: 1, name: 'Alex Rivera', type: 'Influencer', email: 'alex@example.com', status: 'Confirmed' },
  { id: 2, name: 'Sarah Chen', type: 'VIP', email: 'sarah@example.com', status: 'Pending' },
  { id: 3, name: 'Mike Johnson', type: 'Complimentary', email: 'mike@example.com', status: 'Confirmed' },
  { id: 4, name: 'Emma Davis', type: 'Influencer', email: 'emma@example.com', status: 'Confirmed' },
];

export default function Ticketing() {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Modals state
  const [isTierModalOpen, setIsTierModalOpen] = useState(false);
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredGuests = guestList.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    g.email.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a: any, b: any) => {
    let aValue = a[sortField];
    let bValue = b[sortField];
    
    if (typeof aValue === 'string') aValue = aValue.toLowerCase();
    if (typeof bValue === 'string') bValue = bValue.toLowerCase();

    if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
    if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
    return 0;
  });

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight uppercase">Ticketing & <span className="text-primary neon-text">Guest List</span></h2>
          <p className="text-[10px] font-black text-muted-foreground mt-1 uppercase tracking-[0.2em]">Manage ticket sales, pricing tiers, and guest lists</p>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Data
          </button>
          <button 
            onClick={() => setIsTierModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-[10px] font-black uppercase tracking-widest text-white hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            <Plus className="w-4 h-4" />
            Add Ticket Type
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-4 overflow-x-auto scrollbar-hide">
        {[
          { id: 'dashboard', label: 'Dashboard', icon: Activity },
          { id: 'tiers', label: 'Ticket Types', icon: CreditCard },
          { id: 'guestlist', label: 'Guest List', icon: Users },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap",
              activeTab === tab.id 
                ? "bg-primary/20 text-primary border border-primary/30 shadow-[0_0_20px_rgba(255,45,154,0.1)]" 
                : "text-muted-foreground hover:text-white hover:bg-white/5"
            )}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Sales Graph */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 rounded-2xl">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-sm font-black text-white uppercase tracking-wider">Ticket Sales Analysis</h3>
                  <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em] mt-1">Sold tickets vs total capacity</p>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary shadow-[0_0_10px_rgba(255,45,154,0.5)]"></div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Sold</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-white/20"></div>
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Capacity</span>
                  </div>
                </div>
              </div>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <AreaChart data={salesData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#FF2D9A" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#FF2D9A" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="time" stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={12} tickLine={false} axisLine={false} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#12121A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                    <Area type="monotone" dataKey="capacity" stroke="rgba(255,255,255,0.2)" strokeWidth={2} fill="transparent" strokeDasharray="5 5" />
                    <Area type="monotone" dataKey="sales" stroke="#FF2D9A" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="glass-card p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10">
                    <Activity className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                    <ArrowUpRight className="w-3 h-3" />
                    24.5%
                  </div>
                </div>
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Total Tickets Sold</h3>
                <div className="text-2xl font-black text-white tracking-tight mt-1 leading-none">12,450</div>
              </div>
              <div className="glass-card p-5 rounded-2xl">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-2.5 rounded-xl bg-purple-500/10">
                    <TrendingUp className="w-5 h-5 text-purple-400" />
                  </div>
                  <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full bg-emerald-500/10 text-emerald-400">
                    <ArrowUpRight className="w-3 h-3" />
                    12.2%
                  </div>
                </div>
                <h3 className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">Conversion Rate</h3>
                <div className="text-2xl font-black text-white tracking-tight mt-1 leading-none">8.4%</div>
              </div>
            </div>
          </div>

          {/* Right: Stats */}
          <div className="space-y-6">
            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-6">Guest Stats</h3>
              <div className="h-[200px] relative">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#12121A', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '12px' }}
                      itemStyle={{ color: '#fff' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                  <span className="text-2xl font-bold text-white">60%</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Male</span>
                </div>
              </div>
              <div className="mt-4 space-y-3">
                {genderData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-sm text-muted-foreground">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-white">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl">
              <h3 className="text-sm font-black text-white uppercase tracking-wider mb-4">Recent Sales</h3>
              <div className="space-y-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                        <CreditCard className="w-4 h-4 text-muted-foreground" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white">VIP Pass</p>
                        <p className="text-xs text-muted-foreground">2 mins ago</p>
                      </div>
                    </div>
                    <span className="text-sm font-bold text-emerald-400">Purchased</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'tiers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {ticketTiers.map((tier) => (
            <motion.div 
              key={tier.id}
              whileHover={{ y: -5 }}
              className="glass-card p-6 rounded-2xl relative overflow-hidden group"
            >
              {tier.status === 'sold_out' && (
                <div className="absolute top-4 right-4 px-2 py-1 rounded-md bg-red-500/20 text-red-400 text-[10px] font-bold uppercase tracking-wider">
                  Sold Out
                </div>
              )}
              <h3 className="text-lg font-bold text-white mb-4">{tier.name}</h3>
              
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Sold</span>
                    <span className="text-white font-medium">{tier.sold} / {tier.capacity}</span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        "h-full rounded-full",
                        tier.status === 'sold_out' ? "bg-red-400" : "bg-primary"
                      )}
                      style={{ width: `${(tier.sold / tier.capacity) * 100}%` }}
                    ></div>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-white/10 flex gap-2">
                  <button className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-white transition-colors">
                    Edit Tier
                  </button>
                  <button className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {activeTab === 'guestlist' && (
        <div className="glass-card rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-white/10 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search guest list..." 
                className="w-full pl-9 pr-4 py-2 bg-white/5 border border-white/10 rounded-xl text-sm text-white placeholder:text-muted-foreground/30 focus:outline-none focus:border-primary/50 transition-colors"
              />
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input 
                type="file" 
                accept=".csv" 
                className="hidden" 
                ref={fileInputRef}
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    alert(`Uploaded ${e.target.files[0].name}`);
                  }
                }}
              />
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <Upload className="w-4 h-4" />
                Import CSV
              </button>
              <button className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors flex items-center gap-2">
                <Filter className="w-4 h-4" />
                Filter
              </button>
              <button 
                onClick={() => setIsGuestModalOpen(true)}
                className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                Add Guest
              </button>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  <th 
                    className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center gap-2">
                      Name
                      {sortField === 'name' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                    </div>
                  </th>
                  <th 
                    className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('type')}
                  >
                    <div className="flex items-center gap-2">
                      Type
                      {sortField === 'type' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                    </div>
                  </th>
                  <th 
                    className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('email')}
                  >
                    <div className="flex items-center gap-2">
                      Email
                      {sortField === 'email' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                    </div>
                  </th>
                  <th 
                    className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
                    onClick={() => handleSort('status')}
                  >
                    <div className="flex items-center gap-2">
                      Status
                      {sortField === 'status' ? (sortOrder === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />) : <ArrowUpDown className="w-3 h-3 opacity-50" />}
                    </div>
                  </th>
                  <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredGuests.map((guest) => (
                  <tr key={guest.id} className="hover:bg-white/5 transition-colors group">
                    <td className="p-4">
                      <span className="text-sm font-medium text-white">{guest.name}</span>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider",
                        guest.type === 'Influencer' ? "bg-purple-500/10 text-purple-400" :
                        guest.type === 'VIP' ? "bg-amber-500/10 text-amber-400" :
                        "bg-emerald-500/10 text-emerald-400"
                      )}>
                        {guest.type}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-sm text-muted-foreground">{guest.email}</span>
                    </td>
                    <td className="p-4">
                      <span className={cn(
                        "flex items-center gap-1.5 text-sm",
                        guest.status === 'Confirmed' ? "text-emerald-400" : "text-amber-400"
                      )}>
                        <div className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          guest.status === 'Confirmed' ? "bg-emerald-400" : "bg-amber-400"
                        )}></div>
                        {guest.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button className="p-2 rounded-lg hover:bg-white/10 text-muted-foreground hover:text-white transition-colors">
                        <MoreHorizontal className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Ticket Tier Modal */}
      {isTierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-lg rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Add <span className="text-primary neon-text">Ticket Tier</span></h3>
              <button 
                onClick={() => setIsTierModalOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest tracking-[0.2em]">Ticket Name</label>
                <input type="text" placeholder="e.g. Early Bird, VIP" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 placeholder:text-white/20" />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest tracking-[0.2em]">Quantity</label>
                  <input type="number" placeholder="100" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 placeholder:text-white/20" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest tracking-[0.2em]">Sales Start</label>
                  <input type="datetime-local" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50 [color-scheme:dark]" />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest tracking-[0.2em]">Sales End</label>
                  <input type="datetime-local" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50 [color-scheme:dark]" />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-muted-foreground">Add-ons (Optional)</label>
                <div className="flex items-center gap-2">
                  <input type="text" placeholder="e.g. Backstage Pass" className="flex-1 px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50" />
                  <button className="p-2.5 rounded-xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-colors">
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsTierModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setIsTierModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-sm font-bold text-white hover:opacity-90 transition-opacity"
              >
                Save Tier
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Guest List Modal */}
      {isGuestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card w-full max-w-md rounded-2xl border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-white/10 flex items-center justify-between shrink-0">
              <h3 className="text-xl font-black text-white uppercase tracking-tight">Add <span className="text-primary neon-text">Guest</span></h3>
              <button 
                onClick={() => setIsGuestModalOpen(false)}
                className="p-2 rounded-xl hover:bg-white/10 text-muted-foreground hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 overflow-y-auto">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest tracking-[0.2em]">Guest Name</label>
                <input type="text" placeholder="John Doe" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 placeholder:text-white/20" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest tracking-[0.2em]">Email Address</label>
                <input type="email" placeholder="john@example.com" className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary/50 placeholder:text-white/20" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest tracking-[0.2em]">Guest Type</label>
                <select className="w-full px-4 py-2.5 bg-white/5 border border-white/10 rounded-xl text-white focus:outline-none focus:border-primary/50 appearance-none">
                  <option value="VIP">VIP</option>
                  <option value="Influencer">Influencer</option>
                  <option value="Complimentary">Complimentary</option>
                  <option value="Press">Press</option>
                </select>
              </div>
              <div className="space-y-2 pt-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-white/10 bg-white/5 text-primary focus:ring-primary/50" />
                  <span className="text-sm font-medium text-white flex items-center gap-2">
                    <Tag className="w-4 h-4 text-purple-400" />
                    Tag as Influencer
                  </span>
                </label>
                <p className="text-xs text-muted-foreground pl-6">This will track their promo code usage and reach.</p>
              </div>
            </div>
            <div className="p-6 border-t border-white/10 flex justify-end gap-3 shrink-0">
              <button 
                onClick={() => setIsGuestModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={() => setIsGuestModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-primary to-secondary text-[10px] font-black uppercase tracking-widest text-white hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                Add Guest
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
