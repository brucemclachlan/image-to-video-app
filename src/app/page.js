'use client'
import TimeBasedImagePlayer from '@/components/TimeBasedImagePlayer'

export default function Home() {
  return (
    <main className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8">Image to Video Timeline</h1>
        <TimeBasedImagePlayer />
      </div>
    </main>
  )
}
