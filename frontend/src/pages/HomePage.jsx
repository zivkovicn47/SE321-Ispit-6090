import { useState, useEffect } from 'react'
import api from '../api/axios'
import { useCart } from '../context/CartContext'
import NotifyModal from '../components/NotifyModal'

const CATEGORIES = ['Kočioni sistem', 'Filteri', 'Vešanje', 'Motor', 'Elektrika', 'Karoserija', 'Ostalo']

export default function HomePage() {
  const [articles, setArticles] = useState([])
  const [filters, setFilters] = useState({ name: '', category: '', manufacturer: '', minPrice: '', maxPrice: '' })
  const [notifyArticle, setNotifyArticle] = useState(null)
  const [addedId, setAddedId] = useState(null)
  const [error, setError] = useState(null)
  const { addItem } = useCart()

  const fetchArticles = async (activeFilters = filters) => {
    setError(null)
    const params = {}
    if (activeFilters.name) params.name = activeFilters.name
    if (activeFilters.category) params.category = activeFilters.category
    if (activeFilters.manufacturer) params.manufacturer = activeFilters.manufacturer
    if (activeFilters.minPrice) params.minPrice = activeFilters.minPrice
    if (activeFilters.maxPrice) params.maxPrice = activeFilters.maxPrice
    try {
      const res = await api.get('/articles', { params })
      setArticles(res.data)
    } catch {
      setError('Greška pri učitavanju artikala. Pokušajte ponovo.')
      setArticles([])
    }
  }

  useEffect(() => { fetchArticles() }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchArticles()
  }

  const handleAdd = (article) => {
    addItem(article)
    setAddedId(article.id)
    setTimeout(() => setAddedId(null), 1500)
  }

  return (
    <div className="container page-content">
      <div className="page-header">
        <h1>Katalog auto delova</h1>
        <p>Pretražite naš asortiman sa filterima</p>
      </div>

      <form className="filters-bar" onSubmit={handleSearch}>
        <div className="filter-group">
          <label>Naziv</label>
          <input
            placeholder="npr. kočione pločice"
            value={filters.name}
            onChange={e => setFilters({ ...filters, name: e.target.value })}
          />
        </div>
        <div className="filter-group">
          <label>Kategorija</label>
          <select value={filters.category} onChange={e => setFilters({ ...filters, category: e.target.value })}>
            <option value="">Sve kategorije</option>
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div className="filter-group">
          <label>Proizvođač</label>
          <input
            placeholder="npr. Bosch"
            value={filters.manufacturer}
            onChange={e => setFilters({ ...filters, manufacturer: e.target.value })}
          />
        </div>
        <div className="filter-group">
          <label>Min. cena (RSD)</label>
          <input
            type="number"
            placeholder="0"
            value={filters.minPrice}
            onChange={e => setFilters({ ...filters, minPrice: e.target.value })}
          />
        </div>
        <div className="filter-group">
          <label>Max. cena (RSD)</label>
          <input
            type="number"
            placeholder="100000"
            value={filters.maxPrice}
            onChange={e => setFilters({ ...filters, maxPrice: e.target.value })}
          />
        </div>
        <button type="submit" className="btn btn-primary">Pretraži</button>
        <button type="button" className="btn btn-outline" onClick={() => {
          const emptyFilters = { name: '', category: '', manufacturer: '', minPrice: '', maxPrice: '' }
          setFilters(emptyFilters)
          fetchArticles(emptyFilters)
        }}>Resetuj</button>
      </form>

      {error ? (
        <p role="alert" className="alert alert-error">{error}</p>
      ) : articles.length === 0 ? (
        <p className="text-center mt-20" style={{ color: '#888' }}>Nema pronađenih artikala.</p>
      ) : (
        <div className="articles-grid">
          {articles.map(article => (
            <div key={article.id} className="article-card">
              <div className="article-img">🔧</div>
              <div className="article-info">
                <div className="article-name">{article.name}</div>
                <div className="article-category">{article.category} · {article.manufacturer}</div>
                <div className="article-price">{article.price?.toLocaleString('sr-RS')} RSD</div>
                <div className="article-stock">
                  {article.stock > 0
                    ? <span className="stock-in">Na stanju ({article.stock} kom)</span>
                    : <span className="stock-out">Nije na stanju</span>
                  }
                </div>
                {article.stock > 0 ? (
                  <button
                    className={`btn btn-primary btn-sm full-width`}
                    onClick={() => handleAdd(article)}
                  >
                    {addedId === article.id ? 'Dodato!' : 'Dodaj u korpu'}
                  </button>
                ) : (
                  <button
                    className="btn btn-outline btn-sm full-width"
                    onClick={() => setNotifyArticle(article)}
                  >
                    Obavesti me
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {notifyArticle && (
        <NotifyModal article={notifyArticle} onClose={() => setNotifyArticle(null)} />
      )}
    </div>
  )
}
