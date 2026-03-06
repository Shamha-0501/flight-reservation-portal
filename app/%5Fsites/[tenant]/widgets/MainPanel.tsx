"use client";

import React, { useState } from 'react'
import SideNavbar, { MenuKey } from './SideNavbar'
import TenantPanels from './TenantPanels';

export default function MainPanel() {
  const [currentMenu, onChangeMenu] = useState<MenuKey>('home');

  return (
    <div className='w-full flex'>
        <SideNavbar currentMenu={currentMenu} onChangeMenu={onChangeMenu}/>
        <TenantPanels currentMenu={currentMenu} />
    </div>
  )
}
