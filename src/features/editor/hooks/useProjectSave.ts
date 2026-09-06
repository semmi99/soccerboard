import { useCallback, useEffect, useRef, useState, type RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type Konva from 'konva'
import { useEditorStore } from '../store/editorStore'
import { useAuthStore } from '../../auth/store/authStore'
import { limitsForTier } from '../../../lib/limits'
import { countProjects, saveProject, updateProjectThumbnail, uploadProjectThumbnail } from '../../../lib/supabase/projects'

const THUMBNAIL_WIDTH = 320

export function useProjectSave(stageRef?: RefObject<Konva.Stage | null>) {
  const { t } = useTranslation('editor')
  const navigate = useNavigate()
  const projectId = useEditorStore((s) => s.projectId)
  const projectTitle = useEditorStore((s) => s.projectTitle)
  const pitchDesign = useEditorStore((s) => s.pitchDesign)
  const pitchDesignCustomId = useEditorStore((s) => s.pitchDesignCustomId)
  const orientation = useEditorStore((s) => s.orientation)
  const zoneGridStyle = useEditorStore((s) => s.zoneGridStyle)
  const zoneGridCustomId = useEditorStore((s) => s.zoneGridCustomId)
  const showPitchMarkings = useEditorStore((s) => s.showPitchMarkings)
  const showMovementTrails = useEditorStore((s) => s.showMovementTrails)
  const playerLabelFormat = useEditorStore((s) => s.playerLabelFormat)
  const fieldCrop = useEditorStore((s) => s.fieldCrop)
  const fieldMirrored = useEditorStore((s) => s.fieldMirrored)
  const pitchLengthM = useEditorStore((s) => s.pitchLengthM)
  const pitchWidthM = useEditorStore((s) => s.pitchWidthM)
  const teamId = useEditorStore((s) => s.teamId)
  const customKit = useEditorStore((s) => s.customKit)
  const secondaryKit = useEditorStore((s) => s.secondaryKit)
  const activeKitSlot = useEditorStore((s) => s.activeKitSlot)
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
          setSaveError(t('projectSave.limitReachedError', { max: maxProjects }))
          return
        }
      }

      const savedId = await saveProject({
        projectId,
        orgId: organization.id,
        createdBy: profile.id,
        title: projectTitle,
        pitchDesign,
        pitchDesignCustomId,
        orientation,
        teamId,
        zoneGridStyle,
        zoneGridCustomId,
        showPitchMarkings,
        showMovementTrails,
        playerLabelFormat,
        fieldCrop,
        fieldMirrored,
        pitchLengthM,
        pitchWidthM,
        customKit,
        secondaryKit,
        activeKitSlot,
        frames,
      })

      if (!projectId) {
        setProjectIdInStore(savedId)
        navigate(`/editor/${savedId}`, { replace: true })
      }
      markSaved()

      // Best-effort: the dashboard card is still useful with the old/no
      // thumbnail if this fails, so it must never turn into a save error.
      const stage = stageRef?.current
      if (stage) {
        try {
          const pixelRatio = Math.min(1, THUMBNAIL_WIDTH / stage.width())
          const dataUrl = stage.toDataURL({ mimeType: 'image/jpeg', quality: 0.7, pixelRatio })
          const url = await uploadProjectThumbnail(organization.id, savedId, dataUrl)
          await updateProjectThumbnail(savedId, url)
        } catch {
          // Ignored — see comment above.
        }
      }
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : t('projectSave.saveFailed'))
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }, [
    organization,
    profile,
    stageRef,
    projectId,
    projectTitle,
    pitchDesign,
    pitchDesignCustomId,
    orientation,
    teamId,
    customKit,
    secondaryKit,
    activeKitSlot,
    zoneGridStyle,
    zoneGridCustomId,
    showPitchMarkings,
    showMovementTrails,
    playerLabelFormat,
    fieldCrop,
    fieldMirrored,
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
