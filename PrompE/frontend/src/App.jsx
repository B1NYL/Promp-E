import React from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ActivityProvider } from './services/ActivityContext'
import { ThemeProvider } from './services/ThemeContext'
import { CompletionProvider } from './services/CompletionContext'
import { MissionProvider } from './services/MissionContext';

// 레이아웃 및 독립 페이지
import MainLayout from './components/MainLayout'
import StartPage from './pages/StartPage'
import Base from './pages/Base'


// Stage 1 페이지들
import Stage1Main from './pages/Stage1/Stage1Main'
import ServiceUse from './pages/Stage1/ServiceUse'
import Chat from './pages/Stage1/Chat'
import EmojiTranslator from './pages/Stage1/EmojiTranslator'
import PromptComposition from './pages/Stage3/PromptComposition'

// Stage 2 페이지들
import Thinking from './pages/Stage2/Thinking';
import PromptPuzzle from './pages/Stage2/PromptPuzzle';
import Stage2Main from './pages/Stage2/Stage2Main'
// Stage 3 페이지
import Stage3Main from './pages/Stage3/Stage3Main'
import Cognition from './pages/Stage3/Cognition'
import Description from './pages/Stage3/Description'
import Situation from './pages/Stage3/Situation'
import Abstraction from './pages/Stage3/Abstraction'
import Verbalization from './pages/Stage3/Verbalization'
import BlockDrawing from './pages/Stage3/BlockDrawing'
import BlockAssembly from './pages/Stage3/BlockAssembly'
import BlockResult from './pages/Stage3/BlockResult'
import { UserProvider } from './services/UserContext';
import { GalleryProvider } from './services/GalleryContext';

import './css/App.css'

function App() {
  return (
    <ThemeProvider>
      <ActivityProvider>
        <CompletionProvider>
          <MissionProvider>
            <UserProvider>
              <GalleryProvider>
                <BrowserRouter>
                  <Routes>
                    {/* ==================================================== */}
                    {/* 공통 레이아웃이 적용되지 않는 페이지들 */}
                    {/* ==================================================== */}
                    <Route path="/" element={<StartPage />} />
                    <Route path="/base" element={<Base />} />

                    {/* Stage 1 상세 페이지 (독립 헤더) */}
                    <Route path="/stage1/service-use" element={<ServiceUse />} />
                    <Route path="/stage1/chat" element={<Chat />} />
                    <Route path="/stage1/emoji-translator" element={<EmojiTranslator />} />

                    {/* Stage 2 상세 페이지 */}
                    <Route path="/stage2/thinking" element={<Thinking />} />
                    <Route path="/stage2/puzzle" element={<PromptPuzzle />} />

                    {/* Stage 3 상세 페이지 (독립 헤더) */}
                    <Route path="/stage3/cognition" element={<Cognition />} />
                    <Route path="/stage3/description" element={<Description />} />
                    <Route path="/stage3/situation" element={<Situation />} />
                    <Route path="/stage3/abstraction" element={<Abstraction />} />
                    <Route path="/stage3/verbalization" element={<Verbalization />} />
                    <Route path="/stage3/block-drawing" element={<BlockDrawing />} />
                    <Route path="/stage3/block-assembly" element={<BlockAssembly />} />
                    <Route path="/stage3/block-result" element={<BlockResult />} />
                    <Route path="/stage3/PromptComposition" element={<PromptComposition />} />

                    {/* ==================================================== */}
                    {/* MainLayout을 통해 공통 헤더가 적용되는 페이지들 */}
                    {/* ==================================================== */}
                    <Route element={<MainLayout />}>
                      <Route path="/stage1" element={<Stage1Main />} />
                      <Route path="/stage2" element={<Stage2Main />} />
                      <Route path="/stage3" element={<Stage3Main />} />
                    </Route>

                  </Routes>
                </BrowserRouter>
              </GalleryProvider>
            </UserProvider>
          </MissionProvider>
        </CompletionProvider>
      </ActivityProvider>
    </ThemeProvider>
  )
}

export default App