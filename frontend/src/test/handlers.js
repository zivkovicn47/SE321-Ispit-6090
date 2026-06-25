import { http, HttpResponse } from 'msw'

export const mockArticles = [
  {
    id: 1,
    name: 'Kočione pločice Bosch',
    description: 'Prednje kočione pločice.',
    price: 3500,
    stock: 15,
    category: 'Kočioni sistem',
    manufacturer: 'Bosch',
    partNumber: 'BP-123',
  },
  {
    id: 2,
    name: 'Filter ulja Mann',
    description: 'Filter ulja za dizel i benzin.',
    price: 850,
    stock: 0,
    category: 'Filteri',
    manufacturer: 'Mann',
    partNumber: 'W712/75',
  },
  {
    id: 3,
    name: 'Amortizer Monroe prednji',
    description: 'Prednji amortizer.',
    price: 8200,
    stock: 8,
    category: 'Vešanje',
    manufacturer: 'Monroe',
    partNumber: 'MN-G8201',
  },
]

export const handlers = [
  http.get('/api/articles', ({ request }) => {
    const url = new URL(request.url)
    const name = url.searchParams.get('name')
    const category = url.searchParams.get('category')

    let result = [...mockArticles]
    if (name) {
      result = result.filter(a =>
        a.name.toLowerCase().includes(name.toLowerCase())
      )
    }
    if (category) {
      result = result.filter(a => a.category === category)
    }
    return HttpResponse.json(result)
  }),

  http.post('/api/orders', () => {
    return HttpResponse.json({
      id: 42,
      status: 'PENDING',
      paymentMethod: 'CASH_ON_DELIVERY',
      totalPrice: 3500,
      items: [{ id: 1, quantity: 1, unitPrice: 3500 }],
      createdAt: new Date().toISOString(),
    })
  }),

  http.post('/api/notifications', () => {
    return HttpResponse.json({ id: 1, notified: false })
  }),
]
