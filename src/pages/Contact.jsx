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
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

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

      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitted(false);
      }, 5000);

    } catch (err) {
      console.error("Error sending message:", err);
      setError("Failed to send message. Please try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="pt-24 px-6 md:px-20 pb-20 bg-blue-50 min-h-screen">
      <div className="max-w-6xl mx-auto">

        {/* Header */}
        <div className="text-center mb-14">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-4">
            Contact Us
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto text-lg">
            We would love to hear from you. Reach out to us through any of the channels below 
            or send us a message using the form.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12">

          {/* Contact Information */}
          <div className="space-y-8">

            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
              <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-3">
                <span>🏛️</span> Parish Office
              </h2>
              <div className="space-y-2 text-gray-700">
                <p><strong>Our Lady of the Most Holy Rosary Parish</strong></p>
                <p>Lepanto, Asamuk, Amuria District</p>
                <p>Uganda</p>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
              <h2 className="text-2xl font-bold text-blue-900 mb-6 flex items-center gap-3">
                <span>📞</span> Phone & WhatsApp
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-gray-600 text-sm">Parish Priest</p>
                  <a href="tel:+256772473247" className="text-xl font-semibold text-blue-900 hover:underline">
                    +256 772 473 247
                  </a>
                </div>
                <a 
                  href="https://wa.me/256772473247" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-5 py-3 rounded-2xl text-sm font-medium transition"
                >
                  💬 Message us on WhatsApp
                </a>
              </div>
            </div>

            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
  <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center gap-3">
    <span>✉️</span> Email
  </h2>
  <a 
    href="https://mail.google.com/mail/?view=cm&fs=1&to=mostholyrosarioasamuk@gmail.com"
    target="_blank"
    rel="noopener noreferrer"
    className="text-blue-700 hover:underline text-lg font-medium"
  >
    mostholyrosarioasamuk@gmail.com
  </a>
  <p className="text-sm text-gray-500 mt-1">
    (Opens in Gmail)
  </p>
</div>

            <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
              <h2 className="text-2xl font-bold text-blue-900 mb-4 flex items-center gap-3">
                <span>🕒</span> Office Hours
              </h2>
              <div className="space-y-1 text-gray-700">
                <p><strong>Monday – Friday:</strong> 8:00 AM – 5:00 PM</p>
                <p><strong>Saturday:</strong> 8:00 AM – 1:00 PM</p>
                <p><strong>Sunday:</strong> Closed (except during Mass)</p>
              </div>
            </div>

          </div>

          {/* Contact Form */}
          <div className="bg-white p-8 rounded-3xl border border-gray-200 shadow-sm">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">Send Us a Message</h2>

            {/* Success Message */}
            {submitted && (
              <div className="bg-green-100 border border-green-300 text-green-700 p-4 rounded-2xl mb-6 text-center">
                ✅ Thank you! Your message has been sent successfully. We will respond soon.
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="bg-red-100 border border-red-300 text-red-700 p-4 rounded-2xl mb-6 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Name *</label>
                <input 
                  type="text" 
                  name="name"
                  className="w-full border border-gray-300 p-3.5 rounded-2xl focus:outline-none focus:border-blue-500"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Email Address *</label>
                <input 
                  type="email" 
                  name="email"
                  className="w-full border border-gray-300 p-3.5 rounded-2xl focus:outline-none focus:border-blue-500"
                  placeholder="your@email.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject *</label>
                <select 
                  name="subject"
                  className="w-full border border-gray-300 p-3.5 rounded-2xl focus:outline-none focus:border-blue-500"
                  value={formData.subject}
                  onChange={handleChange}
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
                <label className="block text-sm font-medium text-gray-700 mb-2">Message *</label>
                <textarea 
                  name="message"
                  className="w-full border border-gray-300 p-3.5 rounded-2xl h-40 focus:outline-none focus:border-blue-500" 
                  placeholder="Write your message here..."
                  value={formData.message}
                  onChange={handleChange}
                  required
                />
              </div>

              <button 
                type="submit"
                disabled={submitting}
                className="w-full bg-blue-700 hover:bg-blue-800 disabled:bg-blue-400 text-white py-4 rounded-2xl font-bold transition flex items-center justify-center gap-2"
              >
                {submitting ? "Sending Message..." : "Send Message"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}