import { FiRefreshCw, FiX } from 'react-icons/fi';
import { useUpdateCheck } from '../hooks/useUpdateCheck';
import { useState } from 'react';

export function UpdateNotification() {
    const { updateAvailable, refreshPage } = useUpdateCheck();
    const [closed, setClosed] = useState(false);

    if (!updateAvailable || closed) return null;

    return (
        <div className="fixed bottom-6 right-6 z-[9999] animate-bounce-in">
            <div className="bg-blue-600 text-white p-4 rounded-lg shadow-2xl flex flex-col gap-3 max-w-sm border border-blue-400">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                        <div className="p-2 bg-blue-500 rounded-full animate-pulse">
                            <FiRefreshCw size={20} />
                        </div>
                        <h3 className="font-bold text-sm">Atualização Disponível!</h3>
                    </div>
                    <button
                        onClick={() => setClosed(true)}
                        className="text-blue-100 hover:text-white transition-colors"
                    >
                        <FiX size={18} />
                    </button>
                </div>

                <p className="text-xs text-blue-50 leading-relaxed">
                    Uma nova versão do StokLink foi detectada. Para garantir que as permissões e funcionalidades funcionem corretamente, atualize agora.
                </p>

                <button
                    onClick={refreshPage}
                    className="bg-white text-blue-600 hover:bg-blue-50 px-4 py-2 rounded font-bold text-xs transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                    <FiRefreshCw size={14} />
                    ATUALIZAR SISTEMA
                </button>
            </div>
        </div>
    );
}
