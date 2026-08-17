"use client";
import { useState } from "react";
import QRCode from "react-qr-code";

export default function Home() {
  // Added pricingMode, rate, and frames to each table
  const [tables, setTables] = useState([
    { id: 1, name: "Table 1", status: "Free", startTime: null, pricingMode: "minute", rate: 5, frames: 0 },
    { id: 2, name: "Table 2", status: "Free", startTime: null, pricingMode: "minute", rate: 5, frames: 0 },
    { id: 3, name: "VIP Table", status: "Free", startTime: null, pricingMode: "frame", rate: 150, frames: 0 },
  ]);

  const [currentBill, setCurrentBill] = useState(null);
  
  const clubUpiId = "qatester@ybl"; 
  const clubName = "Snooker Desk Pilot";

  const startTable = (id) => {
    setTables(tables.map(table => 
      table.id === id 
        ? { ...table, status: "In Use", startTime: Date.now(), frames: 0 } 
        : table
    ));
  };

  const addFrame = (id) => {
    setTables(tables.map(table => 
      table.id === id 
        ? { ...table, frames: table.frames + 1 } 
        : table
    ));
  };

  const stopTable = (id) => {
    const table = tables.find(t => t.id === id);
    if (table.status === "Free") return;

    let cost = 0;
    let timePlayed = 0;

    if (table.pricingMode === "minute") {
      const endTime = Date.now();
      const diffInMilliseconds = endTime - table.startTime;
      timePlayed = Math.ceil(diffInMilliseconds / 60000); 
      cost = timePlayed * table.rate;
    } else if (table.pricingMode === "frame") {
      cost = table.frames * table.rate;
    }

    setCurrentBill({
      tableId: id,
      tableName: table.name,
      pricingMode: table.pricingMode,
      minutes: timePlayed,
      frames: table.frames,
      cost: cost
    });
  };

  const processPayment = (method) => {
    console.log(`Payment of ₹${currentBill.cost} received via ${method}`);
    
    setTables(tables.map(t => 
      t.id === currentBill.tableId 
        ? { ...t, status: "Free", startTime: null, frames: 0 } 
        : t
    ));
    setCurrentBill(null); 
  };

  const getUpiString = () => {
    if (!currentBill) return "";
    return `upi://pay?pa=${clubUpiId}&pn=${encodeURIComponent(clubName)}&am=${currentBill.cost}&cu=INR`;
  };

  return (
    <main className="p-8 font-sans">
      <h1 className="text-3xl font-bold mb-8">Snooker Desk MVP</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tables.map((table) => (
          <div key={table.id} className="border border-gray-300 p-6 rounded-lg shadow-sm flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h2 className="text-xl font-semibold">{table.name}</h2>
              <span className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded uppercase tracking-wider">
                {table.pricingMode}
              </span>
            </div>
            
            <p className="mb-4 text-sm text-gray-600">
              Rate: ₹{table.rate} / {table.pricingMode}
            </p>

            <p className="mb-4">
              Status: <span className={`font-medium ${table.status === 'Free' ? 'text-green-600' : 'text-red-600'}`}>
                {table.status}
              </span>
            </p>
            
            {/* Show frame counter only for frame-based tables that are in use */}
            {table.pricingMode === 'frame' && table.status === 'In Use' && (
              <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded flex items-center justify-between">
                <span className="font-medium text-blue-900">Frames Played: {table.frames}</span>
                <button 
                  onClick={() => addFrame(table.id)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
                >
                  +1 Frame
                </button>
              </div>
            )}

            <div className="mt-auto flex gap-3">
              <button 
                onClick={() => startTable(table.id)}
                className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded disabled:opacity-50 flex-1"
                disabled={table.status === 'In Use'}
              >
                Start
              </button>
              <button 
                onClick={() => stopTable(table.id)}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded disabled:opacity-50 flex-1"
                disabled={table.status === 'Free'}
              >
                Stop
              </button>
            </div>
          </div>
        ))}
      </div>

      {currentBill && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-lg shadow-lg w-[400px] text-center">
            <h2 className="text-2xl font-bold mb-4">Checkout: {currentBill.tableName}</h2>
            
            {currentBill.pricingMode === 'minute' ? (
              <p className="text-lg mb-1">Time Played: <strong>{currentBill.minutes} min</strong></p>
            ) : (
              <p className="text-lg mb-1">Frames Played: <strong>{currentBill.frames}</strong></p>
            )}
            
            <p className="text-xl mb-6">Total Amount: <strong>₹{currentBill.cost}</strong></p>
            
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