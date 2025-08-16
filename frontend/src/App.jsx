// import { Dice1 } from 'lucide-react';
// import './index.css';
// import Login from './pages/Login/Login.jsx';
// import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
// import Sidebar from './components/static/Sidebar/Sidebar.jsx';
// import Dashboard from './pages/Dashboard/Dashboard.jsx';
// import CreateEvent from './pages/Events/CreateEvent.jsx';
// import AllEvents from './pages/Events/AllEvents.jsx';
// import UpcomingEvents from './pages/Events/UpcomingEvents.jsx';
// import Personal from './pages/Profile/Personal.jsx';
// import Account from './pages/Profile/Account.jsx';
// import Regular from './pages/Regular/Regular.jsx'
// import react, {useState} from 'react';

// function App() {

//   const [sidebarOpen, setSidebarOpen] = useState(false);
//   const [productsOpen, setProductsOpen] = useState(false);
//   const [contentOpen, setContentOpen] = useState(false);
//   return (
//     // <Router>
//     //   <Routes>
//     //     <Route path="/login" element={<Login />} />
//     //   </Routes>
//     // </Router>

//     <div className="app-container">
//       <Sidebar
//           sidebarOpen={sidebarOpen}
//           setSidebarOpen={setSidebarOpen}
//           productsOpen={productsOpen}
//           setProductsOpen={setProductsOpen}
//           contentOpen={contentOpen}
//           setContentOpen={setContentOpen}
//         />
//         <div className='content-container'>
//         <Routes>
//           <Route
//               path="/"
//               element={
//                 // <ProtectedRoute>
//                   <Dashboard />
//                 // </ProtectedRoute>
//               }
//             />
//           <Route
//               path="/events/create"
//               element={
//                 // <ProtectedRoute>
//                   <CreateEvent />
//                 // </ProtectedRoute>
//               }
//             />
//           <Route
//               path="/events/all"
//               element={
//                 // <ProtectedRoute>
//                   <AllEvents />
//                 // </ProtectedRoute>
//               }
//             />
//           <Route
//               path="/events/upcoming"
//               element={
//                 // <ProtectedRoute>
//                   <UpcomingEvents />
//                 // </ProtectedRoute>
//               }
//             />
//           <Route
//               path="/profile/personal-information"
//               element={
//                 // <ProtectedRoute>
//                   <Personal />
//                 // </ProtectedRoute>
//               }
//             />
//           <Route
//               path="/profile/account-information"
//               element={
//                 // <ProtectedRoute>
//                   <Account />
//                 // </ProtectedRoute>
//               }
//             />
//           <Route
//               path="/regular"
//               element={
//                 // <ProtectedRoute>
//                   <Regular />
//                 // </ProtectedRoute>
//               }
//             />
//         </Routes>
//         </div>
//     </div>
//   );
// }

// export default App;
