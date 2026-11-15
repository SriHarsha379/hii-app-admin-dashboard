import re

with open("src/pages/PollsContests.tsx", "r") as f:
    src = f.read()

old_vote_data = """const voteData = [
  { name: 'Option A', votes: 420, color: '#4F46E5' },
  { name: 'Option B', votes: 310, color: '#9333EA' },
  { name: 'Option C', votes: 150, color: '#EC4899' },
  { name: 'Option D', votes: 80, color: '#F59E0B' },
];"""
if old_vote_data in src:
    src = src.replace(old_vote_data, "")
    print("fix-01a done: hardcoded voteData removed")
else:
    match = re.search(r'const voteData = \[[\s\S]*?\];', src)
    if match:
        src = src[:match.start()] + src[match.end():]
        print("fix-01a done: hardcoded voteData removed (regex)")
    else:
        print("fix-01a SKIP: voteData not found")

old_chart_section = re.search(r'<div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">\s*<h3[^>]*>Vote Distribution</h3>[\s\S]*?</div>\s*</div>\s*</div>', src)
if old_chart_section:
    real_chart = (
        '<div className="glass-card p-6 rounded-2xl border border-white/10 space-y-6">\n'
        '                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Vote Distribution</h3>\n'
        '                <div className="h-[250px] w-full">\n'
        '                  {sortedPolls.length === 0 ? (\n'
        '                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No poll data yet</div>\n'
        '                  ) : (\n'
        '                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>\n'
        '                      <BarChart data={sortedPolls.slice(0,6).map((p: any) => ({ name: p.title?.slice(0,15) || "Poll", votes: p.votes ?? 0 }))} layout="vertical">\n'
        '                        <XAxis type="number" hide />\n'
        '                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 10, fontWeight: 600 }} width={120} />\n'
        '                        <Tooltip cursor={{ fill: "rgba(255,255,255,0.05)" }} contentStyle={{ backgroundColor: "#111118", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "12px", fontSize: "12px" }} />\n'
        '                        <Bar dataKey="votes" radius={[0, 4, 4, 0]} barSize={20} fill="#4F46E5" />\n'
        '                      </BarChart>\n'
        '                    </ResponsiveContainer>\n'
        '                  )}\n'
        '                </div>\n'
        '              </div>'
    )
    src = src[:old_chart_section.start()] + real_chart + src[old_chart_section.end():]
    print("fix-01b done: Vote Distribution chart now uses real poll data")
else:
    print("fix-01b SKIP: chart section not found")

src = re.sub(r'poll\.id\b', 'poll._id || poll.id', src)
src = re.sub(r'contest\.id\b', 'contest._id || contest.id', src)
src = re.sub(r'selectedContest\?\.id\b', 'selectedContest?._id || selectedContest?.id', src)
src = re.sub(r"queryKey: \['contest_participants', selectedContest\?\.id\]", "queryKey: ['contest_participants', selectedContest?._id || selectedContest?.id]", src)
print("fix-02 done: poll.id/contest.id -> _id fallbacks added")

with open("src/pages/PollsContests.tsx", "w") as f:
    f.write(src)


with open("src/pages/PollsContests.tsx", "r") as f:
    src = f.read()

cities_query = (
    "\n  const { data: citiesForPolls } = useQuery({\n"
    "    queryKey: ['cities'],\n"
    "    queryFn: async () => {\n"
    "      const res = await fetch(`${API_BASE}/city/get_all_cities`, { headers: { Authorization: `Bearer ${token}` } });\n"
    "      const json = await res.json();\n"
    "      return json.data ?? [];\n"
    "    },\n"
    "  });\n"
    "  const cityOptions = [\n"
    "    { label: 'All Cities', value: 'ALL' },\n"
    "    ...((Array.isArray(citiesForPolls) ? citiesForPolls : []).slice().sort((a: any, b: any) => (a.city_name || '').localeCompare(b.city_name || '')).map((c: any) => ({ label: c.city_name, value: c.city_name }))),\n"
    "  ];\n"
    "  const citySelectOptions = [\n"
    "    { value: 'ALL', label: 'All Cities' },\n"
    "    ...((Array.isArray(citiesForPolls) ? citiesForPolls : []).slice().sort((a: any, b: any) => (a.city_name || '').localeCompare(b.city_name || '')).map((c: any) => ({ value: c.city_name, label: c.city_name }))),\n"
    "  ];\n"
)

