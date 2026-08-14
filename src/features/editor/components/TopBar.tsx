import type { RefObject } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import type Konva from 'konva'
import { useEditorStore } from '../store/editorStore'
import type { useProjectSave } from '../hooks/useProjectSave'
import { Button } from '../../../components/ui/Button'
import { LanguageSwitcher } from '../../../components/ui/LanguageSwitcher'
import { ExportMenu } from './ExportMenu'

export function TopBar({
  stageRef,
  save,
  backTo = '/dashboard',
  backLabel,
}: {
  stageRef: RefObject<Konva.Stage | null>
  save: ReturnType<typeof useProjectSave>
  backTo?: string
  backLabel?: string
}) {
  const { t } = useTranslation('editor')
  const navigate = useNavigate()
  const projectTitle = useEditorStore((s) => s.projectTitle)
  const setProjectTitle = useEditorStore((s) => s.setProjectTitle)
  const undo = useEditorStore((s) => s.undo)
  const redo = useEditorStore((s) => s.redo)
  const canUndo = useEditorStore((s) => s.past.length > 0)
  const canRedo = useEditorStore((s) => s.future.length > 0)

  const { handleSave, isSaving, saveError, isDirty, projectId } = save

  return (
    <header className="flex h-14 shrink-0 items-center gap-3 overflow-x-auto border-b border-pitch-700 bg-pitch-900 px-4">
      <button
        type="button"
        onClick={() => navigate(backTo)}
        className="shrink-0 rounded-md px-2 py-1 text-sm text-white/60 hover:bg-pitch-800 hover:text-white"
      >
        ← {backLabel ?? t('topBar.dashboard')}
      </button>

      <input
        value={projectTitle}
        onChange={(e) => setProjectTitle(e.target.value)}
        placeholder={t('topBar.projectNamePlaceholder')}
        title={t('topBar.projectNameTitle')}
        className="min-w-0 max-w-xs shrink truncate rounded-md border border-pitch-700 bg-pitch-800/60 px-2 py-1 text-sm font-medium text-white outline-none hover:border-pitch-600 focus:border-violet-accent focus:bg-pitch-800"
      />

      <div className="flex shrink-0 items-center gap-1">
        <Button variant="ghost" disabled={!canUndo} onClick={undo} title={t('topBar.undoTitle')}>
          {t('topBar.undo')}
        </Button>
        <Button variant="ghost" disabled={!canRedo} onClick={redo} title={t('topBar.redoTitle')}>
          {t('topBar.redo')}
        </Button>
      </div>

      {saveError && <p className="max-w-xs shrink-0 truncate text-xs text-red-400">{saveError}</p>}

      {!saveError && (
        <p className="shrink-0 text-xs text-white/40">
          {isSaving
            ? t('topBar.saving')
            : isDirty
              ? t('topBar.unsavedChanges')
              : projectId
                ? t('topBar.saved')
                : ''}
        </p>
      )}

      <div className="ml-auto flex shrink-0 items-center gap-3">
        <LanguageSwitcher />
        <ExportMenu stageRef={stageRef} />

        <Button
          onClick={() => void handleSave()}
          loading={isSaving}
          disabled={!isDirty && Boolean(projectId)}
          title={t('topBar.saveTitle')}
        >
          {t('topBar.save')}
        </Button>
      </div>
    </header>
  )
}
