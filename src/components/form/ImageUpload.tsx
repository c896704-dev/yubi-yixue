import { useRef, useState } from 'react'

interface ImageUploadProps {
  value: string | null
  onChange: (base64: string | null) => void
  label?: string
  accept?: string
  className?: string
}

export function ImageUpload({
  value,
  onChange,
  label = '上传图片',
  accept = 'image/*',
  className = '',
}: ImageUploadProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const reader = new FileReader()
    reader.onload = () => onChange(reader.result as string)
    reader.readAsDataURL(file)
  }

  return (
    <div className={className}>
      {label && <span className="field-label">{label}</span>}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) handleFile(f)
          e.target.value = ''
        }}
      />
      {value ? (
        <div className="relative rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
          <img
            src={value}
            alt="预览"
            className="w-full max-h-[300px] object-contain"
            style={{ backgroundColor: 'var(--bg)' }}
          />
          <div className="flex gap-2 p-2">
            <button
              type="button"
              className="btn btn-clear btn-sm"
              onClick={() => inputRef.current?.click()}
            >
              重新上传
            </button>
            <button
              type="button"
              className="btn btn-clear btn-sm"
              style={{ color: 'var(--danger)' }}
              onClick={() => onChange(null)}
            >
              删除
            </button>
          </div>
        </div>
      ) : (
        <div
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setDragOver(false)
            const f = e.dataTransfer.files[0]
            if (f) handleFile(f)
          }}
          className="py-10 px-6 text-center cursor-pointer rounded-lg transition-all duration-200 border-2 border-dashed"
          style={{
            borderColor: dragOver ? 'var(--primary)' : 'var(--border)',
            backgroundColor: dragOver ? 'var(--primary-light)' : 'var(--bg)',
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            className="mx-auto mb-3"
            style={{ color: 'var(--muted)' }}
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div className="text-sm" style={{ color: 'var(--muted)' }}>拖拽图片到此处，或点击上传</div>
          <div className="text-[11px] mt-1" style={{ color: 'var(--muted)' }}>支持 JPG、PNG，大小不超过 10MB</div>
        </div>
      )}
    </div>
  )
}
