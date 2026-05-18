'use client';
import { useState, useEffect } from 'react';

export default function DeliveryForm() {
  const [loading, setLoading] = useState(false);
  const [currentDateTime, setCurrentDateTime] = useState('');

  // This automatically grabs today's date and time when the form loads
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
      alert('Delivery submitted successfully!');
      (e.target as HTMLFormElement).reset();
      // Reset the date back to current after submitting
      const now = new Date();
      now.setMinutes(now.getMinutes() - now.getTimezoneOffset());
      setCurrentDateTime(now.toISOString().slice(0, 16));
    } else {
      alert('Error submitting form. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg mt-10">
      
      {/* Header with Logo */}
      <div className="flex flex-col items-center border-b pb-6 mb-6">
        <img src="/logo.png" alt="Trisome Logo" className="h-16 mb-4 object-contain" />
        <h1 className="text-2xl font-bold text-gray-800">Delivery Form</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Submission Date & Time</label>
          <input 
            type="datetime-local" 
            name="submissionDate" 
            defaultValue={currentDateTime}
            className="w-full p-2 border rounded bg-gray-50 text-gray-600" 
            required 
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          
          {/* Company Auto-complete List */}
          <div>
            <input list="companies" name="company" placeholder="Company" className="w-full p-2 border rounded" required />
            <datalist id="companies">
              <option value="Frequent Supplier A" />
              <option value="Frequent Supplier B" />
              <option value="Local Parts Inc." />
              {/* Add as many common companies here as you want */}
            </datalist>
          </div>
          
          {/* Delivering Company Auto-complete List */}
          <div>
            <input list="deliveringCompanies" name="deliveringCompany" placeholder="Delivering Company" className="w-full p-2 border rounded" required />
            <datalist id="deliveringCompanies">
              <option value="FedEx" />
              <option value="UPS" />
              <option value="DHL" />
              <option value="Lalamove" />
              <option value="Ninja Van" />
            </datalist>
          </div>

        </div>

        <textarea name="description" placeholder="Description of Item(s)" className="w-full p-2 border rounded h-24" />

        <input type="text" name="poNumber" placeholder="PO / Job Number / Attention To" className="w-full p-2 border rounded" />

        <div className="space-y-4 border-t border-b py-4 my-4 bg-gray-50 px-4 rounded">
          <div>
            <label className="block font-bold text-gray-800 mb-1">Delivery Orders (Photo)</label>
            <input type="file" name="orderPhoto" accept="image/*" capture="environment" className="block w-full text-sm" />
          </div>
          
          <div>
            <label className="block font-bold text-gray-800 mb-1">Delivered Items (Photo)</label>
            <input type="file" name="itemsPhoto" accept="image/*" capture="environment" className="block w-full text-sm" />
          </div>
        </div>

        <input type="text" name="receivedBy" placeholder="Received By" className="w-full p-2 border rounded" required />

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400 transition-colors mt-4"
        >
          {loading ? 'Uploading & Sending Email...' : 'Submit Delivery'}
        </button>
      </form>
    </div>
  );
}