old_state = "  const [openPollMenuId, setOpenPollMenuId] = useState<string | null>(null);"
if old_state in src:
    src = src.replace(old_state, cities_query + "  " + old_state, 1)
    print("fix-04a done: city query added to PollsContests.tsx")
else:
    print("fix-04a SKIP: anchor not found")

hardcoded_filter = (
    "              options={[\n"
    "                            { label: 'All Cities', value: 'ALL' },\n"
    "                            { label: 'Mumbai', value: 'Mumbai' },\n"
    "                            { label: 'Delhi', value: 'Delhi' },\n"
    "                            { label: 'Bangalore', value: 'Bangalore' },\n"
    "                            { label: 'Goa', value: 'Goa' },\n"
    "                          ]}"
)
count_replaced = src.count(hardcoded_filter)
src = src.replace(hardcoded_filter, "              options={cityOptions}")
if count_replaced > 0:
    print(f"fix-04b done: {count_replaced} hardcoded city filter(s) replaced with dynamic cityOptions")
else:
    hc2 = re.findall(r'options=\{\[\s*\{ label: .All Cities., value: .ALL. \},\s*\{ label: .Mumbai..*?\]\}', src, re.DOTALL)
    for m in re.finditer(r'options=\{\[\s*\{ label: .All Cities., value: .ALL. \},\s*\{ label: .Mumbai..*?\]\}', src, re.DOTALL):
        src = src[:m.start()] + "options={cityOptions}" + src[m.end():]
        break
    print("fix-04b done: hardcoded city filter replaced (regex)")

for old_sel, label in [
    ('<option value="ALL">All Cities</option>\n                      <option value="Mumbai">Mumbai</option>\n                      <option value="Delhi">Delhi</option>\n                      <option value="Bangalore">Bangalore</option>\n                      <option value="Goa">Goa</option>', "poll modal"),
]:
    if old_sel in src:
        src = src.replace(old_sel, '{citySelectOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}', 1)
        print(f"fix-04c done: hardcoded city <select> in {label} replaced")

old_contest_sel = '<option value="ALL">All Cities</option>\n                      <option value="Mumbai">Mumbai</option>\n                      <option value="Delhi">Delhi</option>\n                      <option value="Bangalore">Bangalore</option>\n                      <option value="Goa">Goa</option>'
count_sel = src.count(old_contest_sel)
src = src.replace(old_contest_sel, '{citySelectOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}')
if count_sel > 0:
    print(f"fix-04d done: {count_sel} hardcoded city <select>(s) replaced")

old_confirm_poll = "onClick={() => { if (confirm(`Remove \"${poll.title}\"?`)) deletePollMutation.mutate(poll._id || poll.id); }}"
new_confirm_poll = "onClick={() => setDeletePollTarget(poll)}"
if old_confirm_poll in src:
    src = src.replace(old_confirm_poll, new_confirm_poll, 1)
    print("fix-09a done: poll delete now uses state modal")
else:
    m = re.search(r'onClick=\{\(\) => \{ if \(confirm\(`Remove.*?poll.*?\)\) deletePollMutation\.mutate\(.*?\); \}\}', src)
    if m:
        src = src[:m.start()] + "onClick={() => setDeletePollTarget(poll)}" + src[m.end():]
        print("fix-09a done: poll delete wired to modal (regex)")
    else:
        print("fix-09a SKIP: poll confirm() pattern not found")

old_confirm_contest = 'onClick={() => { if (confirm(`Remove "${contest.title}"?`)) deleteContestMutation.mutate(contest._id || contest.id); }}'
new_confirm_contest = "onClick={() => setDeleteContestTarget(contest)}"
if old_confirm_contest in src:
    src = src.replace(old_confirm_contest, new_confirm_contest, 1)
    print("fix-09b done: contest delete now uses state modal")
else:
    m2 = re.search(r'onClick=\{\(\) => \{ if \(confirm\(`Remove.*?contest.*?\)\) deleteContestMutation\.mutate\(.*?\); \}\}', src)
    if m2:
        src = src[:m2.start()] + "onClick={() => setDeleteContestTarget(contest)}" + src[m2.end():]
        print("fix-09b done: contest delete wired to modal (regex)")
    else:
        print("fix-09b SKIP: contest confirm() pattern not found")

