import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';

const productImages = {
  'headphone': 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400&h=300&fit=crop',
  'earbud': 'https://images.unsplash.com/photo-1590658268037-6bf12f032f55?w=400&h=300&fit=crop',
  'keyboard': 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=400&h=300&fit=crop',
  'usb': 'https://images.unsplash.com/photo-1623869675781-80aa31012a5a?w=400&h=300&fit=crop',
  'monitor': 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=400&h=300&fit=crop',
  'ssd': 'https://images.unsplash.com/photo-1600269452121-4f2416e55c28?w=400&h=300&fit=crop',
  'lamp': 'https://images.unsplash.com/photo-1507473885765-e6ed057ab6fe?w=400&h=300&fit=crop',
  'webcam': 'https://images.unsplash.com/photo-1587826080304-1236a0c7a64e?w=400&h=300&fit=crop',
  'charg': 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=300&fit=crop',
  'stand': 'https://images.unsplash.com/photo-1611078489935-0cb964de46d6?w=400&h=300&fit=crop',
  'mouse': 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400&h=300&fit=crop',
  'microphone': 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=400&h=300&fit=crop',
  'tablet': 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&h=300&fit=crop',
  'wifi': 'https://images.unsplash.com/photo-1558089687-f282ffcbc126?w=400&h=300&fit=crop',
  'dvd': 'https://images.unsplash.com/photo-1629429408209-1f912961dbd8?w=400&h=300&fit=crop',
};

const productEmojis = {
  'headphone': '🎧', 'earbud': '🎧',
  'keyboard': '⌨️',
  'usb': '🔌', 'hub': '🔌',
  'monitor': '🖥️', 'display': '🖥️',
  'ssd': '💾', 'storage': '💾', 'drive': '💾',
  'lamp': '💡', 'led': '💡', 'light': '💡',
  'webcam': '📷', 'camera': '📷',
  'charg': '🔋', 'power': '🔋',
  'stand': '💻', 'laptop': '💻',
  'mouse': '🖱️',
  'microphone': '🎤', 'mic': '🎤', 'podcast': '🎤',
  'tablet': '✏️', 'draw': '✏️', 'graphic': '✏️',
  'wifi': '📶', 'smart': '📱',
  'dvd': '💿', 'writer': '💿', 'external': '💿',
};

function getProductImage(name) {
  const lower = name.toLowerCase();
  for (const [key, url] of Object.entries(productImages)) {
    if (lower.includes(key)) return url;
  }
  return null;
}

function getEmoji(name) {
  const lower = name.toLowerCase();
  for (const [key, emoji] of Object.entries(productEmojis)) {
    if (lower.includes(key)) return emoji;
  }
  return '📦';
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addItem, items } = useCart();
  const [addedId, setAddedId] = useState(null);
  const [failedImages, setFailedImages] = useState(new Set());

  useEffect(() => {
    setLoading(true);
    fetchProducts();
  }, []);

  async function fetchProducts() {
    try {
      const res = await fetch('http://localhost:3000/api/products');
      const json = await res.json();
      setProducts(json.data || []);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }

  function handleAdd(product) {
    addItem(product, 1);
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1200);
  }

  function getStockLevel(qty) {
    if (qty === 0) return 'out';
    if (qty <= 5) return 'low';
    return 'in';
  }

  function getCartQty(productId) {
    const item = items.find((i) => i.product.id === productId);
    return item ? item.quantity : 0;
  }

  function imgFailed(id) {
    setFailedImages((prev) => new Set(prev).add(id));
  }

  if (loading) {
    return (
      <div className="page">
        <div className="page-header"><h2>Products</h2></div>
        <div className="product-grid">
          {[1,2,3,4,5,6].map((i) => (
            <div key={i} className="product-card skeleton">
              <div className="skeleton-img" />
              <div className="skeleton-line w-60" />
              <div className="skeleton-line w-40" />
              <div className="skeleton-line w-30" />
              <div className="skeleton-block" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page-header">
        <h2>Products</h2>
        <p className="page-subtitle">{products.length} items available</p>
      </div>

      <div className="product-grid">
        {products.length === 0 ? (
          <div className="empty-state full-width">
            <p>No products available right now.</p>
          </div>
        ) : (
          products.map((product) => {
            const stockLevel = getStockLevel(product.stock_quantity);
            const inCart = getCartQty(product.id);
            const showImg = !failedImages.has(product.id);

            return (
              <div key={product.id} className={`product-card ${addedId === product.id ? 'pop' : ''}`}>
                <div className="product-image-area">
                  {showImg ? (
                    <img
                      className="product-img"
                      src={getProductImage(product.name) || `https://picsum.photos/seed/${product.id}/400/300`}
                      alt={product.name}
                      onError={() => imgFailed(product.id)}
                      loading="lazy"
                    />
                  ) : (
                    <div className="product-img-fallback" style={{ background: getGradient(product.name) }}>
                      <span className="product-emoji">{getEmoji(product.name)}</span>
                    </div>
                  )}
                  <span className={`stock-badge stock-${stockLevel}`}>
                    {stockLevel === 'out' ? 'Out of Stock' : stockLevel === 'low' ? `${product.stock_quantity} left` : 'In Stock'}
                  </span>
                </div>

                <div className="product-body">
                  <h3>{product.name}</h3>
                  <p className="product-price">${parseFloat(product.price).toFixed(2)}</p>

                  <div className="stock-bar">
                    <div
                      className={`stock-bar-fill ${stockLevel}`}
                      style={{ width: `${Math.min((product.stock_quantity / 50) * 100, 100)}%` }}
                    />
                  </div>

                  {inCart > 0 && <p className="in-cart-info">{inCart} in cart</p>}

                  <button
                    className={`btn-add-cart ${addedId === product.id ? 'btn-added' : ''}`}
                    onClick={() => handleAdd(product)}
                    disabled={product.stock_quantity < 1}
                  >
                    {addedId === product.id
                      ? 'Added!'
                      : product.stock_quantity < 1
                      ? 'Out of Stock'
                      : 'Add to Cart'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

const gradients = [
  'linear-gradient(135deg, #667eea, #764ba2)',
  'linear-gradient(135deg, #f093fb, #f5576c)',
  'linear-gradient(135deg, #4facfe, #00f2fe)',
  'linear-gradient(135deg, #43e97b, #38f9d7)',
  'linear-gradient(135deg, #fa709a, #fee140)',
  'linear-gradient(135deg, #a18cd1, #fbc2eb)',
  'linear-gradient(135deg, #fccb90, #d57eeb)',
  'linear-gradient(135deg, #e0c3fc, #8ec5fc)',
  'linear-gradient(135deg, #f5576c, #ff6f91)',
  'linear-gradient(135deg, #30cfd0, #330867)',
  'linear-gradient(135deg, #a8edea, #fed6e3)',
  'linear-gradient(135deg, #5ee7df, #b490ca)',
  'linear-gradient(135deg, #d299c2, #fef9d7)',
  'linear-gradient(135deg, #f2709c, #ff9472)',
  'linear-gradient(135deg, #a1c4fd, #c2e9fb)',
];

function getGradient(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return gradients[Math.abs(hash) % gradients.length];
}
