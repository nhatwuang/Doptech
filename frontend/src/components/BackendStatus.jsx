import { useEffect, useState } from "react";
import api from "../services/api";
export default function BackendStatus() {
  const [down, setDown] = useState(false);
  useEffect(() => {
    api
      .get("/health", { timeout: 4000 })
      .then(() => setDown(false))
      .catch(() => setDown(true));
  }, []);
  return down ? (
    <div className="alert alert-danger rounded-0 text-center mb-0 py-2">
      <i className="bi bi-exclamation-triangle" /> Không kết nối được DopTech
      Backend tại cổng 4001. Kiểm tra <code>npm run dev</code> và SQL Server.
    </div>
  ) : null;
}
