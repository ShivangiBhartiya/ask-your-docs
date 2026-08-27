import { useState } from 'react'
import { AuthProvider, useAuth } from './lib/auth'
import { useDocuments } from './lib/useDocuments'
import AuthScreen from './components/AuthScreen'
import Sidebar from './components/Sidebar'
import AskView from './components/AskView'

function AppShell() {
  const [resetKey, setResetKey] = useState(0)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const {
    documents,
    loading: documentsLoading,
    error: documentsError,
    refresh: refreshDocuments,
    uploads,
    uploadFiles,
    retryUpload,
    dismissUpload,
    deleteDocument,
  } = useDocuments()

  return (
    <div className="flex bg-bg">
      <Sidebar
        documents={documents}
        documentsLoading={documentsLoading}
        documentsError={documentsError}
        onRefreshDocuments={refreshDocuments}
        uploads={uploads}
        onUploadFiles={uploadFiles}
        onRetryUpload={retryUpload}
        onDismissUpload={dismissUpload}
        onDeleteDocument={deleteDocument}
        onNewQuestion={() => setResetKey((k) => k + 1)}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      <AskView documents={documents} resetKey={resetKey} onOpenSidebar={() => setSidebarOpen(true)} />
    </div>
  )
}

function Root() {
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <AppShell /> : <AuthScreen />
}

export default function App() {
  return (
    <AuthProvider>
      <Root />
    </AuthProvider>
  )
}
