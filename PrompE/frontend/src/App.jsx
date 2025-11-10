import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import StartPage from './pages/StartPage'
import Base from './pages/Base'
import Stage1Main from './pages/Stage1/Stage1Main'
import Stage2Main from './pages/Stage2/Stage2Main'
import Stage3Main from './pages/Stage3/Stage3Main'
import ServiceUse from './pages/Stage1/ServiceUse'
import Chat from './pages/Stage1/Chat'
import Cognition from './pages/Stage2/Cognition'
import Description from './pages/Stage2/Description'
import Situation from './pages/Stage2/situation'
import MainLayout from './components/MainLayout'
import Abstraction  from './pages/Stage2/Abstraction'
import Verbalization from './pages/Stage2/Verbalization'
import './css/App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<StartPage />} />
        <Route path="/base" element={<Base />} />
        <Route element={<MainLayout />}>
          {/* Stage1 */}
          <Route path="/stage1" element={<Stage1Main />} />
          <Route path="/stage1/service-use" element={<ServiceUse />} />
          <Route path="/stage1/chat" element={<Chat />} />
          {/* Stage2 */}
          <Route path="/stage2" element={<Stage2Main />} />
          <Route path="/stage2/cognition" element={<Cognition />} />
          <Route path="/stage2/description" element={<Description />} />
          <Route path="/stage2/situation" element={<Situation />} />
          <Route path="/stage2/abstraction" element={<Abstraction />} />
          <Route path="/stage2/verbalization" element={<Verbalization />} />
          {/* Stage3 */}
          <Route path="/stage3" element={<Stage3Main />} />
          </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App