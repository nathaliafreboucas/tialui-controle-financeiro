import { FiAlertTriangle, FiExternalLink } from 'react-icons/fi'

interface Props {
  message: string
}

const INDEX_URL_REGEX = /(https:\/\/console\.firebase\.google\.com\/[^\s]+)/

function parseIndexUrl(message: string): string | null {
  const match = message.match(INDEX_URL_REGEX)
  return match ? match[1] : null
}

function friendlyMessage(message: string): string {
  if (message.includes('requires an index')) return 'A consulta requer um índice no Firestore.'
  if (message.includes('offline')) return 'O cliente está offline. Verifique sua conexão.'
  if (message.includes('permission') || message.includes('insufficient'))
    return 'Permissão negada. Verifique as regras de segurança do Firestore.'
  return message
}

export default function FirebaseErrorBanner({ message }: Props) {
  const indexUrl = parseIndexUrl(message)
  const friendly = friendlyMessage(message)

  return (
    <div role="alert" className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 p-4 text-sm text-red-700 dark:text-red-400 flex flex-col gap-2">
      <div className="flex items-center gap-2 font-semibold">
        <FiAlertTriangle className="shrink-0" />
        Erro ao conectar com o banco de dados
      </div>

      <p className="text-xs opacity-80">{friendly}</p>

      {indexUrl ? (
        <a
          href={indexUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs font-medium underline underline-offset-2 hover:opacity-80 transition-opacity"
        >
          <FiExternalLink className="shrink-0" />
          Criar índice no Firebase Console
        </a>
      ) : (
        <p className="text-xs opacity-60">
          Verifique se o Firestore está ativo e se as variáveis de ambiente estão corretas.
        </p>
      )}
    </div>
  )
}
