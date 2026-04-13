import { useState } from 'react'
import { Copy, Check, MoreHorizontal } from 'lucide-react'
import { useGroups, useCreateGroup, useJoinGroup, useGroupDetail, useLeaveGroup } from '@/hooks/useGroups'
import { useGroupActivity } from '@/hooks/useActivity'
import { useAuth } from '@/hooks/useAuth'
import WorkoutActivityCard from './WorkoutActivityCard'

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

function MemberRow({ member }) {
  const profile = member.profiles
  const name = profile?.display_name || member.user_id?.slice(0, 8) || '?'
  const initial = name[0]?.toUpperCase() || '?'
  const joinedDate = member.joined_at
    ? new Date(member.joined_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
    : ''

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="w-9 h-9 rounded-full bg-accent/20 flex items-center justify-center flex-shrink-0">
        <span className="text-accent font-bold text-sm">{initial}</span>
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

function GroupView({ groupId, onLeft }) {
  const { user } = useAuth()
  const { data: group, isLoading } = useGroupDetail(groupId)
  const { data: activityFeed = [] } = useGroupActivity(groupId)
  const { mutateAsync: leaveGroup, isPending: isLeaving } = useLeaveGroup()
  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)

  const members = group?.group_members ?? []
  const myMembership = members.find(m => m.user_id === user?.id)
  const isAdmin = myMembership?.role === 'admin'
  const isLastMember = members.length === 1

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

  if (isLoading) {
    return <div className="space-y-3">{[1, 2].map(i => <div key={i} className="bg-bg-card rounded-2xl h-16 animate-pulse" />)}</div>
  }

  if (!group) return null

  return (
    <>
      <div className="flex items-center justify-between py-4">
        <div>
          <h1 className="font-bold text-2xl text-text-primary">Groups</h1>
          <p className="text-sm text-text-muted mt-0.5">{group.name}</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setMenuOpen(v => !v)}
            className="w-9 h-9 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
          >
            <MoreHorizontal size={20} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-10 bg-bg-secondary border border-bg-tertiary rounded-xl overflow-hidden z-10 min-w-36 shadow-lg">
              <button
                onClick={() => { setMenuOpen(false); setShowLeaveConfirm(true) }}
                className="w-full text-left px-4 py-3 text-sm text-danger hover:bg-bg-tertiary transition-colors"
              >
                Leave Group
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Invite Code */}
      <div className="mb-5 bg-bg-card border border-bg-tertiary rounded-2xl px-4 py-4">
        <div className="flex items-center justify-between mb-1">
          <div>
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider mb-0.5">Invite Code</div>
            <div className="text-lg font-bold text-text-primary tracking-widest">{group.invite_code}</div>
          </div>
          <button
            onClick={copyInviteCode}
            className="flex items-center gap-1.5 text-xs text-accent border border-accent/40 rounded-lg px-3 py-1.5 hover:bg-accent/10 transition-colors"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>
        <p className="text-xs text-text-muted mt-1">Share this code with friends to let them join</p>
      </div>

      {/* Members */}
      <div className="mb-5">
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Members · {members.length}</div>
        <div className="bg-bg-card border border-bg-tertiary rounded-2xl px-4 divide-y divide-bg-tertiary">
          {members.map(member => <MemberRow key={member.user_id} member={member} />)}
        </div>
      </div>

      {/* Activity Feed */}
      <div>
        <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">Group Activity</div>
        {activityFeed.length === 0 ? (
          <div className="bg-bg-card border border-bg-tertiary rounded-2xl px-4 py-6 text-center">
            <p className="text-text-muted text-sm">No workouts yet. Complete a workout to see it here.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activityFeed.map(activity => <WorkoutActivityCard key={activity.id} activity={activity} />)}
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
    </>
  )
}

export default function GroupsTab() {
  const { data: groups = [], isLoading, refetch } = useGroups()
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)

  const hasGroups = groups.length > 0

  return (
    <div className="safe-top px-4 pb-8 max-w-lg mx-auto">
      {isLoading ? (
        <div className="py-4">
          <h1 className="font-bold text-2xl text-text-primary mb-4">Groups</h1>
          <div className="space-y-3">{[1, 2].map(i => <div key={i} className="bg-bg-card rounded-2xl h-16 animate-pulse" />)}</div>
        </div>
      ) : hasGroups ? (
        <GroupView groupId={groups[0].id} onLeft={() => refetch()} />
      ) : (
        <>
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
              <button onClick={() => setShowCreate(true)} className="w-full bg-accent text-black font-semibold rounded-xl py-3 text-sm hover:bg-accent-hover transition-colors">
                Create a Group
              </button>
              <button onClick={() => setShowJoin(true)} className="w-full border border-accent text-accent font-semibold rounded-xl py-3 text-sm hover:bg-accent/10 transition-colors">
                Join with Code
              </button>
            </div>
          </div>
        </>
      )}

      {showCreate && <CreateGroupDialog onClose={() => setShowCreate(false)} onCreated={() => { setShowCreate(false); refetch() }} />}
      {showJoin && <JoinGroupDialog onClose={() => setShowJoin(false)} onJoined={() => { setShowJoin(false); refetch() }} />}
    </div>
  )
}
