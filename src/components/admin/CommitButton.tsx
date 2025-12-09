'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface CommitButtonProps {
  batchId: string
  validRows: number
}

export default function CommitButton({ batchId, validRows }: CommitButtonProps) {
  const router = useRouter()
  const [isCommitting, setIsCommitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleCommit = async () => {
    if (!confirm(`Are you sure you want to commit ${validRows} items to the database?`)) {
      return
    }

    setIsCommitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/imports/${batchId}/commit`, {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to commit import')
        setIsCommitting(false)
        return
      }

      // Refresh the page to show updated status
      router.refresh()
    } catch (err) {
      setError('An error occurred while committing the import')
      setIsCommitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        Ready to commit {validRows} items to the database?
      </p>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <p className="text-sm text-red-800">{error}</p>
        </div>
      )}
      <button
        onClick={handleCommit}
        disabled={isCommitting}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isCommitting ? 'Committing...' : 'Commit Import'}
      </button>
    </div>
  )
}

