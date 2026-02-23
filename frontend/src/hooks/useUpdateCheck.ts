import { useEffect, useState } from 'react';

// O timestamp local deve ser atualizado manualmente em novos deploys críticos
// ou capturado do version.json durante o build
const LOCAL_VERSION = '1.1.1';

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
