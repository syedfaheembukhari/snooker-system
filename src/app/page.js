"use client";
import { useState } from "react";
import QRCode from "react-qr-code";

export default function Home() {
  const [tables, setTables] = useState([
    { id: 1, name: "Table 1", status: "Free", startTime: null },
    { id: 2, name: "Table 2", status: "Free", startTime: null },
    { id: 3, name: "VIP Table", status: "Free", startTime: null },
  ]);

  const [currentBill, setCurrentBill] = useState(null);
  
  // Hardcoded for MVP Phase 1. Later, this will come from the database per club.
  const ratePerMinute = 5; 
  const clubUpiId = "qatester@ybl"; 
  const clubName = "Snooker Desk Pilot";

  const startTable = (id) => {
    setTables(tables.map(table => 
      table.id === id 
        ? { ...table, status: "In Use", startTime: Date.now() } 
        : table
    ));
  };

  const stopTable = (id) => {
    const table = tables.find(t => t.id === id);
    if (table.status === "Free") return;

    const endTime = Date.now();
    const diffInMilliseconds = endTime - table.startTime;
    const diffInMinutes = Math.ceil(diffInMilliseconds / 60000); 
    const cost = diffInMinutes * ratePerMinute;

    setCurrentBill({
      tableId: id,
      tableName: table.name,
      minutes: diffInMinutes,
      cost: cost
    });
  };

  // We now accept the payment method to log it (Cash or UPI)
  const processPayment = (method) => {
    // In the future, we will send this data to your database here.
    console.log(`Payment of ₹${currentBill.cost} received via ${method}`);

    // Reset the table to Free
    setTables(tables.map(t => 
      t.id === currentBill.tableId 
        ? { ...t, status: "Free", startTime: null } 
        : t
    ));
    // Close the modal
    setCurrentBill(null); 
  };

  // Generate standard UPI deep-link format
  const getUpiString = () => {
    if (!currentBill) return "";
    return `upi://pay?pa=${clubUpiId}&pn=${encodeURIComponent(clubName)}&am=${currentBill.cost}&cu=INR`;
  };

  return (
    <main className="p-8 font-sans">
      <h1 className="text-3xl font-bold mb-8">Snooker Desk MVP</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tables.map((table) => (
          <div key={table.id} className="border border-gray-300 p-6 rounded-lg shadow-sm">
            <h2 className="text-xl font-semibold mb-2">{table.name}</h2>
            <p className="mb-4">
              Status: <span className={`font-medium ${table.status === 'Free' ? 'text-green-600' : 'text-red-600'}`}>
                {table.status}
              </span>
            </p>
            
            <div className="flex gap-3">
              <button 
                onClick={() => startTable(table.id)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50"
                disabled={table.status === 'In Use'}
              >
                Start
              </button>
              <button 
                onClick={() => stopTable(table.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50"
                disabled={table.status === 'Free'}
              >
                Stop
              </button>
            </div>
          </div>
        ))}
      </div>

      {currentBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-white p-8 rounded-lg shadow-lg w-[400px] text-center">
            <h2 className="text-2xl font-bold mb-4">Checkout: {currentBill.tableName}</h2>
            <p className="text-lg mb-1">Time Played: <strong>{currentBill.minutes} min</strong></p>
            <p className="text-xl mb-6">Total Amount: <strong>₹{currentBill.cost}</strong></p>
            
            {/* UPI QR Code Display */}
            {currentBill.cost > 0 && (
              <div className="flex flex-col items-center justify-center mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-600 mb-3">Scan to Pay via any UPI App</p>
                <div className="bg-white p-2 rounded">
                  <QRCode value={getUpiString()} size={150} />
                </div>
                <p className="text-xs text-gray-500 mt-2">{clubUpiId}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => processPayment('Cash')}
                className="bg-gray-800 hover:bg-gray-900 text-white px-4 py-3 rounded font-bold"
              >
                Paid in Cash
              </button>
              <button 
                onClick={() => processPayment('UPI')}
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded font-bold"
              >
                Paid via UPI
              </button>
            </div>
            
            <button 
              onClick={() => setCurrentBill(null)}
              className="mt-4 text-red-600 text-sm underline"
            >
              Cancel & Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </main>
  );
}