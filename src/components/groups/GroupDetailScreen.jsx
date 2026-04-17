import { useState, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Copy, MoreHorizontal, Check, Camera } from 'lucide-react'
import { useGroupDetail, useLeaveGroup, useUpdateGroupMedia } from '@/hooks/useGroups'
import { useGroupActivity } from '@/hooks/useActivity'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
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
  const { data: group, isLoading, error: groupError } = useGroupDetail(groupId)
  const { data: activityFeed = [] } = useGroupActivity(groupId)
  const { mutateAsync: leaveGroup, isPending: isLeaving } = useLeaveGroup()
  const { mutateAsync: updateGroupMedia } = useUpdateGroupMedia()

  const [copied, setCopied] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false)
  const [coverUploading, setCoverUploading] = useState(false)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [uploadError, setUploadError] = useState(null)

  const coverInputRef = useRef(null)
  const avatarInputRef = useRef(null)

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
      <div className="flex items-center justify-center h-screen bg-bg-primary">
        <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!group) {
    return (
      <div className="flex flex-col items-center justify-center h-screen text-text-muted">
        <p>{groupError ? groupError.message : 'Group not found.'}</p>
        <button onClick={() => navigate('/groups')} className="mt-3 text-accent text-sm">Back to Groups</button>
      </div>
    )
  }

  return (
    <div className="safe-top bg-bg-primary min-h-screen">
      {/* Hidden file inputs */}
      <input
        ref={coverInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) { handleMediaUpload(e.target.files[0], 'cover'); e.target.value = '' } }}
      />
      <input
        ref={avatarInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={e => { if (e.target.files?.[0]) { handleMediaUpload(e.target.files[0], 'avatar'); e.target.value = '' } }}
      />

      {/* Cover photo zone */}
      <div className="relative w-full h-40 bg-bg-tertiary flex-shrink-0">
        {group.cover_url && !coverUploading && (
          <img
            src={group.cover_url}
            alt="Group cover"
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        {coverUploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-bg-tertiary/80">
            <div className="w-6 h-6 border-2 border-accent border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        {/* Nav row overlaid on cover */}
        <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-4 pt-4">
          <div className="bg-black/40 rounded-full p-1.5">
            <button
              onClick={() => navigate('/groups')}
              className="flex items-center gap-1 text-white"
            >
              <ArrowLeft size={18} />
            </button>
          </div>
          <div className="bg-black/40 rounded-full">
            <button
              onClick={() => setMenuOpen(v => !v)}
              className="w-8 h-8 flex items-center justify-center text-white relative"
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
        </div>
        {/* Cover upload button (admin only) */}
        {isAdmin && !coverUploading && (
          <button
            onClick={() => coverInputRef.current?.click()}
            className="absolute bottom-2 right-2 bg-black/40 rounded-full p-2 text-white"
          >
            <Camera size={14} />
          </button>
        )}
      </div>

      {/* Avatar + group name row */}
      <div className="px-4 -mt-8 flex items-end gap-3 relative z-10">
        <div className="relative flex-shrink-0">
          <div className="w-16 h-16 rounded-full border-2 border-bg-primary overflow-hidden bg-accent/20 flex items-center justify-center">
            {group.avatar_url && !avatarUploading ? (
              <img
                src={group.avatar_url}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            ) : avatarUploading ? (
              <div className="w-full h-full flex items-center justify-center">
                <div className="w-5 h-5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
              </div>
            ) : (
              <span className="text-accent font-bold text-xl">
                {group.name?.[0]?.toUpperCase() || '?'}
              </span>
            )}
          </div>
          {isAdmin && !avatarUploading && (
            <button
              onClick={() => avatarInputRef.current?.click()}
              className="absolute bottom-0 right-0 bg-accent rounded-full p-1 text-white"
            >
              <Camera size={10} />
            </button>
          )}
        </div>
        <div className="pb-1 min-w-0 flex-1">
          <h1 className="font-bold text-text-primary text-lg leading-tight truncate">{group.name}</h1>
          {group.description && (
            <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">{group.description}</p>
          )}
        </div>
      </div>

      {uploadError && (
        <div className="mx-4 mt-2 text-xs text-danger">{uploadError}</div>
      )}

      <div className="px-4 pb-8 max-w-lg mx-auto mt-4">
        {/* Invite Code banner */}
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
