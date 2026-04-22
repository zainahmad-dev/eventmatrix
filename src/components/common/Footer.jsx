import { Mail, PhoneCall } from 'lucide-react';

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <p>EventMatrix keeps bookings, staff, inventory, and payments in one place.</p>
        <div className="footer-links">
          <span>
            <Mail size={15} />
            support@eventmatrix.local
          </span>
          <span>
            <PhoneCall size={15} />
            +1 (555) 014-2026
          </span>
        </div>
      </div>
    </footer>
  );
}
