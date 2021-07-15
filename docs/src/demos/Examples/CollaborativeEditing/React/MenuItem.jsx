import React from 'react'
import './MenuItem.scss'

export default ({
  icon, title, action, isActive = null,
}) => (
    <button
      className={`menu-item${isActive && isActive() ? ' is-active' : ''}`}
      onClick={action}
      title={title}
    >
      <svg className="remix">
        <use xlinkHref={`${require('remixicon/fonts/remixicon.symbol.svg')}#ri-${icon}`} />
      </svg>
    </button>
)