old_menu_state = "  const [openPollMenuId, setOpenPollMenuId] = useState<string | null>(null);\n  const [openContestMenuId, setOpenContestMenuId] = useState<string | null>(null);"
new_menu_state = (
    "  const [openPollMenuId, setOpenPollMenuId]         = useState<string | null>(null);\n"
    "  const [openContestMenuId, setOpenContestMenuId]   = useState<string | null>(null);\n"
    "  const [deletePollTarget, setDeletePollTarget]     = useState<any>(null);\n"
    "  const [deleteContestTarget, setDeleteContestTarget] = useState<any>(null);"
)
if old_menu_state in src:
    src = src.replace(old_menu_state, new_menu_state, 1)
else:
    m3 = re.search(r'const \[openPollMenuId.*?\n.*?openContestMenuId.*?;', src)
    if m3:
        src = src[:m3.end()] + "\n  const [deletePollTarget, setDeletePollTarget]     = useState<any>(null);\n  const [deleteContestTarget, setDeleteContestTarget] = useState<any>(null);" + src[m3.end():]
print("fix-09c done: delete modal state added to PollsContests.tsx")

closing = src.rfind("    </div>\n  );\n}")
if closing != -1:
    dialogs = (
        "\n\n      {deletePollTarget && (\n"
        "        <div className=\"fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md\">\n"
        "          <div className=\"glass-card w-full max-w-md rounded-3xl border border-red-500/20 p-8 space-y-6\">\n"
        "            <div className=\"flex items-center gap-4\">\n"
        "              <div className=\"w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400\"><AlertCircle className=\"w-6 h-6\" /></div>\n"
        "              <div><h3 className=\"text-base font-black text-white uppercase\">Remove Poll</h3><p className=\"text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5\">Cannot be undone</p></div>\n"
        "            </div>\n"
        "            <p className=\"text-sm text-white/60\">Remove <span className=\"text-white font-bold\">\"{deletePollTarget.title}\"</span>?</p>\n"
        "            <div className=\"flex gap-3\">\n"
        "              <button onClick={() => setDeletePollTarget(null)} className=\"flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase text-white/60 hover:text-white transition-all\">Cancel</button>\n"
        "              <button onClick={() => { deletePollMutation.mutate(deletePollTarget._id || deletePollTarget.id); setDeletePollTarget(null); }} disabled={deletePollMutation.isPending} className=\"flex-1 py-3 rounded-2xl bg-red-500/20 border border-red-500/30 text-[11px] font-black uppercase text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50\">\n"
        "                {deletePollMutation.isPending ? <Loader2 className=\"w-4 h-4 animate-spin\" /> : <Trash2 className=\"w-4 h-4\" />} Remove\n"
        "              </button>\n"
        "            </div>\n"
        "          </div>\n"
        "        </div>\n"
        "      )}\n"
        "\n"
        "      {deleteContestTarget && (\n"
        "        <div className=\"fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md\">\n"
        "          <div className=\"glass-card w-full max-w-md rounded-3xl border border-red-500/20 p-8 space-y-6\">\n"
        "            <div className=\"flex items-center gap-4\">\n"
        "              <div className=\"w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400\"><AlertCircle className=\"w-6 h-6\" /></div>\n"
        "              <div><h3 className=\"text-base font-black text-white uppercase\">Remove Contest</h3><p className=\"text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5\">Cannot be undone</p></div>\n"
        "            </div>\n"
        "            <p className=\"text-sm text-white/60\">Remove <span className=\"text-white font-bold\">\"{deleteContestTarget.title}\"</span>?</p>\n"
        "            <div className=\"flex gap-3\">\n"
        "              <button onClick={() => setDeleteContestTarget(null)} className=\"flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase text-white/60 hover:text-white transition-all\">Cancel</button>\n"
        "              <button onClick={() => { deleteContestMutation.mutate(deleteContestTarget._id || deleteContestTarget.id); setDeleteContestTarget(null); }} disabled={deleteContestMutation.isPending} className=\"flex-1 py-3 rounded-2xl bg-red-500/20 border border-red-500/30 text-[11px] font-black uppercase text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50\">\n"
        "                {deleteContestMutation.isPending ? <Loader2 className=\"w-4 h-4 animate-spin\" /> : <Trash2 className=\"w-4 h-4\" />} Remove\n"
        "              </button>\n"
        "            </div>\n"
        "          </div>\n"
        "        </div>\n"
        "      )}\n"
    )
    src = src[:closing] + dialogs + src[closing:]
    print("fix-09d done: poll/contest delete modals injected")

