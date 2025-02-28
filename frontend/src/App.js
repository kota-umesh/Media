import React from "react";
import Login from "./components/Login";
import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
//import PostOnFacebook from './components/PostOnFacebook'; 
import FacebookPost from "./components/FacebookPost";
import Dashboard from "./components/Dashboard";
//import AppLayout from "./components/AppLayout";

// import RichTextEditor from "./components/RichTextEditor";



function App() {
  const isAuthenticated = !!localStorage.getItem("authToken");

  return (
    <BrowserRouter>
      
        <Routes>

        <Route path="/" element={isAuthenticated ? <Navigate to="/dashboard" /> : <Login />} />
        <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/" />} />
            {/* <Route path="/" element={<Login />} /> */}
            {/* <Route path="/RichTextEditor" element={<RichTextEditor />} /> */}
            {/* <Route path="/Dashboard "element={<Dashboard/>}/> */}
            <Route path="/FacebookPost" element={<FacebookPost />} /> 

           
        </Routes>
      
    </BrowserRouter>
  );
}

export default App;