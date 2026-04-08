import { useEffect, useMemo, useState } from 'react';
import { FileText } from 'lucide-react';
import {
  addInvoicePayment,
  downloadInvoiceText,
  generateQuotationsFromBookings,
  getQuotationOverview,
} from '../../../api/quotationInvoices';

const formatPKR = (amount) => `PKR ${Number(amount || 0).toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function QuotationInvoicesPanel({ bookings }) {
  const [rows, setRows] = useState([]);
  const [statusMessage, setStatusMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const approvedBookings = useMemo(
    () => bookings.filter((booking) => booking.status === 'approved'),
    [bookings],
  );

  const loadOverview = async () => {
    setLoading(true);
    try {
      const data = await getQuotationOverview();
      setRows(data);
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
  }, []);

  const handleGenerateFromApproved = async () => {
    if (!approvedBookings.length) {
      setStatusMessage('No approved bookings are available yet. Approve bookings first.');
      return;
    }

    setLoading(true);
    setStatusMessage('');
    try {
      const response = await generateQuotationsFromBookings(approvedBookings);
      setStatusMessage(response.summary);
      await loadOverview();
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRecordPayment = async (row, mode) => {
    if (!row.paymentId) {
      setStatusMessage('Payment record is missing for this invoice.');
      return;
    }

    const amount = mode === 'full' ? Number(row.dueAmount || 0) : Math.min(5000, Number(row.dueAmount || 0));
    if (amount <= 0) {
      setStatusMessage('This invoice is already fully paid.');
      return;
    }

    setLoading(true);
    setStatusMessage('');
    try {
      const paymentResult = await addInvoicePayment(row.paymentId, amount, mode === 'full' ? 'full_settlement' : 'partial');
      setStatusMessage(`Payment recorded: ${formatPKR(paymentResult.acceptedAmount)} for ${row.invoiceNumber}.`);
      await loadOverview();
    } catch (error) {
      setStatusMessage(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (row) => {
    try {
      await downloadInvoiceText(row.id, row.invoiceNumber || 'invoice');
      setStatusMessage(`Downloaded ${row.invoiceNumber}.`);
    } catch (error) {
      setStatusMessage(error.message);
    }
  };

  const totals = useMemo(() => {
    const totalInvoiced = rows.reduce((sum, row) => sum + Number(row.totalPrice || 0), 0);
    const totalCollected = rows.reduce((sum, row) => sum + Number(row.paidAmount || 0), 0);
    const totalDue = rows.reduce((sum, row) => sum + Number(row.dueAmount || 0), 0);
    return { totalInvoiced, totalCollected, totalDue };
  }, [rows]);

  return (
    <article className="dashboard-card dashboard-card--wide admin-animate-card">
      <div className="dashboard-card-header">
        <FileText size={18} />
        <h3>Quotation & Invoices</h3>
      </div>

      <p className="dashboard-copy">
        Generate quotation/invoice records from approved bookings, track payment status, and download invoice files.
      </p>

      <div className="invoice-toolbar">
        <button type="button" onClick={handleGenerateFromApproved} disabled={loading}>
          Generate From Approved Bookings
        </button>
        <button type="button" onClick={loadOverview} disabled={loading}>
          Refresh Invoice Data
        </button>
      </div>

      <div className="invoice-totals">
        <span>Total Invoiced: {formatPKR(totals.totalInvoiced)}</span>
        <span>Collected: {formatPKR(totals.totalCollected)}</span>
        <span>Due: {formatPKR(totals.totalDue)}</span>
      </div>

      {statusMessage ? <p className="dashboard-copy">{statusMessage}</p> : null}

      {rows.length ? (
        <div className="invoice-list">
          {rows.map((row) => (
            <div className="invoice-row" key={row.id}>
              <div>
                <strong>{row.invoiceNumber}</strong>
                <p>{row.customerName} | {row.eventType} | {row.eventDate || 'Date pending'}</p>
                <p>Total: {formatPKR(row.totalPrice)} | Paid: {formatPKR(row.paidAmount)} | Due: {formatPKR(row.dueAmount)}</p>
                <span className={`booking-status booking-status--${row.paymentStatus === 'paid' ? 'approved' : 'pending'}`}>
                  {row.paymentStatus}
                </span>
              </div>
              <div className="booking-admin-actions">
                <button type="button" onClick={() => handleDownload(row)}>Download</button>
                <button type="button" onClick={() => handleRecordPayment(row, 'partial')} disabled={loading || Number(row.dueAmount || 0) <= 0}>
                  Add PKR 5,000
                </button>
                <button type="button" onClick={() => handleRecordPayment(row, 'full')} disabled={loading || Number(row.dueAmount || 0) <= 0}>
                  Mark Fully Paid
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="dashboard-copy">No quotation/invoice records yet. Approve booking requests, then generate records.</p>
      )}
    </article>
  );
}
