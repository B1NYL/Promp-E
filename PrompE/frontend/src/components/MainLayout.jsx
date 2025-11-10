import React from 'react'
import { Outlet } from 'react-router-dom'
import Header from './Header'

function MainLayout() {
  return (
    <div className="main-layout">
      <Header />
      <main className="content-area">
        <Outlet />
      </main>
    </div>
  )
}

export default MainLayout