export default function PageLayout({ children }) {
  return (
    <div className="pt-20 bg-white">
      <div className="max-w-6xl mx-auto px-6 md:px-20 py-10 md:py-12">
        {children}
      </div>
    </div>
  )
}