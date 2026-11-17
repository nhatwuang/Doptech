import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import ProductCard from "../components/ProductCard";
import Loading from "../components/Loading";
const cats = [
  ["laptop", "bi-laptop", "Laptop"],
  ["dien-thoai", "bi-phone", "Điện thoại"],
  ["pc-gaming", "bi-pc-display", "PC Gaming"],
  ["cpu", "bi-cpu", "CPU"],
  ["gpu", "bi-gpu-card", "GPU"],
  ["ssd", "bi-device-ssd", "SSD"],
  ["man-hinh", "bi-display", "Màn hình"],
  ["chuot", "bi-mouse", "Chuột"],
];
export default function HomePage() {
  const [featured, setFeatured] = useState([]),
    [recs, setRecs] = useState([]),
    [loading, setLoading] = useState(true);
  useEffect(() => {
    Promise.all([api.get("/products/featured"), api.get("/ai/recommendations")])
      .then(([a, b]) => {
        setFeatured(a.data.data);
        setRecs(b.data.data);
      })
      .finally(() => setLoading(false));
  }, []);
  return (
    <>
      <div className="container mt-4">
        <section className="hero">
          <div className="row g-0 align-items-center">
            <div className="col-lg-6 p-5">
              <span className="badge bg-primary mb-3">
                DOPTECH · Technology for Everyone
              </span>
              <h1>Công nghệ phù hợp, lựa chọn thông minh.</h1>
              <p className="lead text-white-50">
                Laptop, điện thoại, PC và linh kiện với AI hỗ trợ tư vấn dựa
                trên sản phẩm thật trong hệ thống.
              </p>
              <div className="d-flex gap-2">
                <Link className="btn btn-primary btn-lg" to="/products">
                  Mua sắm ngay
                </Link>
                <button
                  className="btn btn-outline-light btn-lg"
                  onClick={() => document.querySelector(".ai-fab")?.click()}
                >
                  Hỏi DopTech AI
                </button>
              </div>
            </div>
            <div className="col-lg-6 hero-img" />
          </div>
        </section>
      </div>
      <div className="container py-5">
        <h2 className="section-title mb-4">Danh mục nổi bật</h2>
        <div className="row g-3">
          {cats.map(([slug, icon, name]) => (
            <div className="col-6 col-md-3 col-lg-2" key={slug}>
              <Link
                className="category-chip d-block"
                to={`/products?category=${slug}`}
              >
                <i className={`bi ${icon}`} />
                <div className="mt-2 fw-semibold">{name}</div>
              </Link>
            </div>
          ))}
        </div>
      </div>
      <div className="container pb-5">
        <div className="d-flex justify-content-between align-items-center mb-4">
          <h2 className="section-title m-0">Sản phẩm nổi bật</h2>
          <Link to="/products">Xem tất cả →</Link>
        </div>
        {loading ? (
          <Loading />
        ) : (
          <div className="row g-4">
            {featured.map((p) => (
              <div className="col-6 col-md-4 col-lg-3" key={p.ProductID}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        )}
      </div>
      <section className="bg-light py-5">
        <div className="container">
          <div className="d-flex align-items-end justify-content-between mb-4">
            <div>
              <div className="text-primary fw-bold">AI RECOMMENDATION</div>
              <h2 className="section-title mb-0">Gợi ý dành cho bạn</h2>
            </div>
            <button
              className="btn btn-dark"
              onClick={() => document.querySelector(".ai-fab")?.click()}
            >
              <i className="bi bi-stars" /> Tư vấn bằng AI
            </button>
          </div>
          <div className="row g-4">
            {recs.slice(0, 8).map((p) => (
              <div className="col-6 col-md-4 col-lg-3" key={p.ProductID}>
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