with open("src/pages/PollsContests.tsx", "w") as f:
    f.write(src)


with open("src/pages/Analytics.tsx", "r") as f:
    src = f.read()

old_dl_btn = '          <button className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-muted-foreground hover:text-white transition-all">\n            <Download className="w-4 h-4" />\n          </button>'
new_dl_btn = (
    '          <button\n'
    '            onClick={() => {\n'
    "              const headers = ['Metric', 'Value'];\n"
    '              const rows = [\n'
    "                ['Total Users', String(totalUsers)],\n"
    "                ['Total Events', String(totalEvents)],\n"
    "                ['Total Clubs', String(totalClubs)],\n"
    "                ['Revenue', extendedStats?.revenue != null ? String(extendedStats.revenue) : '—'],\n"
    "                ['Bookings', extendedStats?.bookings != null ? String(extendedStats.bookings) : '—'],\n"
    "                ['Engagement Rate', extendedStats?.engagementRate != null ? extendedStats.engagementRate + '%' : '—'],\n"
    '              ];\n'
    "              const csv = [headers.join(','), ...rows.map(r => r.map(v => `\"${v}\"`).join(','))].join('\\n');\n"
    "              const blob = new Blob([csv], { type: 'text/csv' });\n"
    "              const url = URL.createObjectURL(blob);\n"
    "              const a = document.createElement('a');\n"
    "              a.href = url; a.download = `analytics-${new Date().toISOString().slice(0,10)}.csv`; a.click();\n"
    "              URL.revokeObjectURL(url);\n"
    '            }}\n'
    '            className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-muted-foreground hover:text-white transition-all"\n'
    '          >\n'
    '            <Download className="w-4 h-4" />\n'
    '          </button>'
)
if old_dl_btn in src:
    src = src.replace(old_dl_btn, new_dl_btn, 1)
    with open("src/pages/Analytics.tsx", "w") as f:
        f.write(src)
    print("fix-05 done: Analytics download button now exports CSV")
else:
    m = re.search(r'<button className="p-2\.5 rounded-2xl[^"]*">\s*<Download[^/]*/>\s*</button>', src)
    if m:
        src = src[:m.start()] + new_dl_btn + src[m.end():]
        with open("src/pages/Analytics.tsx", "w") as f:
            f.write(src)
        print("fix-05 done: Analytics download wired (regex)")
    else:
        print("fix-05 SKIP: download button not found in Analytics.tsx")

with open("src/pages/Analytics.tsx", "r") as f:
    src = f.read()

old_24h = "    timeRange === '24h' ? '7d' : timeRange"
new_24h = "    timeRange === '24h' ? '1d' : timeRange"
if old_24h in src:
    src = src.replace(old_24h, new_24h, 1)
old_24h_btn = "              {['24h', '7d', '30d', '90d'].map((range) => ("
new_24h_btn = "              {(['24h', '7d', '30d', '90d'] as const).map((range) => ("
if old_24h_btn in src:
    src = src.replace(old_24h_btn, new_24h_btn, 1)
with open("src/pages/Analytics.tsx", "w") as f:
    f.write(src)
print("fix-10 done: 24h range param corrected in Analytics.tsx")


with open("src/pages/Settings.tsx", "r") as f:
    src = f.read()

