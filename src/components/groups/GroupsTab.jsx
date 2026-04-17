import { useState } from 'react'
import { Copy, Check, Plus, Users, MoreHorizontal, Camera } from 'lucide-react'
import { useGroups, useCreateGroup, useJoinGroup, useGroupDetail, useLeaveGroup, useUpdateGroupMedia } from '@/hooks/useGroups'
import { useGroupActivity } from '@/hooks/useActivity'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import WorkoutActivityCard from './WorkoutActivityCard'
import SlideUpSheet from '@/components/shared/SlideUpSheet'

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

// ─── Member row ───────────────────────────────────────────────────────────────

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

// ─── Group view ───────────────────────────────────────────────────────────────

function GroupView({ groupId, onLeft }) {
  const { user } = useAuth()
  const { data: group, isLoading } = useGroupDetail(groupId)
  const { data: activityFeed = [], error: activityError } = useGroupActivity(groupId)
  const { mutateAsync: leaveGroup, isPending: isLeaving } = useLeaveGroup()
  const { mutateAsync: updateGroupMedia } = useUpdateGroupMedia()

  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [showMembers, setShowMembers] = useState(false)
  const [showInvite, setShowInvite] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const members = group?.group_members ?? []
  const myMembership = members.find(m => m.user_id === user?.id)
  const isAdmin = myMembership?.role === 'admin'
  const isLastMember = members.length === 1
  const groupInitial = group?.name?.[0]?.toUpperCase() ?? '?'

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
      <div className="bg-bg-primary min-h-screen">
        <div
          className="h-[160px] bg-bg-secondary animate-pulse"
          style={{ paddingTop: 'env(safe-area-inset-top)' }}
        />
        <div className="px-5 mt-12 space-y-3">
          <div className="h-7 w-48 bg-bg-card rounded-lg animate-pulse" />
          <div className="h-4 w-64 bg-bg-card rounded-lg animate-pulse" />
        </div>
      </div>
    )
  }

  if (!group) return null

  return (
    <div className="bg-bg-primary min-h-screen" onClick={() => menuOpen && setMenuOpen(false)}>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="relative">
        <div style={{ paddingTop: 'env(safe-area-inset-top)' }}>
          {/* h-[160px] has NO overflow-hidden so the dropdown can escape downward */}
          <div className="h-[160px] relative">
            {/* Inner clip — contains gradient + cover photo */}
            <div className="absolute inset-0 overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-[#302c3e] via-[#1e1d2c] to-[#0f1117]" />
              {group.cover_url && !coverUploading && (
                <img
                  src={group.cover_url}
                  alt="Group cover"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              )}
              {coverUploading && (
                <div className="absolute inset-0 flex items-center justify-center bg-bg-secondary/80">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-bg-primary/80" />
            </div>

            {/* Action buttons — outside overflow clip so dropdown is never cut off */}
            <div className="absolute right-4 bottom-3 flex items-center gap-1.5 z-30">
              <button
                onClick={e => { e.stopPropagation(); setShowMembers(true) }}
                className="w-6 h-6 bg-black/60 backdrop-blur-sm rounded-[4px] flex items-center justify-center"
                aria-label="View members"
              >
                <Users size={13} className="text-white" />
              </button>
              <button
                onClick={e => { e.stopPropagation(); setShowInvite(true) }}
                className="w-6 h-6 bg-black/60 backdrop-blur-sm rounded-[4px] flex items-center justify-center"
                aria-label="Invite"
              >
                <Plus size={16} className="text-white" />
              </button>
              <div className="relative">
                <button
                  onClick={e => { e.stopPropagation(); setMenuOpen(v => !v) }}
                  className="w-6 h-6 bg-black/60 backdrop-blur-sm rounded-[4px] flex items-center justify-center"
                  aria-label="More options"
                >
                  <MoreHorizontal size={13} className="text-white" />
                </button>
                {menuOpen && (
                  <div className="absolute right-0 top-8 bg-bg-secondary border border-bg-tertiary rounded-xl overflow-hidden z-50 min-w-[140px] shadow-lg">
                    <button
                      onClick={e => { e.stopPropagation(); setMenuOpen(false); setShowLeaveConfirm(true) }}
                      className="w-full text-left px-4 py-3 text-sm text-danger hover:bg-bg-tertiary transition-colors"
                    >
                      Leave Group
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Cover upload (admin only) */}
            {isAdmin && !coverUploading && (
              <label className="absolute bottom-3 left-[106px] bg-black/40 rounded-full p-1.5 text-white cursor-pointer z-10">
                <Camera size={12} />
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={e => { if (e.target.files?.[0]) { handleMediaUpload(e.target.files[0], 'cover'); e.target.value = '' } }}
                />
              </label>
            )}
          </div>
        </div>

        {/* Group avatar — overlaps hero bottom */}
        <div className="absolute left-4 bottom-0 translate-y-1/2 z-10">
          <div className="relative">
            <div className="w-[82px] h-[82px] bg-bg-card border-2 border-white rounded-xl flex items-center justify-center overflow-hidden shadow-lg">
              {group.avatar_url && !avatarUploading ? (
                <img src={group.avatar_url} alt={group.name} className="w-full h-full object-cover" />
              ) : avatarUploading ? (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <span className="text-[32px] font-bold text-text-primary leading-none">{groupInitial}</span>
              )}
            </div>
            {isAdmin && !avatarUploading && (
              <label className="absolute bottom-0 right-0 bg-accent rounded-full p-1 text-white cursor-pointer">
                <Camera size={10} />
                <input
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={e => { if (e.target.files?.[0]) { handleMediaUpload(e.target.files[0], 'avatar'); e.target.value = '' } }}
                />
              </label>
            )}
          </div>
        </div>
      </div>

      {/* Space for avatar overflow (half of 82px) */}
      <div className="h-[41px]" />

      {uploadError && (
        <div className="px-5 mb-2 text-xs text-danger">{uploadError}</div>
      )}

      {/* ── Group info ───────────────────────────────────────────────────── */}
      <div className="px-5 mt-1 mb-5">
        <h1 className="font-bold text-[26px] text-white leading-tight">{group.name}</h1>
        {group.description ? (
          <p className="text-sm text-text-secondary mt-1.5 leading-snug">{group.description}</p>
        ) : null}
      </div>

      {/* ── Activity feed ─────────────────────────────────────────────────── */}
      <div className="px-5 pb-8">
        <h2 className="font-bold text-lg text-text-primary mb-3">{group.name} Activities</h2>

        {activityError ? (
          <div className="py-6 text-center space-y-1">
            <p className="text-danger text-sm font-medium">Couldn't load activity</p>
            <p className="text-text-muted text-xs">{activityError.message}</p>
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
      </div>

      {/* ── Members sheet ─────────────────────────────────────────────────── */}
      <SlideUpSheet
        open={showMembers}
        onClose={() => setShowMembers(false)}
        title={`Members · ${members.length}`}
      >
        <div className="divide-y divide-bg-tertiary">
          {members.map(member => (
            <MemberRow key={member.user_id} member={member} />
          ))}
        </div>
      </SlideUpSheet>

      {/* ── Invite code sheet ─────────────────────────────────────────────── */}
      <SlideUpSheet
        open={showInvite}
        onClose={() => setShowInvite(false)}
        title="Invite to Group"
        heightClass="h-[38vh]"
      >
        <div>
          <div className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-1">Invite Code</div>
          <div className="text-3xl font-bold text-text-primary tracking-[0.25em] mb-4">{group.invite_code}</div>
          <button
            onClick={copyInviteCode}
            className="flex items-center gap-2 bg-accent/15 text-accent border border-accent/30 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors hover:bg-accent/25"
          >
            {copied ? <Check size={14} /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Code'}
          </button>
          <p className="text-xs text-text-muted mt-4">Share this code with friends to let them join.</p>
        </div>
      </SlideUpSheet>

      {/* ── Leave confirm ─────────────────────────────────────────────────── */}
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
