import { useState } from 'react'
import { Copy, Check, MoreHorizontal, Camera } from 'lucide-react'
import { useGroups, useCreateGroup, useJoinGroup, useGroupDetail, useLeaveGroup, useUpdateGroupMedia } from '@/hooks/useGroups'
import { useGroupActivity } from '@/hooks/useActivity'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { formatVolume } from '@/lib/utils'
import WorkoutActivityCard from './WorkoutActivityCard'

// ─── Dialogs ──────────────────────────────────────────────────────────────────

function CreateGroupDialog({ onClose, onCreated }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const { mutateAsync: createGroup, isPending } = useCreateGroup()

  async function handleCreate() {
    if (!name.trim()) { setError('Group name is required'); return }
    setError('')
    try {
      const group = await createGroup({ name: name.trim(), description: description.trim() })
      onCreated(group.id)
    } catch (e) {
      setError(e.message || 'Failed to create group')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
      <div className="bg-bg-secondary rounded-2xl p-6 w-full max-w-sm">
        <h3 className="font-bold text-text-primary text-lg mb-4">Create a Group</h3>
        <div className="space-y-3 mb-4">
          <input
            autoFocus
            value={name}
            onChange={e => setName(e.target.value)}
            placeholder="Group name"
            className="w-full bg-bg-tertiary rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-1 focus:ring-accent"
          />
          <textarea
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Description (optional)"
            rows={2}
            className="w-full bg-bg-tertiary rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-1 focus:ring-accent resize-none"
          />
          {error && <p className="text-danger text-sm">{error}</p>}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-bg-tertiary rounded-xl text-sm text-text-secondary">Cancel</button>
          <button onClick={handleCreate} disabled={isPending} className="flex-1 py-2.5 bg-accent text-black rounded-xl text-sm font-semibold disabled:opacity-50">
            {isPending ? 'Creating…' : 'Create'}
          </button>
        </div>
      </div>
    </div>
  )
}

function JoinGroupDialog({ onClose, onJoined }) {
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const { mutateAsync: joinGroup, isPending } = useJoinGroup()

  async function handleJoin() {
    if (!code.trim()) { setError('Enter an invite code'); return }
    setError('')
    try {
      const group = await joinGroup(code.trim())
      onJoined(group.id)
    } catch (e) {
      setError(e.message || 'No group found with that code')
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
      <div className="bg-bg-secondary rounded-2xl p-6 w-full max-w-sm">
        <h3 className="font-bold text-text-primary text-lg mb-4">Join with Code</h3>
        <div className="space-y-3 mb-4">
          <input
            autoFocus
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="8-character invite code"
            className="w-full bg-bg-tertiary rounded-xl px-4 py-3 text-text-primary placeholder-text-muted text-sm focus:outline-none focus:ring-1 focus:ring-accent tracking-widest uppercase"
            maxLength={8}
          />
          {error && <p className="text-danger text-sm">{error}</p>}
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2.5 border border-bg-tertiary rounded-xl text-sm text-text-secondary">Cancel</button>
          <button onClick={handleJoin} disabled={isPending} className="flex-1 py-2.5 bg-accent text-black rounded-xl text-sm font-semibold disabled:opacity-50">
            {isPending ? 'Joining…' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  )
}

function LeaveConfirmDialog({ isAdmin, isLastMember, onConfirm, onCancel, isLeaving }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6">
      <div className="bg-bg-secondary rounded-2xl p-6 w-full max-w-sm">
        <h3 className="font-bold text-text-primary text-lg mb-2">Leave Group?</h3>
        <p className="text-text-secondary text-sm mb-5">
          {isLastMember
            ? 'You are the only member. Leaving will permanently delete this group.'
            : isAdmin
              ? 'You are the admin. Leaving will transfer admin to the next member.'
              : 'You will no longer see this group or its activity feed.'}
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-2.5 border border-bg-tertiary rounded-xl text-sm text-text-secondary">Cancel</button>
          <button onClick={onConfirm} disabled={isLeaving} className="flex-1 py-2.5 bg-danger text-white rounded-xl text-sm font-semibold disabled:opacity-50">
            {isLeaving ? 'Leaving…' : isLastMember ? 'Delete & Leave' : 'Leave'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Shared sub-components ────────────────────────────────────────────────────

function MemberRow({ member }) {
  const profile = member.profiles
  const name = profile?.display_name || member.user_id?.slice(0, 8) || '?'
  const initial = name[0]?.toUpperCase() || '?'
  const avatarUrl = profile?.avatar_url || null
  const joinedDate = member.joined_at
    ? new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : ''

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-9 h-9 rounded-full overflow-hidden bg-bg-tertiary flex items-center justify-center flex-shrink-0">
        {avatarUrl
          ? <img src={avatarUrl} alt={name} className="w-full h-full object-cover" />
          : <span className="text-white font-bold text-sm">{initial}</span>
        }
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-text-primary">{name}</div>
        {joinedDate && <div className="text-xs text-text-muted">Joined {joinedDate}</div>}
      </div>
      {member.role === 'admin' && (
        <span className="text-xs bg-accent/15 text-accent border border-accent/30 px-2 py-0.5 rounded-full font-medium">Admin</span>
      )}
    </div>
  )
}

function StatCard({ value, label }) {
  return (
    <div className="flex-1 bg-bg-stat rounded-xl py-3 flex flex-col items-center justify-center gap-0.5 min-w-0 overflow-hidden">
      <span className="font-judge text-[26px] font-bold leading-none text-white">{value}</span>
      <span className="font-commons text-sm text-[#8b8b8b] text-center">{label}</span>
    </div>
  )
}

const TABS = [
  { id: 'feed', label: 'Feed' },
  { id: 'members', label: 'Members' },
  { id: 'leaderboard', label: 'Leaderboard' },
  { id: 'challenges', label: 'Challenges' },
]

// ─── Group view ───────────────────────────────────────────────────────────────

function GroupView({ groupId, onLeft }) {
  const { user } = useAuth()
  const { data: group, isLoading } = useGroupDetail(groupId)
  const { data: activityFeed = [], error: activityError } = useGroupActivity(groupId)
  const { mutateAsync: leaveGroup, isPending: isLeaving } = useLeaveGroup()
  const { mutateAsync: updateGroupMedia } = useUpdateGroupMedia()

  const [activeTab, setActiveTab] = useState('feed')
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [copied, setCopied] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const members = group?.group_members ?? []
  const myMembership = members.find(m => m.user_id === user?.id)
  const isAdmin = myMembership?.role === 'admin'
  const isLastMember = members.length === 1
  const groupInitial = group?.name?.[0]?.toUpperCase() ?? '?'

  const totalVolume = activityFeed.reduce((sum, a) => sum + (a.summary?.totalVolume ?? 0), 0)

  function copyInviteCode() {
    if (!group?.invite_code) return
    navigator.clipboard.writeText(group.invite_code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  async function handleLeave() {
    try {
      await leaveGroup({ groupId, userId: user.id, isAdmin })
      setShowLeaveConfirm(false)
      onLeft()
    } catch (e) {
      setShowLeaveConfirm(false)
      console.error('Leave group failed', e)
    }
  }

  async function handleMediaUpload(file, type) {
    if (!file || !groupId) return
    const ext = file.name.split('.').pop()
    const path = `${groupId}/${type}-${Date.now()}.${ext}`
    const setStat = type === 'cover' ? setCoverUploading : setAvatarUploading
    setStat(true)
    setUploadError(null)
    try {
      const { error: storageError } = await supabase.storage
        .from('group-media')
        .upload(path, file, { upsert: true })
      if (storageError) throw storageError
      const { data: { publicUrl } } = supabase.storage
        .from('group-media')
        .getPublicUrl(path)
      await updateGroupMedia(
        type === 'cover'
          ? { groupId, coverUrl: publicUrl }
          : { groupId, avatarUrl: publicUrl }
      )
    } catch (e) {
      console.error(`${type} upload failed`, e)
      setUploadError(`Failed to upload ${type} photo. Please try again.`)
    } finally {
      setStat(false)
    }
  }

  if (isLoading) {
    return (
      <div className="bg-bg-deep min-h-screen">
        <div className="h-[172px] bg-bg-stat animate-pulse" style={{ paddingTop: 'env(safe-area-inset-top)' }} />
        <div className="px-4 mt-4 space-y-3">
          <div className="h-7 w-48 bg-bg-card rounded-lg animate-pulse" />
          <div className="h-4 w-32 bg-bg-card rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  if (!group) return null

  return (
    <div className="bg-bg-deep min-h-screen" onClick={() => menuOpen && setMenuOpen(false)}>

      {/* ── Hero cover photo ─────────────────────────────────────────────── */}
      <div className="relative h-[172px]" style={{ paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="absolute inset-0 overflow-hidden">
          {group.cover_url && !coverUploading ? (
            <img src={group.cover_url} alt="Group cover" className="w-full h-full object-cover" />
          ) : coverUploading ? (
            <div className="w-full h-full bg-bg-stat flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-[#302c3e] via-[#1e1d2c] to-[#0a0a0a]" />
          )}
        </div>
        {/* Bottom fade */}
        <div className="absolute bottom-0 left-0 right-0 h-[119px] bg-gradient-to-t from-bg-deep to-transparent pointer-events-none" />
        {/* Top fade for status bar */}
        <div className="absolute top-0 left-0 right-0 h-[54px] bg-gradient-to-b from-bg-deep to-transparent pointer-events-none" />
        {/* Admin cover upload */}
        {isAdmin && !coverUploading && (
          <label className="absolute bottom-3 right-3 bg-black/40 rounded-full p-1.5 text-white cursor-pointer z-10">
            <Camera size={12} />
            <input type="file" accept="image/*" className="sr-only"
              onChange={e => { if (e.target.files?.[0]) { handleMediaUpload(e.target.files[0], 'cover'); e.target.value = '' } }} />
          </label>
        )}
      </div>

      {/* ── Group header row ──────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 px-4 -mt-9 relative z-10 mb-5">
        {/* Avatar */}
        <div className="relative flex-shrink-0">
          <div className="w-[60px] h-[60px] rounded-[6px] border border-white overflow-hidden bg-bg-stat flex items-center justify-center shadow-lg">
            {group.avatar_url && !avatarUploading ? (
              <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
            ) : avatarUploading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <span className="font-judge text-2xl font-bold text-white">{groupInitial}</span>
            )}
          </div>
          {isAdmin && !avatarUploading && (
            <label className="absolute -bottom-1 -right-1 bg-accent rounded-full p-1 text-white cursor-pointer">
              <Camera size={10} />
              <input type="file" accept="image/*" className="sr-only"
                onChange={e => { if (e.target.files?.[0]) { handleMediaUpload(e.target.files[0], 'avatar'); e.target.value = '' } }} />
            </label>
          )}
        </div>

        {/* Name + member count */}
        <div className="flex-1 min-w-0">
          <h1 className="font-judge text-[26px] font-bold text-white leading-tight truncate">{group.name}</h1>
          <p className="font-commons text-base text-[#8b8b8b] mt-0.5">{members.length} members</p>
        </div>

        {/* More menu */}
        <div className="relative flex-shrink-0">
          <button
            onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
            className="w-6 h-6 bg-black/60 backdrop-blur-sm rounded-[4px] flex items-center justify-center"
            aria-label="More options"
          >
            <MoreHorizontal size={13} className="text-white" />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 bg-bg-secondary border border-bg-tertiary rounded-xl overflow-hidden z-50 min-w-[160px] shadow-lg">
              <button
                onClick={e => { e.stopPropagation(); copyInviteCode() }}
                className="w-full text-left px-4 py-3 text-sm text-text-primary hover:bg-bg-tertiary transition-colors flex items-center gap-2"
              >
                {copied ? <Check size={13} /> : <Copy size={13} />}
                {copied ? 'Copied!' : 'Copy Invite Code'}
              </button>
              <button
                onClick={e => { e.stopPropagation(); setMenuOpen(false); setShowLeaveConfirm(true) }}
                className="w-full text-left px-4 py-3 text-sm text-danger hover:bg-bg-tertiary transition-colors border-t border-bg-tertiary"
              >
                Leave Group
              </button>
            </div>
          )}
        </div>
      </div>

      {uploadError && <p className="px-4 mb-3 text-xs text-danger">{uploadError}</p>}

      {/* ── Tab navigation ────────────────────────────────────────────────── */}
      <div className="border-b border-white/10 flex gap-5 px-4 overflow-x-auto scrollbar-none">
        {TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className="flex-shrink-0 flex flex-col gap-2 items-start"
          >
            <span className={`font-commons font-semibold text-lg tracking-tight leading-none ${activeTab === tab.id ? 'text-white' : 'text-white/60'}`}>
              {tab.label}
            </span>
            <div className={`h-[2px] w-full transition-colors ${activeTab === tab.id ? 'bg-accent' : 'bg-transparent'}`} />
          </button>
        ))}
      </div>

      {/* ── Tab content ───────────────────────────────────────────────────── */}
      <div className="px-4 pt-4 pb-[80px]">

        {activeTab === 'feed' && (
          <>
            {/* Group aggregate stats */}
            <div className="flex gap-2 mb-4">
              <StatCard value={formatVolume(totalVolume)} label="kg lifted" />
              <StatCard value={activityFeed.length} label="Workouts" />
              <StatCard value={members.length} label="Members" />
            </div>

            {activityError ? (
              <div className="py-6 text-center">
                <p className="text-danger text-sm">Couldn't load activity</p>
                <p className="text-text-muted text-xs mt-1">{activityError.message}</p>
              </div>
            ) : activityFeed.length === 0 ? (
              <div className="py-8 text-center">
                <p className="text-text-muted text-sm">No workouts yet. Complete a workout to see it here.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activityFeed.map(activity => (
                  <WorkoutActivityCard key={activity.id} activity={activity} />
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'members' && (
          <>
            <div className="bg-bg-card border border-bg-tertiary rounded-2xl px-4 divide-y divide-bg-tertiary mb-4">
              {members.map(member => (
                <MemberRow key={member.user_id} member={member} />
              ))}
            </div>
            {group.invite_code && (
              <button
                onClick={copyInviteCode}
                className="w-full flex items-center justify-center gap-2 py-3 border border-bg-tertiary rounded-xl text-sm text-text-secondary hover:border-accent/40 hover:text-accent transition-colors"
              >
                {copied ? <Check size={14} /> : <Copy size={14} />}
                {copied ? 'Copied!' : `Invite Code: ${group.invite_code}`}
              </button>
            )}
          </>
        )}

        {(activeTab === 'leaderboard' || activeTab === 'challenges') && (
          <div className="py-16 text-center">
            <p className="text-text-muted text-sm">Coming soon</p>
          </div>
        )}
      </div>

      {showLeaveConfirm && (
        <LeaveConfirmDialog
          isAdmin={isAdmin}
          isLastMember={isLastMember}
          onConfirm={handleLeave}
          onCancel={() => setShowLeaveConfirm(false)}
          isLeaving={isLeaving}
        />
      )}
    </div>
  )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState({ onCreate, onJoin }) {
  return (
    <div className="safe-top px-4 pb-8 max-w-lg mx-auto">
      <div className="py-4">
        <h1 className="font-bold text-2xl text-text-primary">Groups</h1>
      </div>
      <div className="flex flex-col items-center justify-center pt-16 text-center px-6">
        <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="mb-5 opacity-30">
          <circle cx="26" cy="22" r="10" fill="currentColor" className="text-text-secondary" />
          <path d="M6 54c0-11 9-18 20-18s20 7 20 18" fill="currentColor" className="text-text-secondary" />
          <circle cx="50" cy="22" r="10" fill="currentColor" className="text-text-secondary" opacity="0.6" />
          <path d="M34 54c2-8 8-14 16-14s14 6 16 14" fill="currentColor" className="text-text-secondary" opacity="0.6" />
        </svg>
        <h2 className="text-xl font-bold text-text-primary mb-2">Train Together</h2>
        <p className="text-text-secondary text-sm mb-8">Join a group to share workouts and compete with friends.</p>
        <div className="flex flex-col gap-3 w-full max-w-xs">
          <button
            onClick={onCreate}
            className="w-full bg-accent text-black font-semibold rounded-xl py-3 text-sm hover:bg-accent-hover transition-colors"
          >
            Create a Group
          </button>
          <button
            onClick={onJoin}
            className="w-full border border-accent text-accent font-semibold rounded-xl py-3 text-sm hover:bg-accent/10 transition-colors"
          >
            Join with Code
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main tab ─────────────────────────────────────────────────────────────────

export default function GroupsTab() {
  const { data: groups = [], isLoading, refetch } = useGroups()
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)

  const hasGroups = groups.length > 0

  return (
    <>
      {isLoading ? (
        <div className="safe-top px-4 pb-8 max-w-lg mx-auto">
          <h1 className="font-bold text-2xl text-text-primary mb-4 py-4">Groups</h1>
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="bg-bg-card rounded-2xl h-16 animate-pulse" />)}
          </div>
        </div>
      ) : hasGroups ? (
        <GroupView groupId={groups[0].id} onLeft={() => refetch()} />
      ) : (
        <EmptyState onCreate={() => setShowCreate(true)} onJoin={() => setShowJoin(true)} />
      )}

      {showCreate && (
        <CreateGroupDialog
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); refetch() }}
        />
      )}
      {showJoin && (
        <JoinGroupDialog
          onClose={() => setShowJoin(false)}
          onJoined={() => { setShowJoin(false); refetch() }}
        />
      )}
    </>
  )
}
