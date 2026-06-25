import { createContext, useContext, useState } from 'react'

const CartContext = createContext(null)

export function CartProvider({ children }) {
  const [items, setItems] = useState([])

  const addItem = (article, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(i => i.article.id === article.id)
      if (existing) {
        return prev.map(i =>
          i.article.id === article.id
            ? { ...i, quantity: i.quantity + quantity }
            : i
        )
      }
      return [...prev, { article, quantity }]
    })
  }

  const removeItem = (articleId) => {
    setItems(prev => prev.filter(i => i.article.id !== articleId))
  }

  const updateQuantity = (articleId, quantity) => {
    if (quantity <= 0) { removeItem(articleId); return }
    setItems(prev => prev.map(i =>
      i.article.id === articleId ? { ...i, quantity } : i
    ))
  }

  const clearCart = () => setItems([])

  const total = items.reduce((sum, i) => sum + i.article.price * i.quantity, 0)

  return (
    <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, total }}>
      {children}
    </CartContext.Provider>
  )
}

export const useCart = () => useContext(CartContext)
