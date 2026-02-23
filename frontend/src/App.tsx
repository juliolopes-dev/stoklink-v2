import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AppRoutes } from './routes'
import { UpdateNotification } from './components/UpdateNotification'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60, // 1 minuto
      refetchOnWindowFocus: true,
      retry: 1
    }
  }
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppRoutes />
      <UpdateNotification />
    </QueryClientProvider>
  )
}

export default App
