import { useEffect, useState } from 'react';

declare const __APP_VERSION__: string;
const LOCAL_VERSION = __APP_VERSION__;

export function useUpdateCheck() {
    const [updateAvailable, setUpdateAvailable] = useState(false);

    useEffect(() => {
        async function checkVersion() {
            try {
                // Buscamos o version.json do servidor com um parâmetro aleatório para evitar cache do próprio JSON
                const response = await fetch(`/version.json?t=${Date.now()}`, {
                    cache: 'no-store'
                });

                if (!response.ok) return;

                const data = await response.json();

                if (data.version !== LOCAL_VERSION) {
                    console.log(`[UpdateCheck] Nova versão disponível: ${data.version} (Atual: ${LOCAL_VERSION})`);
                    setUpdateAvailable(true);
                }
            } catch (error) {
                console.error('[UpdateCheck] Erro ao verificar versão:', error);
            }
        }

        // Verifica ao carregar
        checkVersion();

        // Verifica a cada 5 minutos (300000 ms)
        const interval = setInterval(checkVersion, 300000);

        return () => clearInterval(interval);
    }, []);

    const refreshPage = () => {
        // Força o recarregamento do servidor, ignorando o cache
        window.location.reload();
    };

    return { updateAvailable, refreshPage };
}
