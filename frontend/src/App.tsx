import { BrowserRouter, Routes, Route } from 'react-router-dom'
import DriverPage from './features/driver/DriverPage'
import ManagerPage from './features/manager/ManagerPage'
import AdminPage from './features/admin/AdminPage'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<DriverPage />} />

        <Route
          path="/manage/:token"
          element={<ManagerPage />}
        />

        <Route
          path="/admin"
          element={<AdminPage />}
        />
      </Routes>
    </BrowserRouter>
  )
}