export const metadata = {
  title: 'Delivery Form',
  description: 'Warehouse Delivery Form',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        {/* This line automatically handles the styling/design of your form */}
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-gray-100 min-h-screen py-10 px-4">
        {children}
      </body>
    </html>
  )
}
