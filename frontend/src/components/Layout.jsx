import Navbar from './Navbar';

export default function Layout({ children }) {
  return (
    <div style={{ display: 'flex' }}>
      <Navbar />
      <main style={{ marginLeft: 220, flex: 1, padding: '32px', minHeight: '100vh' }}>
        {children}
      </main>
    </div>
  );
}