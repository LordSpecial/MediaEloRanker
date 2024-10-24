import { useState } from 'react'
import "../node_modules/bootstrap/dist/css/bootstrap.min.css";
import './App.css'
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
} from "react-router-dom";

function App() {
    const [user, setUser] = useState();
    useEffect(() => {
        auth.onAuthStateChanged((user) => {
            setUser(user);
        });
    });
  return (
    <Router>
        <div className="App">
            <div className="auth-wrapper">
                <div className="auth-inner">
                    <Routes>
                        <Route
                            path="/"
                            element={user ? <Navigate to="/profile" /> : <Login />}
                        />
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<SignUp />} />
                        <Route path="/profile" element={<Profile />} />
                    </Routes>
                </div>
            </div>
        </div>
    </Router>
  )
}

export default App