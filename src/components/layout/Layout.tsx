import { ReactNode } from 'react';
import Navbar from './Navbar';
import '../../styles/Layout.css';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  return (
    <div className="layout">
      <Navbar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}

export default Layout;