old_save = (
    "  const handleSave = () => {\n"
    "    setIsSaving(true);\n"
    "    setTimeout(() => {\n"
    "      setIsSaving(false);\n"
    "      setShowSuccess(true);\n"
    "      setTimeout(() => setShowSuccess(false), 3000);\n"
    "    }, 1000);\n"
    "  };"
)
new_save = (
    "  const handleSave = async () => {\n"
    "    setIsSaving(true);\n"
    "    try {\n"
    "      const updates: any = {};\n"
    "      if (profile.name  !== user?.name)  updates.name  = profile.name;\n"
    "      if (profile.email !== user?.email) updates.email = profile.email;\n"
    "      if (profile.phone) updates.phone = profile.phone;\n"
    "      if (Object.keys(updates).length > 0) {\n"
    "        const res = await fetch(`${API_BASE}/admins/me`, {\n"
    "          method: 'PATCH',\n"
    "          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },\n"
    "          body: JSON.stringify(updates),\n"
    "        });\n"
    "        const json = await res.json().catch(() => ({}));\n"
    "        if (!res.ok) throw new Error(json?.message || 'Failed to save profile');\n"
    "        if (updates.name)  updateUser({ name:  updates.name });\n"
    "        if (updates.email) updateUser({ email: updates.email });\n"
    "      }\n"
    "      if (security.newPassword) {\n"
    "        if (security.newPassword !== security.confirmPassword) throw new Error('Passwords do not match');\n"
    "        const res = await fetch(`${API_BASE}/auth/change_password`, {\n"
    "          method: 'POST',\n"
    "          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },\n"
    "          body: JSON.stringify({ currentPassword: security.currentPassword, newPassword: security.newPassword }),\n"
    "        });\n"
    "        const json = await res.json().catch(() => ({}));\n"
    "        if (!res.ok) throw new Error(json?.message || 'Failed to change password');\n"
    "        setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });\n"
    "      }\n"
    "      setShowSuccess(true);\n"
    "      setTimeout(() => setShowSuccess(false), 3000);\n"
    "    } catch (err: any) {\n"
    "      alert(err.message || 'Failed to save changes');\n"
    "    } finally {\n"
    "      setIsSaving(false);\n"
    "    }\n"
    "  };"
)
if old_save in src:
    src = src.replace(old_save, new_save, 1)
    with open("src/pages/Settings.tsx", "w") as f:
        f.write(src)
    print("fix-03 done: Settings handleSave now calls real API endpoints")
else:
    print("fix-03 SKIP: handleSave anchor not found in Settings.tsx")

with open("src/pages/Settings.tsx", "r") as f:
    src = f.read()

old_city_delete = "onClick={() => { if (confirm('Delete this city?')) deleteCityMutation.mutate(city._id); }}"
new_city_delete = "onClick={() => setDeleteCityTarget(city)}"
if old_city_delete in src:
    src = src.replace(old_city_delete, new_city_delete, 1)
    old_city_state = "  const [newCity, setNewCity] = useState('');"
    new_city_state = "  const [newCity, setNewCity] = useState('');\n  const [deleteCityTarget, setDeleteCityTarget] = useState<any>(null);"
    if old_city_state in src:
        src = src.replace(old_city_state, new_city_state, 1)
    settings_closing = src.rfind("    </div>\n  );\n}")
    if settings_closing != -1:
        city_dialog = (
            "\n\n      {deleteCityTarget && (\n"
            "        <div className=\"fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md\">\n"
            "          <div className=\"glass-card w-full max-w-md rounded-3xl border border-red-500/20 p-8 space-y-6\">\n"
            "            <div className=\"flex items-center gap-4\">\n"
            "              <div className=\"w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400\"><MapPin className=\"w-6 h-6\" /></div>\n"
            "              <div><h3 className=\"text-base font-black text-white uppercase\">Delete City</h3><p className=\"text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5\">Cannot be undone</p></div>\n"
            "            </div>\n"
            "            <p className=\"text-sm text-white/60\">Delete <span className=\"text-white font-bold\">{deleteCityTarget.city_name}</span>? This may affect events and venues linked to this city.</p>\n"
            "            <div className=\"flex gap-3\">\n"
            "              <button onClick={() => setDeleteCityTarget(null)} className=\"flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-[11px] font-black uppercase text-white/60 hover:text-white transition-all\">Cancel</button>\n"
            "              <button onClick={() => { deleteCityMutation.mutate(deleteCityTarget._id); setDeleteCityTarget(null); }} disabled={deleteCityMutation.isPending} className=\"flex-1 py-3 rounded-2xl bg-red-500/20 border border-red-500/30 text-[11px] font-black uppercase text-red-400 hover:bg-red-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-50\">\n"
            "                {deleteCityMutation.isPending ? <Loader2 className=\"w-4 h-4 animate-spin\" /> : <Trash2 className=\"w-4 h-4\" />} Delete\n"
            "              </button>\n"
            "            </div>\n"
            "          </div>\n"
            "        </div>\n"
            "      )}\n"
        )
        src = src[:settings_closing] + city_dialog + src[settings_closing:]
    with open("src/pages/Settings.tsx", "w") as f:
        f.write(src)
    print("fix-06 done: Settings city delete now uses modal")
