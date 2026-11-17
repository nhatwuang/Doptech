import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
const items = [
  ["/admin", "bi-speedometer2", "Dashboard"],
  ["/admin/products", "bi-box-seam", "Sản phẩm"],
  ["/admin/categories", "bi-grid", "Danh mục"],
  ["/admin/brands", "bi-tags", "Thương hiệu"],
  ["/admin/orders", "bi-receipt", "Đơn hàng"],
  ["/admin/customers", "bi-people", "Khách hàng"],
  ["/admin/staff", "bi-person-badge", "Nhân viên"],
  ["/admin/inventory", "bi-building", "Kho hàng"],
  ["/admin/coupons", "bi-ticket-perforated", "Voucher"],
  ["/admin/reviews", "bi-star", "Đánh giá"],
  ["/admin/reports", "bi-bar-chart", "Báo cáo"],
];
export default function AdminLayout() {
  const { user } = useAuth();
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="brand text-white mb-4" to="/">
          <span>DOP</span>TECH
        </Link>
        <div className="small text-uppercase opacity-50 mb-2">
          Quản trị hệ thống
        </div>
        {items.map(([to, icon, label]) => (
          <NavLink key={to} end={to === "/admin"} to={to}>
            <i className={`bi ${icon}`} />
            {label}
          </NavLink>
        ))}
        <Link to="/" className="mt-auto">
          <i className="bi bi-arrow-left" />
          Về website
        </Link>
      </aside>
      <section className="admin-main">
        <div className="admin-topbar">
          <div>
            <strong>DopTech Admin</strong>
            <div className="small text-secondary">
              Quản lý dữ liệu và vận hành
            </div>
          </div>
          <div className="d-flex align-items-center gap-2">
            <i className="bi bi-person-circle fs-4" />
            <span>{user?.FullName}</span>
          </div>
        </div>
        <div className="admin-content">
          <Outlet />
        </div>
      </section>
    </div>
  );
}
