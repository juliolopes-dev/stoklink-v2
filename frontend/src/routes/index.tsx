import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from '../contexts/AuthContext'
import { ModalProvider } from '../contexts/ModalContext'
import { PrivateRoute } from '../components/PrivateRoute'
import { Layout } from '../components/Layout'
import { Login } from '../pages/Login'
import { Dashboard } from '../pages/Dashboard'
import { NotasFiscais } from '../pages/NotasFiscais'
import { NotaFiscalDetalhes } from '../pages/NotasFiscais/NotaFiscalDetalhes'
import { NovaNotaFiscal } from '../pages/NotasFiscais/NovaNotaFiscal'
import { Conferencias } from '../pages/Conferencias'
import { ConferenciaItens } from '../pages/Conferencias/ConferenciaItens'
import { Divergencias } from '../pages/Divergencias'
import { Distribuicoes } from '../pages/Distribuicoes'
import { Relatorios } from '../pages/Relatorios'
import { Fornecedores } from '../pages/Fornecedores'
import { Filiais } from '../pages/Filiais'
import { Usuarios } from '../pages/Usuarios'
import { Registro } from '../pages/Registro'

export function AppRoutes() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ModalProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="notas-fiscais" element={<NotasFiscais />} />
            <Route path="notas-fiscais/nova" element={<NovaNotaFiscal />} />
            <Route path="notas-fiscais/:id" element={<NotaFiscalDetalhes />} />
            <Route path="conferencias" element={<Conferencias />} />
            <Route path="conferencias/:id/itens" element={<ConferenciaItens />} />
            <Route path="divergencias" element={<Divergencias />} />
            <Route path="distribuicoes" element={<Distribuicoes />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="fornecedores" element={<Fornecedores />} />
            <Route path="filiais" element={<Filiais />} />
            <Route path="usuarios" element={<Usuarios />} />
            <Route path="configuracoes" element={<div className="text-gray-500">Configurações - Em desenvolvimento</div>} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </ModalProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
