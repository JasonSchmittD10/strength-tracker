import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { useGroups, useCreateGroup, useJoinGroup } from '@/hooks/useGroups'
import GroupCard from './GroupCard'

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
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-bg-tertiary rounded-xl text-sm text-text-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={isPending}
            className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
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
          <button
            onClick={onClose}
            className="flex-1 py-2.5 border border-bg-tertiary rounded-xl text-sm text-text-secondary"
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            disabled={isPending}
            className="flex-1 py-2.5 bg-accent text-white rounded-xl text-sm font-semibold disabled:opacity-50"
          >
            {isPending ? 'Joining…' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default function GroupsTab() {
  const navigate = useNavigate()
  const { data: groups = [], isLoading } = useGroups()
  const [showCreate, setShowCreate] = useState(false)
  const [showJoin, setShowJoin] = useState(false)

  function handleCreated(groupId) {
    setShowCreate(false)
    navigate(`/groups/${groupId}`)
  }

  function handleJoined(groupId) {
    setShowJoin(false)
    navigate(`/groups/${groupId}`)
  }

  const hasGroups = groups.length > 0

  return (
    <div className="safe-top px-4 pb-4 max-w-lg mx-auto">
      <div className="flex items-center justify-between py-4">
        <h1 className="font-bold text-2xl text-text-primary">Groups</h1>
        {hasGroups && (
          <button
            onClick={() => setShowCreate(true)}
            className="w-9 h-9 rounded-full bg-bg-tertiary flex items-center justify-center text-text-muted hover:text-text-primary transition-colors"
            aria-label="Create group"
          >
            <Plus size={18} />
          </button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map(i => (
            <div key={i} className="bg-bg-card rounded-2xl h-16 animate-pulse" />
          ))}
        </div>
      ) : hasGroups ? (
        <div className="space-y-2">
          {groups.map(group => (
            <GroupCard
              key={group.id}
              group={group}
              onClick={() => navigate(`/groups/${group.id}`)}
            />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center pt-20 text-center px-6">
          {/* Two-person silhouette SVG */}
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none" className="mb-5 opacity-30">
            <circle cx="26" cy="22" r="10" fill="currentColor" className="text-text-secondary" />
            <path d="M6 54c0-11 9-18 20-18s20 7 20 18" fill="currentColor" className="text-text-secondary" />
            <circle cx="50" cy="22" r="10" fill="currentColor" className="text-text-secondary" opacity="0.6" />
            <path d="M34 54c2-8 8-14 16-14s14 6 16 14" fill="currentColor" className="text-text-secondary" opacity="0.6" />
          </svg>
          <h2 className="text-xl font-bold text-text-primary mb-2">Train Together</h2>
          <p className="text-text-secondary text-sm mb-8">
            Join a group to share workouts and compete with friends.
          </p>
          <div className="flex flex-col gap-3 w-full max-w-xs">
            <button
              onClick={() => setShowCreate(true)}
              className="w-full bg-accent text-white font-semibold rounded-xl py-3 text-sm hover:bg-accent-hover transition-colors"
            >
              Create a Group
            </button>
            <button
              onClick={() => setShowJoin(true)}
              className="w-full border border-accent text-accent font-semibold rounded-xl py-3 text-sm hover:bg-accent/10 transition-colors"
            >
              Join with Code
            </button>
          </div>
        </div>
      )}

      {showCreate && <CreateGroupDialog onClose={() => setShowCreate(false)} onCreated={handleCreated} />}
      {showJoin && <JoinGroupDialog onClose={() => setShowJoin(false)} onJoined={handleJoined} />}
    </div>
  )
}
