import { useRef, useState } from 'react'
import { useAuthStore } from '../../auth/store/authStore'
import { uploadOrgLogo } from '../../../lib/supabase/branding'

export function OrgLogoUploader() {
  const organization = useAuthStore((s) => s.organization)
  const setOrganization = useAuthStore((s) => s.setOrganization)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file || !organization) return

    setIsUploading(true)
    setError(null)
    try {
      const logoUrl = await uploadOrgLogo(organization.id, file)
      setOrganization({ ...organization, logo_url: logoUrl })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload fehlgeschlagen.')
    } finally {
      setIsUploading(false)
    }
  }

  if (!organization) return null

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        title="Vereinslogo hochladen (erscheint auf Heim-Spieler-Chips)"
        className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-pitch-600 bg-pitch-800 hover:border-violet-accent disabled:opacity-50"
      >
        {isUploading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/20 border-t-violet-accent" />
        ) : organization.logo_url ? (
          <img src={organization.logo_url} alt="Vereinslogo" className="h-full w-full object-cover" />
        ) : (
          <span className="text-[10px] text-white/40">Logo</span>
        )}
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/svg+xml,image/webp"
        onChange={(e) => void handleFileChange(e)}
        className="hidden"
      />
      {error && <p className="max-w-[10rem] truncate text-xs text-red-400">{error}</p>}
    </div>
  )
}
