"use client";
import { useState } from "react";
import QRCode from "react-qr-code";

export default function Home() {
  const [tables, setTables] = useState([
    { id: 1, name: "Table 1", status: "Free", startTime: null, pricingMode: "minute", rate: 5, frames: 0 },
    { id: 2, name: "Table 2", status: "Free", startTime: null, pricingMode: "minute", rate: 5, frames: 0 },
    { id: 3, name: "VIP Table", status: "Free", startTime: null, pricingMode: "frame", rate: 150, frames: 0 },
  ]);

  const [currentBill, setCurrentBill] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [discountError, setDiscountError] = useState("");
  
  const clubUpiId = "qatester@ybl"; 
  const clubName = "Snooker Desk Pilot";
  const OWNER_PIN = "1234"; // Hardcoded for MVP

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

    let originalCost = 0;
    let timePlayed = 0;

    if (table.pricingMode === "minute") {
      const endTime = Date.now();
      const diffInMilliseconds = endTime - table.startTime;
      timePlayed = Math.ceil(diffInMilliseconds / 60000); 
      originalCost = timePlayed * table.rate;
    } else if (table.pricingMode === "frame") {
      originalCost = table.frames * table.rate;
    }

    setCurrentBill({
      tableId: id,
      tableName: table.name,
      pricingMode: table.pricingMode,
      minutes: timePlayed,
      frames: table.frames,
      originalCost: originalCost,
      discountAmount: 0,
      finalCost: originalCost,
      isPinApproved: false,
      showPinPrompt: false
    });
    
    setPinInput("");
    setDiscountInput("");
    setDiscountError("");
  };

  const handlePinSubmit = () => {
    if (pinInput === OWNER_PIN) {
      setCurrentBill({ ...currentBill, isPinApproved: true, showPinPrompt: false });
      setDiscountError("");
    } else {
      setDiscountError("Incorrect PIN");
    }
    setPinInput("");
  };

  const applyDiscount = () => {
    const discount = parseInt(discountInput) || 0;
    if (discount < 0 || discount > currentBill.originalCost) {
      setDiscountError("Invalid discount amount");
      return;
    }
    
    setCurrentBill({
      ...currentBill,
      discountAmount: discount,
      finalCost: currentBill.originalCost - discount
    });
    setDiscountError("");
  };

  const processPayment = (method) => {
    console.log(`Payment of ₹${currentBill.finalCost} received via ${method}`);
    
    setTables(tables.map(t => 
      t.id === currentBill.tableId 
        ? { ...t, status: "Free", startTime: null, frames: 0 } 
        : t
    ));
    setCurrentBill(null); 
  };

  const getUpiString = () => {
    if (!currentBill) return "";
    return `upi://pay?pa=${clubUpiId}&pn=${encodeURIComponent(clubName)}&am=${currentBill.finalCost}&cu=INR`;
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
          <div className="bg-white p-8 rounded-lg shadow-lg w-[450px] text-center max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Checkout: {currentBill.tableName}</h2>
            
            {currentBill.pricingMode === 'minute' ? (
              <p className="text-lg mb-1">Time Played: <strong>{currentBill.minutes} min</strong></p>
            ) : (
              <p className="text-lg mb-1">Frames Played: <strong>{currentBill.frames}</strong></p>
            )}
            
            <div className="bg-gray-100 p-4 rounded mt-4 mb-4 text-left">
              <p className="flex justify-between">Subtotal: <span>₹{currentBill.originalCost}</span></p>
              {currentBill.discountAmount > 0 && (
                <p className="flex justify-between text-green-600">Discount: <span>-₹{currentBill.discountAmount}</span></p>
              )}
              <div className="border-t border-gray-300 my-2"></div>
              <p className="flex justify-between text-xl font-bold">Total: <span>₹{currentBill.finalCost}</span></p>
            </div>

            {/* Discount Section */}
            {!currentBill.isPinApproved && !currentBill.showPinPrompt && (
              <button 
                onClick={() => setCurrentBill({ ...currentBill, showPinPrompt: true })}
                className="text-blue-600 text-sm underline mb-4 block w-full text-right"
              >
                Owner Override: Apply Discount
              </button>
            )}

            {currentBill.showPinPrompt && !currentBill.isPinApproved && (
              <div className="mb-4 bg-red-50 p-3 rounded border border-red-100">
                <p className="text-sm font-bold text-red-800 mb-2">Enter Owner PIN</p>
                <div className="flex gap-2 justify-center">
                  <input 
                    type="password" 
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="border p-2 rounded w-24 text-center"
                    placeholder="****"
                    maxLength={4}
                  />
                  <button onClick={handlePinSubmit} className="bg-red-600 text-white px-3 py-2 rounded font-bold">Unlock</button>
                </div>
                {discountError && <p className="text-red-500 text-xs mt-2">{discountError}</p>}
              </div>
            )}

            {currentBill.isPinApproved && (
              <div className="mb-4 bg-green-50 p-3 rounded border border-green-100">
                <p className="text-sm font-bold text-green-800 mb-2">Apply Flat Discount (₹)</p>
                <div className="flex gap-2 justify-center">
                  <input 
                    type="number" 
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    className="border p-2 rounded w-24 text-center"
                    placeholder="0"
                  />
                  <button onClick={applyDiscount} className="bg-green-600 text-white px-3 py-2 rounded font-bold">Apply</button>
                </div>
                {discountError && <p className="text-red-500 text-xs mt-2">{discountError}</p>}
              </div>
            )}
            
            {/* Payment Section */}
            {currentBill.finalCost > 0 && (
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