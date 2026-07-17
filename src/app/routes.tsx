import { Navigate, Route, Routes } from 'react-router-dom'

function Placeholder({ label }: { label: string }) {
  return (
    <div className="flex h-full items-center justify-center bg-pitch-950 text-2xl text-white/60">
      {label}
    </div>
  )
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<Placeholder label="Login" />} />
      <Route path="/signup" element={<Placeholder label="Signup" />} />
      <Route path="/dashboard" element={<Placeholder label="Dashboard" />} />
      <Route
        path="/editor/:projectId"
        element={<Placeholder label="Editor" />}
      />
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  )
}
