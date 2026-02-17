import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Coversheet from './pages/Coversheet';
import OverviewPage from './pages/OverviewPage';
import TrendsPage from './pages/TrendsPage';
import CrimeInYourAreaPage from './pages/CrimeInYourAreaPage';

function App() {
    return (
        <Router>
            <Header />
            <main className="main-content">
                <Routes>
                    <Route path="/" element={<Coversheet />} />
                    <Route path="/overview" element={<OverviewPage />} />
                    <Route path="/trends" element={<TrendsPage />} />
                    <Route path="/crime-in-your-area" element={<CrimeInYourAreaPage />} />
                </Routes>
            </main>
            <Footer />
        </Router>
    );
}

export default App;
