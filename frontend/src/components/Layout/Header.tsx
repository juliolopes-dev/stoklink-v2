import { useState } from 'react'
import { FiLock } from 'react-icons/fi'

export function Header() {
  const [showAlert, setShowAlert] = useState(true)

  return (
    <>
      {showAlert && (
        <div className="bg-amber-50 border-b border-amber-200 px-6 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800">
              <FiLock size={16} />
              <span className="text-xs">
                <strong>Dica de segurança:</strong> Lembre-se de alterar sua senha regularmente. 
                Clique em <strong>"Alterar Senha"</strong> na sidebar.
              </span>
            </div>
            <button
              onClick={() => setShowAlert(false)}
              className="text-amber-600 hover:text-amber-800 text-xs font-medium"
            >
              Fechar
            </button>
          </div>
        </div>
      )}
    </>
  )
}
