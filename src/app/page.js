"use client";
import { useState, useEffect } from "react";
import QRCode from "react-qr-code";

export default function Home() {
  const [isLoaded, setIsLoaded] = useState(false);
  const [activeTab, setActiveTab] = useState("dashboard"); // Navigation state
  
  const [tables, setTables] = useState([]);
  const [sales, setSales] = useState([]); // New state to track completed transactions
  
  const [currentBill, setCurrentBill] = useState(null);
  const [pinInput, setPinInput] = useState("");
  const [discountInput, setDiscountInput] = useState("");
  const [discountError, setDiscountError] = useState("");
  
  const clubUpiId = "qatester@ybl"; 
  const clubName = "Snooker Desk Pilot";
  const OWNER_PIN = "1234";

  // Load data from memory
  useEffect(() => {
    const savedTables = localStorage.getItem("snookerTables");
    const savedSales = localStorage.getItem("snookerSales");

    if (savedTables) {
      setTables(JSON.parse(savedTables));
    } else {
      setTables([
        { id: 1, name: "Table 1", status: "Free", startTime: null, pricingMode: "minute", rate: 5, frames: 0 },
        { id: 2, name: "Table 2", status: "Free", startTime: null, pricingMode: "minute", rate: 5, frames: 0 },
        { id: 3, name: "VIP Table", status: "Free", startTime: null, pricingMode: "frame", rate: 150, frames: 0 },
      ]);
    }

    if (savedSales) {
      setSales(JSON.parse(savedSales));
    }

    setIsLoaded(true);
  }, []);

  // Save data to memory on change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem("snookerTables", JSON.stringify(tables));
      localStorage.setItem("snookerSales", JSON.stringify(sales));
    }
  }, [tables, sales, isLoaded]);

  const startTable = (id) => {
    setTables(tables.map(table => 
      table.id === id ? { ...table, status: "In Use", startTime: Date.now(), frames: 0 } : table
    ));
  };

  const addFrame = (id) => {
    setTables(tables.map(table => 
      table.id === id ? { ...table, frames: table.frames + 1 } : table
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
    // 1. Create a record of the sale
    const newSale = {
      id: Date.now(),
      tableName: currentBill.tableName,
      amount: currentBill.finalCost,
      method: method,
      timestamp: new Date().toLocaleString()
    };

    // 2. Add it to the sales list
    setSales([...sales, newSale]);

    // 3. Reset the table
    setTables(tables.map(t => 
      t.id === currentBill.tableId ? { ...t, status: "Free", startTime: null, frames: 0 } : t
    ));
    setCurrentBill(null); 
  };

  const getUpiString = () => {
    if (!currentBill) return "";
    return `upi://pay?pa=${clubUpiId}&pn=${encodeURIComponent(clubName)}&am=${currentBill.finalCost}&cu=INR`;
  };

  if (!isLoaded) return null;

  // Calculate totals for the report
  const totalRevenue = sales.reduce((sum, sale) => sum + sale.amount, 0);
  const totalCash = sales.filter(s => s.method === 'Cash').reduce((sum, sale) => sum + sale.amount, 0);
  const totalUpi = sales.filter(s => s.method === 'UPI').reduce((sum, sale) => sum + sale.amount, 0);

  return (
    <main className="min-h-screen bg-gray-50 font-sans">
      {/* Navigation Bar */}
      <nav className="bg-gray-900 text-white p-4 shadow-md">
        <div className="max-w-6xl mx-auto flex justify-between items-center">
          <h1 className="text-xl font-bold tracking-wider">SNOOKER DESK</h1>
          <div className="flex gap-4">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`px-4 py-2 rounded font-semibold transition ${activeTab === 'dashboard' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            >
              Dashboard
            </button>
            <button 
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 rounded font-semibold transition ${activeTab === 'reports' ? 'bg-blue-600' : 'hover:bg-gray-700'}`}
            >
              Daily Sales
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto p-8">
        
        {/* DASHBOARD TAB */}
        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tables.map((table) => (
              <div key={table.id} className="bg-white border border-gray-200 p-6 rounded-lg shadow-sm flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h2 className="text-xl font-semibold">{table.name}</h2>
                  <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded uppercase tracking-wider font-medium">
                    {table.pricingMode}
                  </span>
                </div>
                
                <p className="mb-4 text-sm text-gray-500 font-medium">
                  Rate: ₹{table.rate} / {table.pricingMode}
                </p>

                <p className="mb-4">
                  Status: <span className={`font-bold ${table.status === 'Free' ? 'text-green-600' : 'text-red-600'}`}>
                    {table.status}
                  </span>
                </p>
                
                {table.pricingMode === 'frame' && table.status === 'In Use' && (
                  <div className="mb-4 p-3 bg-blue-50 border border-blue-100 rounded flex items-center justify-between">
                    <span className="font-medium text-blue-900">Frames Played: {table.frames}</span>
                    <button 
                      onClick={() => addFrame(table.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm font-bold shadow-sm"
                    >
                      +1 Frame
                    </button>
                  </div>
                )}

                <div className="mt-auto flex gap-3">
                  <button 
                    onClick={() => startTable(table.id)}
                    className="bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded disabled:opacity-50 flex-1 font-bold shadow-sm"
                    disabled={table.status === 'In Use'}
                  >
                    START
                  </button>
                  <button 
                    onClick={() => stopTable(table.id)}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded disabled:opacity-50 flex-1 font-bold shadow-sm"
                    disabled={table.status === 'Free'}
                  >
                    STOP
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-200">
            <h2 className="text-2xl font-bold mb-6">Today's Revenue</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
              <div className="bg-gray-900 text-white p-6 rounded-lg">
                <p className="text-sm text-gray-400 uppercase tracking-wider mb-1">Total Collection</p>
                <p className="text-3xl font-bold">₹{totalRevenue}</p>
              </div>
              <div className="bg-green-50 border border-green-200 p-6 rounded-lg text-green-900">
                <p className="text-sm uppercase tracking-wider mb-1 font-semibold">Cash Total</p>
                <p className="text-3xl font-bold">₹{totalCash}</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 p-6 rounded-lg text-blue-900">
                <p className="text-sm uppercase tracking-wider mb-1 font-semibold">UPI Total</p>
                <p className="text-3xl font-bold">₹{totalUpi}</p>
              </div>
            </div>

            <h3 className="text-xl font-bold mb-4">Transaction History</h3>
            {sales.length === 0 ? (
              <p className="text-gray-500 italic">No transactions recorded yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-3 border-b">Time</th>
                      <th className="p-3 border-b">Table</th>
                      <th className="p-3 border-b">Method</th>
                      <th className="p-3 border-b">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sales.slice().reverse().map(sale => (
                      <tr key={sale.id} className="hover:bg-gray-50">
                        <td className="p-3 border-b text-sm text-gray-600">{sale.timestamp}</td>
                        <td className="p-3 border-b font-medium">{sale.tableName}</td>
                        <td className="p-3 border-b">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${sale.method === 'UPI' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}`}>
                            {sale.method}
                          </span>
                        </td>
                        <td className="p-3 border-b font-bold">₹{sale.amount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>

      {/* CHECKOUT MODAL */}
      {currentBill && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
          <div className="bg-white p-8 rounded-xl shadow-2xl w-[450px] text-center max-h-screen overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Checkout: {currentBill.tableName}</h2>
            
            {currentBill.pricingMode === 'minute' ? (
              <p className="text-lg mb-1">Time Played: <strong>{currentBill.minutes} min</strong></p>
            ) : (
              <p className="text-lg mb-1">Frames Played: <strong>{currentBill.frames}</strong></p>
            )}
            
            <div className="bg-gray-50 p-4 rounded-lg mt-4 mb-4 text-left border border-gray-200">
              <p className="flex justify-between text-gray-600">Subtotal: <span>₹{currentBill.originalCost}</span></p>
              {currentBill.discountAmount > 0 && (
                <p className="flex justify-between text-green-600 font-medium">Discount: <span>-₹{currentBill.discountAmount}</span></p>
              )}
              <div className="border-t border-gray-300 my-2"></div>
              <p className="flex justify-between text-2xl font-bold text-gray-900">Total: <span>₹{currentBill.finalCost}</span></p>
            </div>

            {!currentBill.isPinApproved && !currentBill.showPinPrompt && (
              <button 
                onClick={() => setCurrentBill({ ...currentBill, showPinPrompt: true })}
                className="text-blue-600 text-sm font-semibold underline mb-4 block w-full text-right"
              >
                Owner Override: Apply Discount
              </button>
            )}

            {currentBill.showPinPrompt && !currentBill.isPinApproved && (
              <div className="mb-4 bg-red-50 p-4 rounded-lg border border-red-100">
                <p className="text-sm font-bold text-red-800 mb-3">Enter Owner PIN</p>
                <div className="flex gap-2 justify-center">
                  <input 
                    type="password" 
                    value={pinInput}
                    onChange={(e) => setPinInput(e.target.value)}
                    className="border p-2 rounded w-24 text-center font-bold tracking-widest outline-none focus:border-red-500"
                    placeholder="****"
                    maxLength={4}
                  />
                  <button onClick={handlePinSubmit} className="bg-red-600 hover:bg-red-700 transition text-white px-4 py-2 rounded font-bold shadow-sm">Unlock</button>
                </div>
                {discountError && <p className="text-red-500 text-xs mt-2 font-semibold">{discountError}</p>}
              </div>
            )}

            {currentBill.isPinApproved && (
              <div className="mb-4 bg-green-50 p-4 rounded-lg border border-green-100">
                <p className="text-sm font-bold text-green-800 mb-3">Apply Flat Discount (₹)</p>
                <div className="flex gap-2 justify-center">
                  <input 
                    type="number" 
                    value={discountInput}
                    onChange={(e) => setDiscountInput(e.target.value)}
                    className="border p-2 rounded w-24 text-center font-bold outline-none focus:border-green-500"
                    placeholder="0"
                  />
                  <button onClick={applyDiscount} className="bg-green-600 hover:bg-green-700 transition text-white px-4 py-2 rounded font-bold shadow-sm">Apply</button>
                </div>
                {discountError && <p className="text-red-500 text-xs mt-2 font-semibold">{discountError}</p>}
              </div>
            )}
            
            {currentBill.finalCost > 0 && (
              <div className="flex flex-col items-center justify-center mb-6 p-5 border border-gray-200 rounded-lg bg-gray-50">
                <p className="text-sm text-gray-600 mb-3 font-medium">Scan to Pay via any UPI App</p>
                <div className="bg-white p-2 rounded-lg shadow-sm border border-gray-100">
                  <QRCode value={getUpiString()} size={140} />
                </div>
                <p className="text-xs text-gray-400 mt-3 font-mono">{clubUpiId}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => processPayment('Cash')}
                className="bg-gray-800 hover:bg-gray-900 transition text-white px-4 py-3 rounded-lg font-bold shadow-sm"
              >
                Paid in Cash
              </button>
              <button 
                onClick={() => processPayment('UPI')}
                className="bg-blue-600 hover:bg-blue-700 transition text-white px-4 py-3 rounded-lg font-bold shadow-sm"
              >
                Paid via UPI
              </button>
            </div>
            
            <button 
              onClick={() => setCurrentBill(null)}
              className="mt-6 text-red-600 font-semibold text-sm underline hover:text-red-800"
            >
              Cancel & Return to Dashboard
            </button>
          </div>
        </div>
      )}
    </main>
  );
}