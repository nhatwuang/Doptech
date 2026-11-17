import { Link } from "react-router-dom";
import { money } from "../utils/format";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { addCompare } from "../utils/compare";
import api from "../services/api";
export default function ProductCard({ product }) {
  const { add } = useCart();
  const { isCustomer } = useAuth();
  const price = product.DiscountPrice ?? product.Price;
  const sale = product.DiscountPrice
    ? Math.round((1 - product.DiscountPrice / product.Price) * 100)
    : 0;
  const cart = async () => {
    if (!isCustomer) return alert("Vui lòng đăng nhập tài khoản khách hàng");
    try {
      await add(product.ProductID, 1);
      alert("Đã thêm vào giỏ hàng");
    } catch (e) {
      alert(e.response?.data?.message || "Không thể thêm giỏ hàng");
    }
  };
  const wish = async () => {
    if (!isCustomer) return alert("Vui lòng đăng nhập");
    try {
      await api.post(`/wishlist/${product.ProductID}`);
      alert("Đã thêm vào yêu thích");
    } catch (e) {
      alert(e.response?.data?.message || "Lỗi wishlist");
    }
  };
  return (
    <div className="product-card h-100">
      <div className="product-image-wrap">
        {sale > 0 && <span className="sale-badge">-{sale}%</span>}
        <Link to={`/products/${product.Slug || product.ProductID}`}>
          <img
            src={product.Thumbnail || "/placeholder.svg"}
            onError={(e) => {
              e.currentTarget.src = "/placeholder.svg";
            }}
            alt={product.ProductName}
          />
        </Link>
      </div>
      <div className="p-3 d-flex flex-column h-100">
        <div className="text-uppercase small text-secondary">
          {product.BrandName || "DopTech"}
        </div>
        <Link
          className="product-name"
          to={`/products/${product.Slug || product.ProductID}`}
        >
          {product.ProductName}
        </Link>
        <div className="small text-warning my-2">
          <i className="bi bi-star-fill" />{" "}
          {Number(product.AverageRating || 0).toFixed(1)}{" "}
          <span className="text-secondary">
            · Đã bán {product.SoldCount || 0}
          </span>
        </div>
        <div className="mt-auto">
          <div className="d-flex align-items-end gap-2">
            <strong className="price">{money(price)}</strong>
            {product.DiscountPrice && (
              <del className="small text-secondary">{money(product.Price)}</del>
            )}
          </div>
          <div className="d-flex gap-2 mt-3">
            <button className="btn btn-primary flex-grow-1" onClick={cart}>
              <i className="bi bi-cart-plus" /> Thêm
            </button>
            <button
              className="btn btn-outline-secondary"
              title="Yêu thích"
              onClick={wish}
            >
              <i className="bi bi-heart" />
            </button>
            <button
              className="btn btn-outline-secondary"
              title="So sánh"
              onClick={() => {
                try {
                  addCompare(product.ProductID);
                  alert("Đã thêm vào so sánh");
                } catch (e) {
                  alert(e.message);
                }
              }}
            >
              <i className="bi bi-arrow-left-right" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
