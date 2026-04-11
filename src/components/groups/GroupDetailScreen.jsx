import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, MoreHorizontal, Check } from 'lucide-react'
import { useGroupDetail, useLeaveGroup } from '@/hooks/useGroups'
import { useGroupActivity } from '@/hooks/useActivity'
import { useAuth } from '@/hooks/useAuth'
import WorkoutActivityCard from './WorkoutActivityCard'

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
        <span className="text-xs bg-accent/15 text-accent border border-accent/30 px-2 py-0.5 rounded-full font-medium">
          Admin
        </span>
      )}
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
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 border border-bg-tertiary rounded-xl text-sm text-text-secondary"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isLeaving}
            className="flex-1 py-2.5 bg-danger text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {isLeaving ? 'Leaving…' : isLastMember ? 'Delete & Leave' : 'Leave'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GroupDetailScreen() {
  const { groupId } = useParams()
  const navigate = useNavigate()
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
      navigate('/groups', { replace: true })
    } catch (e) {
      setShowLeaveConfirm(false)
      console.error('Leave group failed', e)
    }
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-bg-primary">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-text-muted">
        <p>Group not found.</p>
        <button onClick={() => navigate('/groups')} className="mt-3 text-accent text-sm">Back to Groups</button>
      </div>
    )
  }

  return (
    <div className="safe-top bg-bg-primary min-h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-bg-tertiary">
        <button
          onClick={() => navigate('/groups')}
          className="flex items-center gap-1 text-text-secondary hover:text-text-primary transition-colors"
        >
          <ArrowLeft size={18} />
          <span className="text-sm">Groups</span>
        </button>
        <h1 className="font-bold text-text-primary text-base">{group.name}</h1>
        <button
          onClick={() => setMenuOpen(v => !v)}
          className="w-8 h-8 flex items-center justify-center text-text-muted hover:text-text-primary transition-colors relative"
        >
          <MoreHorizontal size={18} />
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
        </button>
      </div>

      <div className="px-4 pb-8 max-w-lg mx-auto">
        {/* Invite Code banner */}
        <div className="mt-4 mb-5 bg-bg-card border border-bg-tertiary rounded-2xl px-4 py-4">
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
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">
            Members · {members.length}
          </div>
          <div className="bg-bg-card border border-bg-tertiary rounded-2xl px-4 divide-y divide-bg-tertiary">
            {members.map(member => (
              <MemberRow key={member.user_id} member={member} />
            ))}
          </div>
        </div>

        {/* Activity Feed */}
        <div>
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-3">
            Group Activity
          </div>
          {activityFeed.length === 0 ? (
            <div className="bg-bg-card border border-bg-tertiary rounded-2xl px-4 py-6 text-center">
              <p className="text-text-muted text-sm">No workouts yet. Complete a workout to see it here.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {activityFeed.map(activity => (
                <WorkoutActivityCard key={activity.id} activity={activity} />
              ))}
            </div>
          )}
        </div>
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
