import { Outlet } from "react-router-dom";
import Header from "../static/Header/Header";
import Sidebar from "../static/Sidebar/Sidebar";
import { useEffect, useState } from "react";
import Load from "../reuse/Load";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./layout.css";
import ScrollToTop from "../reuse/ScrollToTop";

const useLoading = (delay = 1000) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
    }, delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return loading;
};

const Layout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [contentOpen, setContentOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const loading = useLoading();

  return loading ? (
    <Load />
  ) : (
    <div className="layout-container">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        contentOpen={contentOpen}
        setContentOpen={setContentOpen}
        profileOpen={profileOpen}
        setProfileOpen={setProfileOpen}
      />
      <div className="main-content">
        <Header sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        <main className="content-area">
          <Outlet />
        </main>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />

      <ScrollToTop />
    </div>
  );
};

export default Layout;
