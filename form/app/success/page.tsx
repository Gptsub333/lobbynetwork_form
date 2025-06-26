'use client';
import { useEffect, useState } from 'react';

export default function SuccessPage() {
  const [sessionData, setSessionData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [updateSuccess, setUpdateSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    if (!sessionId) {
      setError('Missing session_id');
      setLoading(false);
      return;
    }

    const fetchSession = async () => {
      try {
        const res = await fetch(`/api/retrieve-checkout-session?session_id=${sessionId}`);
        const data = await res.json();
        setSessionData(data);
        setLoading(false);
        const recordId = data?.metadata?.recordId;

        // if (data?.customer_details?.email) {
        //   setUpdating(true);
        //   const updateRes = await fetch('/api/updatePaymentStatus', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({
        //       email: data.customer_details.email,
        //       sessionId: data.id,
        //       paymentStatus: 'Paid',
        //     }),
        //   });
        if (recordId) {
          setUpdating(true);
          const updateRes = await fetch('/api/updatePaymentStatus', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              recordId, // use this, not email
              sessionId: data.id,
              paymentStatus: 'Paid',
            }),
          });

          if (updateRes.ok) {
            setUpdateSuccess(true);
          } else {
            const updateError = await updateRes.json();
            console.error('Failed to update payment status:', updateError);
            setError('Failed to update payment status.');
          }
          setUpdating(false);
        }
      } catch (err: any) {
        console.error('❌ Error:', err.message || err);
        setError('Something went wrong. Please try again later.');
        setLoading(false);
      }
    };

    fetchSession();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Success Card */}
        <div className="bg-white/80 backdrop-blur-lg rounded-3xl shadow-2xl border border-white/20 p-8 md:p-12 text-center transform transition-all duration-500 hover:scale-105">
          
          {/* Success Icon */}
          <div className="mb-8">
            <div className="w-20 h-20 md:w-24 md:h-24 mx-auto bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
              <svg className="w-10 h-10 md:w-12 md:h-12 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>

          {/* Main Content */}
          {loading && (
            <div className="space-y-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-500"></div>
                <p className="text-lg text-gray-600 font-medium">Retrieving your session details...</p>
              </div>
            </div>
          )}

          {!loading && sessionData && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-4">
                  Payment Successful!
                </h1>
                <div className="w-24 h-1 bg-gradient-to-r from-emerald-400 to-teal-500 mx-auto rounded-full"></div>
              </div>

              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100">
                <p className="text-xl text-gray-700 mb-2">
                  🎉 Thank you, <span className="font-semibold text-emerald-700">{sessionData.customer_details?.name || 'Customer'}</span>!
                </p>
                <p className="text-gray-600">Your payment has been processed successfully.</p>
              </div>

              {/* Status Updates */}
              <div className="space-y-3">
                {updating && (
                  <div className="flex items-center justify-center space-x-3 bg-blue-50 rounded-lg p-4 border border-blue-200">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500"></div>
                    <p className="text-blue-700 font-medium">Updating payment status...</p>
                  </div>
                )}
                
                {!updating && updateSuccess && (
                  <div className="bg-emerald-50 rounded-lg p-4 border border-emerald-200 animate-slideIn">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <p className="text-emerald-700 font-medium">Payment status updated successfully!</p>
                    </div>
                  </div>
                )}
                
                {error && (
                  <div className="bg-red-50 rounded-lg p-4 border border-red-200 animate-slideIn">
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <p className="text-red-700 font-medium">{error}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 pt-6">
                <button 
                  onClick={() => window.location.href = 'https://www.thelobbynetwork.com/'}
                  disabled={updating || !updateSuccess}
                  className={`flex-1 px-6 py-3 rounded-xl font-semibold shadow-lg transform transition-all duration-200 ${
                    updating || !updateSuccess
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-emerald-500 to-teal-600 text-white hover:shadow-xl hover:scale-105 hover:from-emerald-600 hover:to-teal-700'
                  }`}
                >
                  {updating ? 'Processing...' : 'Back to Home'}
                </button>
              </div>
            </div>
          )}

          {!loading && !sessionData && !error && (
            <div className="space-y-4">
              <div className="w-16 h-16 mx-auto bg-yellow-100 rounded-full flex items-center justify-center">
                <svg className="w-8 h-8 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <p className="text-lg text-gray-600">No session details found.</p>
            </div>
          )}
        </div>

        {/* Decorative Elements */}
        <div className="mt-8 text-center">
          <div className="flex justify-center space-x-6 text-gray-400">
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span className="text-sm">Secure Payment</span>
            </div>
            <div className="flex items-center space-x-2">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              <span className="text-sm">Instant Processing</span>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.6s ease-out;
        }
        
        .animate-slideIn {
          animation: slideIn 0.4s ease-out;
        }
      `}</style>
    </div>
  );
}