else:
    print("fix-06 SKIP: city delete confirm() not found in Settings.tsx")

with open("src/pages/Settings.tsx", "r") as f:
    src = f.read()

src = src.replace("key={index}\n                          className=\"group flex", "key={city._id || city.city_name}\n                          className=\"group flex")
with open("src/pages/Settings.tsx", "w") as f:
    f.write(src)
print("fix-07 done: City list key uses _id")


with open("src/pages/Signup.tsx", "r") as f:
    src = f.read()

old_pw_check = (
    "    if (password !== confirmPassword) {\n"
    "      setError('Passwords do not match.');\n"
    "      return;\n"
    "    }"
)
new_pw_check = (
    "    if (password.length < 8) {\n"
    "      setError('Password must be at least 8 characters.');\n"
    "      return;\n"
    "    }\n"
    "    if (password !== confirmPassword) {\n"
    "      setError('Passwords do not match.');\n"
    "      return;\n"
    "    }"
)
if old_pw_check in src:
    src = src.replace(old_pw_check, new_pw_check, 1)
    with open("src/pages/Signup.tsx", "w") as f:
        f.write(src)
    print("fix-08 done: Signup minimum password length check added")
else:
    print("fix-08 SKIP: password check anchor not found in Signup.tsx")

with open("src/pages/Signup.tsx", "r") as f:
    src = f.read()

if "showPassword" not in src:
    src = src.replace(
        "  const [isLoading, setIsLoading] = useState(false);",
        "  const [isLoading, setIsLoading] = useState(false);\n  const [showPw, setShowPw]       = useState(false);\n  const [showConfirmPw, setShowConfirmPw] = useState(false);"
    )
    src = src.replace(
        '                  type="password"\n                  value={password}',
        '                  type={showPw ? "text" : "password"}\n                  value={password}'
    )
    src = src.replace(
        '                  type="password"\n                  value={confirmPassword}',
        '                  type={showConfirmPw ? "text" : "password"}\n                  value={confirmPassword}'
    )
    src = src.replace(
        '                  placeholder="••••••••"\n                  required\n                />\n              </div>\n            </div>\n            <div className="space-y-3">\n              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Confirm</label>',
        '                  placeholder="••••••••"\n                  required\n                />\n                <button type="button" onClick={() => setShowPw(!showPw)} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"><Eye className="w-4 h-4" /></button>\n              </div>\n            </div>\n            <div className="space-y-3">\n              <label className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] ml-1">Confirm</label>'
    )
    src = src.replace(
        '                  placeholder="••••••••"\n                  required\n                />\n              </div>\n            </div>\n            </div>\n\n            <motion.button',
        '                  placeholder="••••••••"\n                  required\n                />\n                <button type="button" onClick={() => setShowConfirmPw(!showConfirmPw)} className="absolute right-6 top-1/2 -translate-y-1/2 text-white/20 hover:text-white transition-colors"><Eye className="w-4 h-4" /></button>\n              </div>\n            </div>\n            </div>\n\n            <motion.button'
    )
    if "Eye" not in src:
        src = src.replace(
            "import { Lock, Mail, User, Zap, ArrowRight, Loader2, Building2, Layers, ShieldCheck } from 'lucide-react';",
            "import { Lock, Mail, User, Zap, ArrowRight, Loader2, Building2, Layers, ShieldCheck, Eye } from 'lucide-react';"
        )
    with open("src/pages/Signup.tsx", "w") as f:
        f.write(src)
    print("fix-11 done: Signup password show/hide toggles added")
else:
    print("fix-11 SKIP: showPassword already present in Signup.tsx")

print("\nAll round-4 fixes attempted. Run: npm run lint")
