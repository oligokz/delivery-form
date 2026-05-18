'use client';
import { useState } from 'react';

export default function DeliveryForm() {
  const [loading, setLoading] = useState(false);

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
    } else {
      alert('Error submitting form.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white shadow-lg rounded-lg">
      <h1 className="text-2xl font-bold border-b pb-4 mb-6">Delivery Form</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium">Submission Date</label>
          <input type="date" name="submissionDate" className="w-full p-2 border rounded" required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <input type="text" name="company" placeholder="Company" className="p-2 border rounded" required />
          <input type="text" name="deliveringCompany" placeholder="Delivering Company" className="p-2 border rounded" required />
        </div>

        <textarea name="description" placeholder="Description of Item(s)" className="w-full p-2 border rounded h-24" />

        <input type="text" name="poNumber" placeholder="PO / Job Number / Attention To" className="w-full p-2 border rounded" />

        <div className="space-y-4 border-t pt-4">
          <label className="block font-bold">Delivery Orders (Photo)</label>
          <input type="file" name="orderPhoto" accept="image/*" capture="environment" className="block w-full text-sm" />
          
          <label className="block font-bold">Delivered Items (Photo)</label>
          <input type="file" name="itemsPhoto" accept="image/*" capture="environment" className="block w-full text-sm" />
        </div>

        <input type="text" name="receivedBy" placeholder="Received By" className="w-full p-2 border rounded" required />

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-blue-600 text-white py-3 rounded font-bold hover:bg-blue-700 disabled:bg-gray-400"
        >
          {loading ? 'Uploading...' : 'Submit Delivery'}
        </button>
      </form>
    </div>
  );
}
