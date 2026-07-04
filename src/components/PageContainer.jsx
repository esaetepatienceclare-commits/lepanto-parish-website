export default function PageContainer({ children }) {
  return (
    <div className="pt-24 px-6 md:px-20 min-h-screen bg-white">
      <div className="max-w-6xl mx-auto">
        {children}
      </div>
    </div>
  )
}