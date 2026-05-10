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
      {label && <span className="input-label">{label}</span>}
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
        <div className="relative rounded-xl overflow-hidden border border-[#E8E0D8]">
          <img
            src={value}
            alt="预览"
            className="w-full max-h-[300px] object-contain bg-paper-50"
          />
          <div className="flex gap-2 p-2">
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => inputRef.current?.click()}
            >
              重新上传
            </button>
            <button
              type="button"
              className="btn btn-ghost btn-sm !text-negative-400"
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
          className={`py-12 px-6 text-center cursor-pointer rounded-xl transition-all duration-200 ${
            dragOver
              ? 'border-2 border-dashed border-brand-500 bg-brand-50'
              : 'border-2 border-dashed border-[#E8E0D8] bg-white'
          }`}
        >
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="none"
            stroke="#B8B8B8"
            strokeWidth="1.5"
            className="mx-auto mb-3"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <div className="text-sm text-[#8C8C8C]">拖拽图片到此处，或点击上传</div>
          <div className="text-[11px] text-[#B8B8B8] mt-1">支持 JPG、PNG，大小不超过 10MB</div>
        </div>
      )}
    </div>
  )
}
