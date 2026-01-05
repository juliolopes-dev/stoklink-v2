import { createContext, useContext, useState, ReactNode } from 'react'
import { FiAlertTriangle, FiCheckCircle, FiInfo, FiXCircle, FiX } from 'react-icons/fi'

type ModalType = 'confirm' | 'alert' | 'success' | 'error' | 'info'

interface ModalOptions {
  title: string
  message: string
  type?: ModalType
  confirmText?: string
  cancelText?: string
  onConfirm?: () => void
  onCancel?: () => void
}

interface ModalContextData {
  showModal: (options: ModalOptions) => void
  confirm: (title: string, message: string) => Promise<boolean>
  alert: (title: string, message: string, type?: 'success' | 'error' | 'info') => void
}

const ModalContext = createContext<ModalContextData>({} as ModalContextData)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [options, setOptions] = useState<ModalOptions | null>(null)
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null)

  function showModal(opts: ModalOptions) {
    setOptions(opts)
    setIsOpen(true)
  }

  function confirm(title: string, message: string): Promise<boolean> {
    return new Promise((resolve) => {
      setResolvePromise(() => resolve)
      showModal({
        title,
        message,
        type: 'confirm',
        confirmText: 'Confirmar',
        cancelText: 'Cancelar'
      })
    })
  }

  function alert(title: string, message: string, type: 'success' | 'error' | 'info' = 'info') {
    showModal({
      title,
      message,
      type,
      confirmText: 'OK'
    })
  }

  function handleConfirm() {
    if (resolvePromise) {
      resolvePromise(true)
      setResolvePromise(null)
    }
    options?.onConfirm?.()
    setIsOpen(false)
    setOptions(null)
  }

  function handleCancel() {
    if (resolvePromise) {
      resolvePromise(false)
      setResolvePromise(null)
    }
    options?.onCancel?.()
    setIsOpen(false)
    setOptions(null)
  }

  function getIcon() {
    switch (options?.type) {
      case 'confirm':
        return <FiAlertTriangle size={48} className="text-amber-500" />
      case 'success':
        return <FiCheckCircle size={48} className="text-green-500" />
      case 'error':
        return <FiXCircle size={48} className="text-red-500" />
      case 'info':
      default:
        return <FiInfo size={48} className="text-blue-500" />
    }
  }

  function getHeaderColor() {
    switch (options?.type) {
      case 'confirm':
        return 'bg-amber-50 border-amber-200'
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'info':
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  function getConfirmButtonColor() {
    switch (options?.type) {
      case 'confirm':
        return 'bg-amber-500 hover:bg-amber-600'
      case 'success':
        return 'bg-green-500 hover:bg-green-600'
      case 'error':
        return 'bg-red-500 hover:bg-red-600'
      case 'info':
      default:
        return 'bg-primary-600 hover:bg-primary-700'
    }
  }

  return (
    <ModalContext.Provider value={{ showModal, confirm, alert }}>
      {children}

      {isOpen && options && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100]">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden animate-fade-in">
            <div className={`p-6 border-b ${getHeaderColor()}`}>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                  {getIcon()}
                  <h2 className="text-xl font-semibold text-gray-800">{options.title}</h2>
                </div>
                <button
                  onClick={handleCancel}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <FiX size={24} />
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-gray-600 text-base leading-relaxed">{options.message}</p>
            </div>

            <div className="px-6 pb-6 flex justify-end gap-3">
              {options.type === 'confirm' && (
                <button
                  onClick={handleCancel}
                  className="px-5 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  {options.cancelText || 'Cancelar'}
                </button>
              )}
              <button
                onClick={handleConfirm}
                className={`px-5 py-2.5 text-white rounded-lg transition-colors font-medium ${getConfirmButtonColor()}`}
              >
                {options.confirmText || 'OK'}
              </button>
            </div>
          </div>
        </div>
      )}
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider')
  }
  return context
}
