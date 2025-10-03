import { ThemeProvider } from '@/contexts/ThemeContext'
import HomePage from '@/pages/home'

function App() {
  return (
    <ThemeProvider>
      <HomePage />
    </ThemeProvider>
  )
}

export default App
