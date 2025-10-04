interface LoadingScreenProps {
  message?: string
}

export function LoadingScreen({ message = 'Loading…' }: LoadingScreenProps) {
  return (
    <div className="flex h-screen w-full items-center justify-center bg-scheme-background">
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-biosphere-500 border-t-transparent" aria-hidden="true" />
        <p className="text-sm font-medium text-scheme-muted-text">{message}</p>
      </div>
    </div>
  )
}

export default LoadingScreen
