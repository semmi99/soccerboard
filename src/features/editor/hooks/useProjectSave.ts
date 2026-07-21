import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../../auth/store/authStore'
import { limitsForTier } from '../../../lib/limits'
import { countProjects, saveProject } from '../../../lib/supabase/projects'

export function useProjectSave() {
  const navigate = useNavigate()
  const projectId = useEditorStore((s) => s.projectId)
  const projectTitle = useEditorStore((s) => s.projectTitle)
  const pitchDesign = useEditorStore((s) => s.pitchDesign)
  const orientation = useEditorStore((s) => s.orientation)
  const zoneGridStyle = useEditorStore((s) => s.zoneGridStyle)
  const zoneGridCustomId = useEditorStore((s) => s.zoneGridCustomId)
  const showPitchMarkings = useEditorStore((s) => s.showPitchMarkings)
  const fieldCrop = useEditorStore((s) => s.fieldCrop)
  const pitchLengthM = useEditorStore((s) => s.pitchLengthM)
  const pitchWidthM = useEditorStore((s) => s.pitchWidthM)
  const teamId = useEditorStore((s) => s.teamId)
  const customKit = useEditorStore((s) => s.customKit)
  const frames = useEditorStore((s) => s.frames)
  const isDirty = useEditorStore((s) => s.isDirty)
  const markSaved = useEditorStore((s) => s.markSaved)
  const setProjectIdInStore = useEditorStore((s) => s.setProjectId)

  const organization = useAuthStore((s) => s.organization)
  const profile = useAuthStore((s) => s.profile)

  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  // React state updates aren't visible synchronously, so two calls to
  // handleSave arriving close together (a fast double-click, or the
  // keyboard-shortcut listener re-registering) could both read `isSaving`
  // as false and race — both inserting the same client-generated frame/
  // frame_objects ids and one of them hitting a primary-key conflict. A
  // ref is updated immediately, so the second call sees it right away.
  const isSavingRef = useRef(false)

  const handleSave = useCallback(async () => {
    if (!organization || !profile) return
    if (isSavingRef.current) return
    isSavingRef.current = true
    setIsSaving(true)
    setSaveError(null)

    try {
      if (!projectId) {
        const maxProjects = limitsForTier(organization).maxProjects
        const existing = await countProjects(organization.id)
        if (existing >= maxProjects) {
          setSaveError(`Free-Limit erreicht: maximal ${maxProjects} Projekte. Upgrade für mehr.`)
          return
        }
      }

      const savedId = await saveProject({
        projectId,
        orgId: organization.id,
        createdBy: profile.id,
        title: projectTitle,
        pitchDesign,
        orientation,
        teamId,
        zoneGridStyle,
        zoneGridCustomId,
        showPitchMarkings,
        fieldCrop,
        pitchLengthM,
        pitchWidthM,
        customKit,
        frames,
      })

      if (!projectId) {
        setProjectIdInStore(savedId)
        navigate(`/editor/${savedId}`, { replace: true })
      }
      markSaved()
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }, [
    organization,
    profile,
    projectId,
    projectTitle,
    pitchDesign,
    orientation,
    teamId,
    customKit,
    zoneGridStyle,
    zoneGridCustomId,
    showPitchMarkings,
    fieldCrop,
    pitchLengthM,
    pitchWidthM,
    frames,
    navigate,
    setProjectIdInStore,
    markSaved,
  ])

  // Autosave: once nothing has changed for AUTOSAVE_DELAY_MS, save
  // automatically — so forgetting Strg+S never loses work. handleSave's own
  // identity already changes on every tracked field (frames, title, pitch
  // settings, ...), so watching it here is enough to reset the debounce on
  // any edit without repeating that whole dependency list.
  const AUTOSAVE_DELAY_MS = 3000
  useEffect(() => {
    if (!isDirty) return
    const timer = setTimeout(() => {
      void handleSave()
    }, AUTOSAVE_DELAY_MS)
    return () => clearTimeout(timer)
  }, [isDirty, handleSave])

  return { handleSave, isSaving, saveError, isDirty, projectId }
}
