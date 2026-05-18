'use client';
import { useState, useEffect } from 'react';

export default function DeliveryForm() {
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState('');

  useEffect(() => {
    const now = new Date();
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
    setCurrentDateTime(now.toISOString().slice(0, 16));
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const formData = new FormData(e.currentTarget);

    const res = await fetch('/api/submit', {
      method: 'POST',
      body: formData,
    });

    if (res.ok) {
      setSubmitted(true);
    } else {
      alert('Error submitting form. Please check your connection.');
    }
    setLoading(false);
  };

  if (submitted) {
    return (
      <div className="max-w-md mx-auto mt-20 p-8 bg-white shadow-xl rounded-2xl text-center border border-gray-100">
        <div className="text-6xl mb-4">✅</div>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Submission Successful</h1>
        <p className="text-gray-600 mb-8">The delivery details and photos have been emailed to the team.</p>
        <button 
          onClick={() => window.location.reload()}
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all shadow-lg"
        >
          Submit Another Delivery
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-2xl mt-4 mb-10 border border-gray-100">
      <div className="flex flex-col items-center mb-8">
        <img src="/logo.png" alt="Trisome Logo" className="h-16 mb-2 object-contain" />
        <h1 className="text-xl font-bold text-gray-700 uppercase tracking-wide">Warehouse Intake</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Date Picker - Whole field clickable */}
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Submission Date & Time</label>
          <input 
            type="datetime-local" 
            name="submissionDate" 
            defaultValue={currentDateTime}
            className="w-full p-4 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer block" 
            required 
            onClick={(e) => (e.target as any).showPicker?.()} 
          />
        </div>

        {/* Company Fields - Stacked on mobile, side-by-side on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Company Name</label>
            <input 
              type="text"
              name="company" 
              placeholder="Enter Company" 
              className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
              required 
            />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Delivering Company</label>
            <input 
              type="text"
              name="deliveringCompany" 
              placeholder="e.g. FedEx, DHL" 
              className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
              required 
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Description of Item(s)</label>
          <textarea 
            name="description" 
            placeholder="Brief Description Of Items" 
            className="w-full p-4 border border-gray-200 rounded-xl h-28 outline-none focus:ring-2 focus:ring-blue-500" 
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">PO / Job / Attention To</label>
          <input 
            type="text" 
            name="poNumber" 
            placeholder="Enter PO Number" 
            className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
          />
        </div>

        <div className="space-y-4 border border-gray-100 py-6 px-4 rounded-2xl bg-slate-50">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Delivery Orders (Photo)</label>
            <input type="file" name="orderPhoto" accept="image/*" capture="environment" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
          
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Delivered Items (Photo)</label>
            <input type="file" name="itemsPhoto" accept="image/*" capture="environment" className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase mb-1 ml-1">Received By</label>
          <input 
            type="text" 
            name="receivedBy" 
            placeholder="Storeman Name" 
            className="w-full p-4 border border-gray-200 rounded-xl outline-none focus:ring-2 focus:ring-blue-500" 
            required 
          />
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white py-5 rounded-xl font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 disabled:bg-gray-400 transition-all text-xl mt-4"
        >
          {loading ? 'Processing Upload...' : 'Submit Delivery'}
        </button>
      </form>
    </div>
  );
}
