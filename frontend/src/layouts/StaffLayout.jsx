import { NavLink, Outlet, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
export default function StaffLayout() {
  const { user } = useAuth();
  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="brand text-white mb-4" to="/">
          <span>DOP</span>TECH
        </Link>
        <div className="small text-uppercase opacity-50 mb-2">Nhân viên</div>
        <NavLink to="/staff/orders">
          <i className="bi bi-receipt" />
          Đơn hàng
        </NavLink>
        <NavLink to="/staff/inventory">
          <i className="bi bi-building" />
          Kho hàng
        </NavLink>
        <Link to="/" className="mt-auto">
          <i className="bi bi-arrow-left" />
          Về website
        </Link>
      </aside>
      <section className="admin-main">
        <div className="admin-topbar">
          <div>
            <strong>DopTech Staff</strong>
            <div className="small text-secondary">Vận hành đơn hàng và kho</div>
          </div>
          <span>{user?.FullName}</span>
        </div>
        <div className="admin-content">
          <Outlet />
        </div>
      </section>
    </div>
  );
}
