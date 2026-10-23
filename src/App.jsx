import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toasts from './components/Toasts';
import useApp from './hooks/useApp';

export default function App() {
  useApp();

  return (
    <>
      <Navbar />
      <main id="app"></main>
      <Footer />
      <Toasts />
    </>
  );
}
