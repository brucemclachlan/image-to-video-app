import './globals.css'

export const metadata = {
  title: 'Image to Video Converter',
  description: 'Convert a sequence of images into a video timeline',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
