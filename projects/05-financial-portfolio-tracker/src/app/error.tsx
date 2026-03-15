'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-950 text-gray-100">
      <div className="text-center space-y-4 max-w-md">
        <h2 className="text-2xl font-bold">Something went wrong</h2>
        <p className="text-gray-400">{error.message}</p>
        <button
          onClick={reset}
          className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700 transition"
        >
          Try again
        </button>
      </div>
    </div>
  )
}
