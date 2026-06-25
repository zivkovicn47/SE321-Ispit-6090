import { useEffect, useState } from 'react'
import api from '../api/axios'

const STATUS_LABEL = { PENDING: 'Na čekanju', DELIVERED: 'Isporučena', CANCELLED: 'Poništena' }
const STATUS_BADGE = { PENDING: 'badge-pending', DELIVERED: 'badge-delivered', CANCELLED: 'badge-cancelled' }
const PM_LABEL = { CARD: 'Kartica', CASH_ON_DELIVERY: 'Pouzeće' }

export default function OrdersPage() {
  const [orders, setOrders] = useState([])

  useEffect(() => {
    api.get('/orders/my').then(r => setOrders(r.data)).catch(() => {})
  }, [])

  return (
    <div className="container page-content">
      <div className="page-header">
        <h1>Moje porudžbine</h1>
      </div>

      {orders.length === 0 ? (
        <p className="text-center" style={{ color: '#888', marginTop: 40 }}>Nemate porudžbina.</p>
      ) : (
        orders.map(order => (
          <div key={order.id} className="card mb-16">
            <div className="card-body">
              <div className="flex justify-between align-center mb-16">
                <div>
                  <span style={{ fontWeight: 600 }}>Porudžbina #{order.id}</span>
                  <span style={{ marginLeft: 12, color: '#888', fontSize: '0.85rem' }}>
                    {new Date(order.createdAt).toLocaleDateString('sr-RS')}
                  </span>
                </div>
                <div className="flex gap-8 align-center">
                  <span className={`badge ${STATUS_BADGE[order.status]}`}>{STATUS_LABEL[order.status]}</span>
                  <span style={{ fontSize: '0.85rem', color: '#666' }}>{PM_LABEL[order.paymentMethod]}</span>
                </div>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>Artikal</th>
                      <th>Kol.</th>
                      <th>Cena</th>
                      <th>Ukupno</th>
                    </tr>
                  </thead>
                  <tbody>
                    {order.items?.map(item => (
                      <tr key={item.id}>
                        <td>{item.article?.name}</td>
                        <td>{item.quantity}</td>
                        <td>{item.unitPrice?.toLocaleString('sr-RS')} RSD</td>
                        <td>{(item.unitPrice * item.quantity).toLocaleString('sr-RS')} RSD</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between align-center" style={{ marginTop: 12 }}>
                <span style={{ color: '#666', fontSize: '0.85rem' }}>
                  Adresa: {order.deliveryAddress}
                </span>
                <span style={{ fontWeight: 700, color: '#e94560' }}>
                  Ukupno: {order.totalPrice?.toLocaleString('sr-RS')} RSD
                </span>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  )
}
