import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Toasts from './components/Toasts';
import useApp from './hooks/useApp';

export default function App() {
  useApp();

  return (
    <>
      <Navbar />
      <div id="sweep" aria-hidden="true"><i></i><b></b><span></span></div>
      <div id="cur" aria-hidden="true"></div>
      <main id="app"></main>
      <Footer />
      <Toasts />
    </>
  );
}
