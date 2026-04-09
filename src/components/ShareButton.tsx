'use client'

import { useState } from 'react'
import { IoShareSocialOutline, IoCheckmarkOutline, IoCopyOutline } from 'react-icons/io5'

interface Props {
  invoiceId: string
}

export default function ShareButton({ invoiceId }: Props) {
  const [copied, setCopied] = useState(false)

  const link = `https://tialui.vercel.app/invoice/${invoiceId}`

  async function handleShare() {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: 'Cobrança Tialúi',
          text: 'Ei, Tialúi, me paga!',
          url: link,
        })
        return
      } catch {
        // User cancelled share — fall through to clipboard
      }
    }

    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2500)
  }

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-900 dark:bg-zinc-50 text-white dark:text-zinc-900 text-sm font-medium hover:bg-zinc-700 dark:hover:bg-zinc-200 transition-colors"
      aria-label="Compartilhar cobrança"
    >
      {copied ? (
        <>
          <IoCheckmarkOutline className="text-base" />
          Link copiado!
        </>
      ) : (
        <>
          <IoShareSocialOutline className="text-base" />
          Compartilhar cobrança
        </>
      )}
    </button>
  )
}
