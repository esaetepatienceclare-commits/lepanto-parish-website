import { useState } from "react";
import { collection, addDoc, Timestamp } from "firebase/firestore";
import { db } from "../firebase";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      await addDoc(collection(db, "contactMessages"), {
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
        timestamp: Timestamp.now(),
        status: "new"
      });

      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });

      setTimeout(() => setSubmitted(false), 5000);
    } catch (err) {
      console.error(err);
      alert("Failed to send message. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-24 px-6 md:px-20 max-w-5xl mx-auto bg-blue-50 min-h-screen pb-20">
      <h1 className="text-4xl font-bold text-blue-900 mb-12 text-center">
        Contact Us
      </h1>

      <div className="grid md:grid-cols-2 gap-12">

        {/* Contact Information */}
        <div className="space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Parish Office</h2>
            <p className="text-gray-700">Our Lady of the Most Holy Rosary Parish</p>
            <p className="text-gray-700">Lepanto, Asamuk, Amuria District</p>
            <p className="text-gray-700">Uganda</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Phone Numbers</h2>
            <p className="text-gray-700">+256 772 473 247 (Priest)</p>
            
          </div>

          <div>
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Email</h2>
            <p className="text-gray-700">mostholyrosarioasamuk@gmail.com</p>
          </div>

          <div>
            <h2 className="text-2xl font-bold text-blue-900 mb-4">Office Hours</h2>
            <p className="text-gray-700">Monday - Friday: 8:00 AM - 5:00 PM</p>
            <p className="text-gray-700">Saturday: 8:00 AM - 1:00 PM</p>
            <p className="text-gray-700">Sunday: Closed (except for Mass)</p>
          </div>
        </div>

        {/* Contact Form */}
        <div>
          <h2 className="text-2xl font-bold text-blue-900 mb-6">Send Us a Message</h2>

          {submitted && (
            <div className="bg-green-100 text-green-700 p-4 rounded-xl mb-6">
              Thank you! Your message has been received.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Your Name</label>
              <input 
                type="text" 
                className="w-full border p-3 rounded-xl"
                placeholder="Clare Patience"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <input 
                type="email" 
                className="w-full border p-3 rounded-xl"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Subject</label>
              <select 
                className="w-full border p-3 rounded-xl"
                value={formData.subject}
                onChange={(e) => setFormData({...formData, subject: e.target.value})}
                required
              >
                <option value="">Select Subject</option>
                <option value="General Inquiry">General Inquiry</option>
                <option value="Mass Schedule">Mass Schedule</option>
                <option value="Event Information">Event Information</option>
                <option value="Prayer Request">Prayer Request</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Message</label>
              <textarea 
                className="w-full border p-3 rounded-xl h-40" 
                placeholder="Write your message here..."
                value={formData.message}
                onChange={(e) => setFormData({...formData, message: e.target.value})}
                required
              />
            </div>

            <button 
              type="submit"
              className="w-full bg-blue-700 text-white py-4 rounded-2xl font-bold hover:bg-blue-800 transition"
              disabled={submitting}
            >
              {submitting ? "Sending..." : "Send Message"}
            </button>
          </form>
        </div>

      </div>

    </div>
  )
}