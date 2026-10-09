const ROLE_STYLES: Record<string, string> = {
  'User': 'bg-white/10 text-white/60',
  'Club Member': 'bg-blue-500/20 text-blue-300',
  'Club Owner': 'bg-emerald-500/20 text-emerald-300',
  'Event Organizer': 'bg-purple-500/20 text-purple-300',
};

export default function RoleBadges({ roles = [] }: { roles?: string[] }) {
  if (!roles.length) return null;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {roles.map((r) => (
        <span
          key={r}
          className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${ROLE_STYLES[r] || 'bg-white/10 text-white/60'}`}
        >
          {r}
        </span>
      ))}
    </div>
  );
}
