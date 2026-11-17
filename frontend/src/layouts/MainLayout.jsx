import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import AIChat from "../components/AIChat";
import BackendStatus from "../components/BackendStatus";
export default function MainLayout() {
  const { user, logout, isAdmin, isStaff } = useAuth();
  const { count } = useCart();
  const nav = useNavigate();
  const signout = () => {
    logout();
    nav("/");
  };
  return (
    <div className="app-shell">
      <div className="top-strip">
        Miễn phí giao hàng đơn từ 5 triệu · Hỗ trợ 8:00–22:00
      </div>
      <header className="site-header">
        <div className="container py-3 d-flex align-items-center gap-3">
          <Link
            to="/"
            className="brand-logo-link"
            aria-label="DopTech - Trang chủ"
          >
            <img
              src="/images/doptech-logo.png"
              alt="DopTech"
              className="brand-logo"
            />
          </Link>
          <form
            className="search-box flex-grow-1"
            onSubmit={(e) => {
              e.preventDefault();
              const q = e.currentTarget.q.value.trim();
              if (q) nav(`/products?search=${encodeURIComponent(q)}`);
            }}
          >
            <i className="bi bi-search" />
            <input name="q" placeholder="Tìm laptop, iPhone, SSD 1TB..." />
            <button>Tìm kiếm</button>
          </form>
          <NavLink className="header-icon" to="/compare">
            <i className="bi bi-arrow-left-right" />
            <span>So sánh</span>
          </NavLink>
          <NavLink className="header-icon position-relative" to="/cart">
            <i className="bi bi-cart3" />
            <span>Giỏ hàng</span>
            {count > 0 && <b className="cart-count">{count}</b>}
          </NavLink>
          {user ? (
            <div className="dropdown">
              <button
                className="header-icon border-0 bg-transparent dropdown-toggle"
                data-bs-toggle="dropdown"
              >
                <i className="bi bi-person-circle" />
                <span>
                  {user.FullName?.split(" ").slice(-1)[0] || "Tài khoản"}
                </span>
              </button>
              <ul className="dropdown-menu dropdown-menu-end">
                <li>
                  <Link className="dropdown-item" to="/profile">
                    Hồ sơ
                  </Link>
                </li>
                {isAdmin && (
                  <li>
                    <Link className="dropdown-item" to="/admin">
                      Quản trị
                    </Link>
                  </li>
                )}
                {isStaff && (
                  <li>
                    <Link className="dropdown-item" to="/staff/orders">
                      Nhân viên
                    </Link>
                  </li>
                )}
                <li>
                  <Link className="dropdown-item" to="/orders">
                    Đơn hàng
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/wishlist">
                    Yêu thích
                  </Link>
                </li>
                <li>
                  <Link className="dropdown-item" to="/notifications">
                    Thông báo
                  </Link>
                </li>
                <li>
                  <hr className="dropdown-divider" />
                </li>
                <li>
                  <button className="dropdown-item" onClick={signout}>
                    Đăng xuất
                  </button>
                </li>
              </ul>
            </div>
          ) : (
            <Link className="header-icon" to="/login">
              <i className="bi bi-person" />
              <span>Đăng nhập</span>
            </Link>
          )}
        </div>
        <nav className="nav-row">
          <div className="container d-flex gap-4 overflow-auto">
            <NavLink to="/">Trang chủ</NavLink>
            <NavLink to="/products?category=laptop">Laptop</NavLink>
            <NavLink to="/products?category=dien-thoai">Điện thoại</NavLink>
            <NavLink to="/products?category=pc-gaming">PC</NavLink>
            <NavLink to="/products?category=cpu">Linh kiện</NavLink>
            <NavLink to="/products?category=phu-kien">Phụ kiện</NavLink>
            <NavLink to="/products?sort=price_asc">Khuyến mãi</NavLink>
          </div>
        </nav>
      </header>
      <BackendStatus />
      <main>
        <Outlet />
      </main>
      <footer className="footer mt-5">
        <div className="container py-5">
          <div className="row g-4">
            <div className="col-md-4">
              <div className="brand mb-3">
                <span>DOP</span>TECH
              </div>
              <p>
                Technology for Everyone — đồ án thương mại điện tử công nghệ
                tích hợp AI.
              </p>
            </div>
            <div className="col-md-2">
              <h6>Về DopTech</h6>
              <p>Giới thiệu</p>
              <p>Chính sách</p>
            </div>
            <div className="col-md-3">
              <h6>Hỗ trợ</h6>
              <p>Hướng dẫn mua hàng</p>
              <p>Đổi trả & bảo hành</p>
            </div>
            <div className="col-md-3">
              <h6>Liên hệ</h6>
              <p>support@doptech.local</p>
              <p>Demo project · localhost</p>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          © 2026 DOPTECH — Information Systems Project
        </div>
      </footer>
      <AIChat />
    </div>
  );
}
