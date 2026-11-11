// Card heading with a colourful icon badge
export default function Title({ icon, children }) {
  return <h2 className="title"><span className="h-badge" aria-hidden="true">{icon}</span><span>{children}</span></h2>
}
