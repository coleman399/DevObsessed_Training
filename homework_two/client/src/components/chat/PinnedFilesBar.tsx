interface Props {
  files: string[];
  onUnpin: (path: string) => void;
}

export function PinnedFilesBar({ files, onUnpin }: Props) {
  if (!files.length) return null;
  return (
    <div className="pinned-files-bar">
      <span className="pinned-files-label">Pinned</span>
      {files.map((f) => (
        <span key={f} className="pinned-file-pill">
          {f.split('/').pop()}
          <button type="button" className="pinned-file-remove" onClick={() => onUnpin(f)} aria-label={`Unpin ${f}`}>
            ×
          </button>
        </span>
      ))}
    </div>
  );
}
